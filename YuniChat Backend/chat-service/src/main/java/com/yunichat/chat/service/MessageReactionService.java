package com.yunichat.chat.service;

import com.yunichat.chat.dto.MessageReactionResponse;
import com.yunichat.chat.entity.Message;
import com.yunichat.chat.entity.MessageReaction;
import com.yunichat.chat.repository.MessageReactionRepository;
import com.yunichat.chat.repository.MessageRepository;
import com.yunichat.common.exception.BadRequestException;
import com.yunichat.common.exception.ResourceNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageReactionService {

    private final MessageReactionRepository reactionRepository;
    private final MessageRepository messageRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Transactional
    public MessageReactionResponse addReaction(Long messageId, Long userId, String emoji) {
        // Verify message exists
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        // Check if user already reacted with this emoji
        if (reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji).isPresent()) {
            throw new BadRequestException("You have already reacted with this emoji");
        }
        
        MessageReaction reaction = MessageReaction.builder()
                .messageId(messageId)
                .userId(userId)
                .emoji(emoji)
                .build();
        
        reaction = reactionRepository.save(reaction);
        log.info("User {} added reaction {} to message {}", userId, emoji, messageId);
        
        MessageReactionResponse response = mapToResponse(reaction);
        
        // Broadcast reaction to all participants
        if (message.getRoomId().startsWith("private_")) {
            // Extract user IDs from room ID
            String[] parts = message.getRoomId().split("_");
            Long userId1 = Long.parseLong(parts[1]);
            Long userId2 = Long.parseLong(parts[2]);
            
            // Send to both users
            messagingTemplate.convertAndSendToUser(userId1.toString(), "/queue/message-reaction", response);
            messagingTemplate.convertAndSendToUser(userId2.toString(), "/queue/message-reaction", response);
        } else {
            messagingTemplate.convertAndSend("/topic/room/" + message.getRoomId() + "/reaction", response);
        }
        
        return response;
    }

    @Transactional
    public void removeReaction(Long messageId, Long userId, String emoji) {
        MessageReaction reaction = reactionRepository.findByMessageIdAndUserIdAndEmoji(messageId, userId, emoji)
                .orElseThrow(() -> new ResourceNotFoundException("Reaction not found"));
        
        Message message = messageRepository.findById(messageId)
                .orElseThrow(() -> new ResourceNotFoundException("Message not found"));
        
        reactionRepository.delete(reaction);
        log.info("User {} removed reaction {} from message {}", userId, emoji, messageId);
        
        // Broadcast reaction removal
        Map<String, Object> removalData = Map.of(
            "reactionId", reaction.getId(),
            "messageId", messageId,
            "userId", userId,
            "emoji", emoji
        );
        
        if (message.getRoomId().startsWith("private_")) {
            String[] parts = message.getRoomId().split("_");
            Long userId1 = Long.parseLong(parts[1]);
            Long userId2 = Long.parseLong(parts[2]);
            
            messagingTemplate.convertAndSendToUser(userId1.toString(), "/queue/message-reaction-remove", removalData);
            messagingTemplate.convertAndSendToUser(userId2.toString(), "/queue/message-reaction-remove", removalData);
        } else {
            messagingTemplate.convertAndSend("/topic/room/" + message.getRoomId() + "/reaction-remove", removalData);
        }
    }

    public List<MessageReactionResponse> getMessageReactions(Long messageId) {
        List<MessageReaction> reactions = reactionRepository.findByMessageId(messageId);
        
        return reactions.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<MessageReactionResponse.ReactionSummary> getReactionSummary(Long messageId, Long currentUserId) {
        List<MessageReaction> reactions = reactionRepository.findByMessageId(messageId);
        
        // Group by emoji and count
        Map<String, List<MessageReaction>> groupedByEmoji = reactions.stream()
                .collect(Collectors.groupingBy(MessageReaction::getEmoji));
        
        return groupedByEmoji.entrySet().stream()
                .map(entry -> {
                    String emoji = entry.getKey();
                    List<MessageReaction> emojiReactions = entry.getValue();
                    boolean userReacted = emojiReactions.stream()
                            .anyMatch(r -> r.getUserId().equals(currentUserId));
                    
                    return MessageReactionResponse.ReactionSummary.builder()
                            .emoji(emoji)
                            .count((long) emojiReactions.size())
                            .userReacted(userReacted)
                            .build();
                })
                .collect(Collectors.toList());
    }

    private MessageReactionResponse mapToResponse(MessageReaction reaction) {
        return MessageReactionResponse.builder()
                .id(reaction.getId())
                .messageId(reaction.getMessageId())
                .userId(reaction.getUserId())
                .emoji(reaction.getEmoji())
                .createdAt(reaction.getCreatedAt())
                .build();
    }
}
