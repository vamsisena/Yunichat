package com.yunichat.chat.service;

import com.yunichat.chat.dto.MessageRequest;
import com.yunichat.chat.dto.MessageResponse;
import com.yunichat.chat.entity.Message;
import com.yunichat.chat.repository.MessageRepository;
import com.yunichat.chat.repository.RoomMemberRepository;
import com.yunichat.common.exception.BadRequestException;
import com.yunichat.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageService {

    private final MessageRepository messageRepository;
    private final RoomMemberRepository roomMemberRepository;
    private final SimpMessagingTemplate messagingTemplate;
    private final RestTemplate restTemplate = new RestTemplate();
    
    @Value("${USER_SERVICE_URL:http://localhost:8082}")
    private String userServiceUrl;

    @Transactional
    public MessageResponse sendMessage(MessageRequest request, Long senderId, String senderUsername) {
        // For private messages (no roomId or starts with "private_"), skip room checks
        boolean isPrivateMessage = request.getRoomId() == null || request.getRoomId().startsWith("private_") || request.getRecipientId() != null;
        
        // Check if sender is ignored by recipient for private messages
        if (isPrivateMessage && request.getRecipientId() != null) {
            if (isUserIgnored(request.getRecipientId(), senderId)) {
                log.warn("Message blocked: User {} has ignored user {}", request.getRecipientId(), senderId);
                throw new BadRequestException("Unable to send message. This user has restricted messages from you.");
            }
        }
        
        if (!isPrivateMessage && !"public".equals(request.getRoomId())) {
            // Verify user is member of the room (for non-public rooms only)
            if (!roomMemberRepository.existsByRoomIdAndUserId(request.getRoomId(), senderId)) {
                throw new BadRequestException("User is not a member of this room");
            }
        }
        
        Message message = Message.builder()
                .roomId(request.getRoomId() != null ? request.getRoomId() : "private_" + Math.min(senderId, request.getRecipientId()) + "_" + Math.max(senderId, request.getRecipientId()))
                .senderId(senderId)
                .content(request.getContent())
                .type(request.getType())
                .fileUrl(request.getFileUrl())
                .fileName(request.getFileName())
                .voiceUrl(request.getVoiceUrl())
                .voiceDuration(request.getVoiceDuration())
                .mentionedUserIds(request.getMentionedUserIds())
                .isEdited(false)
                .isDeleted(false)
                .build();
        
        message = messageRepository.save(message);
        log.info("Message sent - type: {}, room: {}, sender: {}, mentions: {}", isPrivateMessage ? "PRIVATE" : "PUBLIC", message.getRoomId(), senderId, request.getMentionedUserIds());
        
        MessageResponse response = mapToMessageResponse(message, senderUsername);
        
        // Send mention notifications
        if (request.getMentionedUserIds() != null && !request.getMentionedUserIds().isEmpty()) {
            for (Long mentionedUserId : request.getMentionedUserIds()) {
                if (!mentionedUserId.equals(senderId)) {
                    Map<String, Object> mentionNotification = Map.of(
                        "messageId", message.getId(),
                        "senderId", senderId,
                        "senderUsername", senderUsername,
                        "content", request.getContent(),
                        "chatType", isPrivateMessage ? "PRIVATE" : "PUBLIC",
                        "roomId", message.getRoomId()
                    );
                    messagingTemplate.convertAndSend("/user/" + mentionedUserId + "/queue/mentions", mentionNotification);
                    log.info("Sent mention notification to user {}", mentionedUserId);
                }
            }
        }
        
        // Only broadcast to room topic for non-private messages
        if (!isPrivateMessage) {
            messagingTemplate.convertAndSend("/topic/room/" + request.getRoomId(), response);
            log.info("Broadcasted to /topic/room/{}", request.getRoomId());
        }
        
        return response;
    }
    
    private boolean isUserIgnored(Long ignorerId, Long targetUserId) {
        try {
            String url = userServiceUrl + "/api/users/ignore/status/" + targetUserId;
            log.debug("Checking ignore status: ignorer={}, target={}, url={}", ignorerId, targetUserId, url);
            
            org.springframework.http.HttpHeaders headers = new org.springframework.http.HttpHeaders();
            headers.set("X-User-Id", ignorerId.toString());
            org.springframework.http.HttpEntity<String> entity = new org.springframework.http.HttpEntity<>(headers);
            
            @SuppressWarnings("unchecked")
            org.springframework.http.ResponseEntity<Map> responseEntity = restTemplate.exchange(
                url,
                org.springframework.http.HttpMethod.GET,
                entity,
                Map.class
            );
            
            Map<String, Object> response = responseEntity.getBody();
            if (response != null && response.get("data") != null) {
                Boolean isIgnored = (Boolean) response.get("data");
                log.debug("Ignore status check result: {}", isIgnored);
                return isIgnored != null && isIgnored;
            }
        } catch (Exception e) {
            log.error("Error checking ignore status between {} and {}: {}", ignorerId, targetUserId, e.getMessage());
            // Return false on error to allow message (fail-open)
        }
        return false;
    }

    public List<MessageResponse> getRoomMessages(String roomId, int page, int size) {
        // For public chat, only return messages from the last 30 minutes
        if ("public".equals(roomId)) {
            LocalDateTime thirtyMinutesAgo = LocalDateTime.now().minusMinutes(30);
            List<Message> messages = messageRepository.findByRoomIdAndCreatedAtAfter(roomId, thirtyMinutesAgo);
            
            return messages.stream()
                    .map(msg -> mapToMessageResponse(msg, "User" + msg.getSenderId()))
                    .collect(Collectors.toList());
        }
        
        // For other rooms, use pagination
        Pageable pageable = PageRequest.of(page, size);
        Page<Message> messages = messageRepository.findByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(roomId, pageable);
        
        // Note: In production, fetch usernames from User Service
        return messages.getContent().stream()
                .map(msg -> mapToMessageResponse(msg, "User" + msg.getSenderId()))
                .collect(Collectors.toList());
    }

    public List<MessageResponse> getMessagesSince(String roomId, LocalDateTime since) {
        List<Message> messages = messageRepository.findByRoomIdAndCreatedAtAfter(roomId, since);
        
        return messages.stream()
                .map(msg -> mapToMessageResponse(msg, "User" + msg.getSenderId()))
                .collect(Collectors.toList());
    }

    @Transactional
    public MessageResponse editMessage(Long messageId, String newContent, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        if (!message.getSenderId().equals(userId)) {
            throw new BadRequestException("You can only edit your own messages");
        }
        
        if (message.getIsDeleted()) {
            throw new BadRequestException("Cannot edit deleted message");
        }
        
        message.setContent(newContent);
        message.setIsEdited(true);
        message.setEditedAt(LocalDateTime.now());
        
        message = messageRepository.save(message);
        log.info("Message {} edited by user {}", messageId, userId);
        
        MessageResponse response = mapToMessageResponse(message, "User" + userId);
        
        // Broadcast update - for private messages, send to specific user
        if (message.getRoomId().startsWith("private_")) {
            // Extract recipient ID from room ID
            String[] parts = message.getRoomId().split("_");
            Long userId1 = Long.parseLong(parts[1]);
            Long userId2 = Long.parseLong(parts[2]);
            Long recipientId = userId.equals(userId1) ? userId2 : userId1;
            
            // Send to both sender and recipient
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/message-edit", response);
            messagingTemplate.convertAndSendToUser(recipientId.toString(), "/queue/message-edit", response);
        } else {
            messagingTemplate.convertAndSend("/topic/room/" + message.getRoomId() + "/edit", response);
        }
        
        return response;
    }

    @Transactional
    public void deleteMessage(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        if (!message.getSenderId().equals(userId)) {
            throw new BadRequestException("You can only delete your own messages");
        }
        
        message.setIsDeleted(true);
        message.setContent("[Message deleted]");
        message = messageRepository.save(message);
        
        log.info("Message {} deleted by user {}", messageId, userId);
        
        MessageResponse response = mapToMessageResponse(message, "User" + userId);
        
        // Broadcast deletion - for private messages, send to specific user
        if (message.getRoomId().startsWith("private_")) {
            // Extract recipient ID from room ID
            String[] parts = message.getRoomId().split("_");
            Long userId1 = Long.parseLong(parts[1]);
            Long userId2 = Long.parseLong(parts[2]);
            Long recipientId = userId.equals(userId1) ? userId2 : userId1;
            
            // Send to both sender and recipient
            messagingTemplate.convertAndSendToUser(userId.toString(), "/queue/message-delete", response);
            messagingTemplate.convertAndSendToUser(recipientId.toString(), "/queue/message-delete", response);
        } else {
            messagingTemplate.convertAndSend("/topic/room/" + message.getRoomId() + "/delete", response);
        }
    }

    public long getRoomMessageCount(String roomId) {
        return messageRepository.countByRoomIdAndIsDeletedFalse(roomId);
    }

    public List<MessageResponse> getPrivateMessages(Long userId1, Long userId2) {
        // Use the consistent room ID generation
        String roomId = generatePrivateRoomId(userId1, userId2);
        
        log.info("Fetching private messages with roomId={}", roomId);
        
        // Use the repository method to fetch messages from both room combinations for backward compatibility
        String roomId1 = roomId;
        String roomId2 = "private_" + Math.max(userId1, userId2) + "_" + Math.min(userId1, userId2);
        List<Message> messages = messageRepository.findPrivateMessages(roomId1, roomId2);
        
        log.info("Found {} private messages", messages.size());
        
        return messages.stream()
                .map(msg -> mapToMessageResponse(msg, "User" + msg.getSenderId()))
                .collect(Collectors.toList());
    }

    /**
     * Generates a consistent private room ID for two users
     */
    private String generatePrivateRoomId(Long userId1, Long userId2) {
        return "private_" + Math.min(userId1, userId2) + "_" + Math.max(userId1, userId2);
    }

    /**
     * Scheduled job that runs every hour to cleanup old public chat messages
     * Messages older than 30 minutes are permanently deleted from the database
     */
    @Scheduled(fixedRate = 3600000) // Run every hour (3600000 milliseconds)
    @Transactional
    public void cleanupOldPublicMessages() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(30);
        List<Message> oldMessages = messageRepository.findByRoomIdAndCreatedAtBefore("public", cutoffTime);
        
        if (!oldMessages.isEmpty()) {
            messageRepository.deleteAll(oldMessages);
            log.info("Scheduled cleanup: Deleted {} public messages older than 30 minutes", oldMessages.size());
        } else {
            log.debug("Scheduled cleanup: No public messages to delete");
        }
    }

    /**
     * Manual cleanup method for testing or immediate cleanup
     * Returns the number of messages deleted
     */
    @Transactional
    public int cleanupOldPublicMessagesNow() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusMinutes(30);
        List<Message> oldMessages = messageRepository.findByRoomIdAndCreatedAtBefore("public", cutoffTime);
        
        int count = oldMessages.size();
        if (count > 0) {
            messageRepository.deleteAll(oldMessages);
            log.info("Manual cleanup: Deleted {} public messages older than 30 minutes", count);
        } else {
            log.info("Manual cleanup: No public messages to delete");
        }
        
        return count;
    }

    /**
     * Mark messages as read when user opens/views a chat
     * Notifies the sender via WebSocket that their message was read
     */
    @Transactional
    public int markMessagesAsRead(String roomId, Long userId) {
        List<Message> unreadMessages = messageRepository.findUnreadMessagesForUser(roomId, userId);
        
        if (unreadMessages.isEmpty()) {
            log.debug("No unread messages to mark as read for user {} in room {}", userId, roomId);
            return 0;
        }
        
        LocalDateTime readAt = LocalDateTime.now();
        
        for (Message message : unreadMessages) {
            message.setIsRead(true);
            message.setReadAt(readAt);
            messageRepository.save(message);
            
            // Notify the sender via WebSocket that their message was read
            MessageResponse response = mapToMessageResponse(message, "User" + message.getSenderId());
            messagingTemplate.convertAndSendToUser(
                message.getSenderId().toString(),
                "/queue/read-receipt",
                response
            );
            
            log.info("Message {} marked as read by user {} in room {}", message.getId(), userId, roomId);
        }
        
        log.info("Marked {} messages as read for user {} in room {}", unreadMessages.size(), userId, roomId);
        return unreadMessages.size();
    }

    /**
     * Mark a specific message as read
     */
    @Transactional
    public MessageResponse markMessageAsRead(Long messageId, Long userId) {
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        // Only mark as read if the user is not the sender
        if (message.getSenderId().equals(userId)) {
            throw new BadRequestException("Cannot mark your own message as read");
        }
        
        if (message.getIsRead()) {
            log.debug("Message {} already marked as read", messageId);
            return mapToMessageResponse(message, "User" + message.getSenderId());
        }
        
        message.setIsRead(true);
        message.setReadAt(LocalDateTime.now());
        message = messageRepository.save(message);
        
        log.info("Message {} marked as read by user {}", messageId, userId);
        
        MessageResponse response = mapToMessageResponse(message, "User" + message.getSenderId());
        
        // Notify the sender via WebSocket that their message was read
        messagingTemplate.convertAndSendToUser(
            message.getSenderId().toString(),
            "/queue/read-receipt",
            response
        );
        
        return response;
    }

    private MessageResponse mapToMessageResponse(Message message, String senderUsername) {
        // Extract recipientId for private messages
        Long recipientId = null;
        if (message.getRoomId() != null && message.getRoomId().startsWith("private_")) {
            String[] parts = message.getRoomId().split("_");
            if (parts.length == 3) {
                Long userId1 = Long.parseLong(parts[1]);
                Long userId2 = Long.parseLong(parts[2]);
                recipientId = message.getSenderId().equals(userId1) ? userId2 : userId1;
            }
        }
        
        return MessageResponse.builder()
                .id(message.getId())
                .roomId(message.getRoomId())
                .senderId(message.getSenderId())
                .recipientId(recipientId)
                .senderUsername(senderUsername)
                .content(message.getContent())
                .type(message.getType())
                .fileUrl(message.getFileUrl())
                .fileName(message.getFileName())
                .voiceUrl(message.getVoiceUrl())
                .voiceDuration(message.getVoiceDuration())
                .isEdited(message.getIsEdited())
                .isDeleted(message.getIsDeleted())
                .isRead(message.getIsRead())
                .readAt(message.getReadAt())
                .createdAt(message.getCreatedAt())
                .editedAt(message.getEditedAt())
                .mentionedUserIds(message.getMentionedUserIds())
                .build();
    }
}
