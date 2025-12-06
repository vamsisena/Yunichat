package com.yunichat.chat.controller;

import com.yunichat.chat.dto.CallSignalRequest;
import com.yunichat.chat.dto.CallSignalResponse;
import com.yunichat.chat.dto.MessageEditRequest;
import com.yunichat.chat.dto.MessageReactionRequest;
import com.yunichat.chat.dto.MessageRequest;
import com.yunichat.chat.dto.MessageResponse;
import com.yunichat.chat.dto.TypingIndicator;
import com.yunichat.chat.service.MessageReactionService;
import com.yunichat.chat.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;

@Controller
@RequiredArgsConstructor
@Slf4j
public class WebSocketController {

    private final MessageService messageService;
    private final MessageReactionService reactionService;
    private final SimpMessagingTemplate messagingTemplate;
    private final com.yunichat.chat.service.WebSocketPresenceService presenceService;

    @MessageMapping("/chat.sendMessage")
    public void sendMessage(@Payload MessageRequest message, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (userId == null) {
            log.warn("User ID not found in session");
            return;
        }
        
        log.info("WebSocket message received: room={}, user={}, content={}", message.getRoomId(), userId, message.getContent());
        
        try {
            // MessageService already broadcasts the message, no need to do it here
            messageService.sendMessage(message, userId, username != null ? username : "User" + userId);
            log.info("Message sent successfully to room {}", message.getRoomId());
        } catch (Exception e) {
            log.error("Error sending message via WebSocket", e);
        }
    }

    @MessageMapping("/chat.typing")
    public void handleTyping(@Payload TypingIndicator indicator) {
        log.debug("Typing indicator: room={}, user={}, typing={}", 
                indicator.getRoomId(), indicator.getUserId(), indicator.getIsTyping());
        
        messagingTemplate.convertAndSend("/topic/room/" + indicator.getRoomId() + "/typing", indicator);
    }

    @MessageMapping("/chat.privateTyping")
    public void handlePrivateTyping(@Payload TypingIndicator indicator, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        log.info("📝 Received private typing indicator request: payload={}", indicator);
        log.info("📝 Session userId={}, username={}", userId, username);
        
        if (userId == null) {
            log.warn("❌ User ID not found in session for private typing indicator");
            return;
        }
        
        // Set sender info
        indicator.setUserId(userId);
        indicator.setUsername(username);
        
        // Get recipient ID from the indicator payload
        Long recipientId = indicator.getRecipientId();
        if (recipientId == null) {
            log.warn("❌ Recipient ID not provided for private typing indicator");
            return;
        }
        
        log.info("📤 Sending private typing indicator: from user {} to user {}, typing={}", 
                userId, recipientId, indicator.getIsTyping());
        
        // Send typing indicator to the recipient's private queue
        messagingTemplate.convertAndSendToUser(
            recipientId.toString(),
            "/queue/typing",
            indicator
        );
        
        log.info("✅ Private typing indicator sent to user {}", recipientId);
    }

    @MessageMapping("/chat.join")
    public void handleJoinRoom(@Payload String roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (userId == null) {
            log.warn("User ID not found in session for join");
            return;
        }
        
        log.info("User {} joined room {} via WebSocket", userId, roomId);
        
        String joinMessage = username + " joined the room";
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/events", joinMessage);
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload MessageRequest message, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (userId == null) {
            log.warn("User ID not found in session");
            return;
        }
        
        log.info("WebSocket private message: from={} to={} content={}", userId, message.getRecipientId(), message.getContent());
        
        try {
            MessageResponse response = messageService.sendMessage(message, userId, username != null ? username : "User" + userId);
            
            // Add recipientId to response for frontend routing
            response.setRecipientId(message.getRecipientId());
            
            log.info("Sending private message to user {} queue", message.getRecipientId());
            // Send to recipient's private queue
            messagingTemplate.convertAndSendToUser(
                message.getRecipientId().toString(),
                "/queue/messages",
                response
            );
            
            log.info("Sending private message confirmation to sender {} queue", userId);
            // Send back to sender for confirmation
            messagingTemplate.convertAndSendToUser(
                userId.toString(),
                "/queue/messages",
                response
            );
            
            log.info("Private message sent successfully from {} to {}", userId, message.getRecipientId());
        } catch (Exception e) {
            log.error("Error sending private message via WebSocket", e);
        }
    }

    @MessageMapping("/chat.leave")
    public void handleLeaveRoom(@Payload String roomId, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        
        if (userId == null) {
            log.warn("User ID not found in session for leave");
            return;
        }
        
        log.info("User {} left room {} via WebSocket", userId, roomId);
        
        String leaveMessage = username + " left the room";
        messagingTemplate.convertAndSend("/topic/room/" + roomId + "/events", leaveMessage);
    }

    @MessageMapping("/chat.markAsRead")
    public void handleMarkAsRead(@Payload java.util.Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        
        if (userId == null) {
            log.warn("User ID not found in session for mark as read");
            return;
        }
        
        try {
            String roomId = (String) payload.get("roomId");
            
            if (roomId == null) {
                log.warn("Room ID not provided for mark as read");
                return;
            }
            
            log.info("Marking messages as read: user={}, room={}", userId, roomId);
            int count = messageService.markMessagesAsRead(roomId, userId);
            log.info("Marked {} messages as read for user {} in room {}", count, userId, roomId);
        } catch (Exception e) {
            log.error("Error marking messages as read via WebSocket", e);
        }
    }

    /**
     * Handle request for current active users list
     * Client can call this after subscribing to /topic/active-users to get immediate list
     */
    @MessageMapping("/chat.requestActiveUsers")
    public void requestActiveUsers(SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        log.info("📢 User {} requesting active users list", userId);
        
        // Broadcast current active users to all clients
        presenceService.broadcastActiveUsers();
    }

    /**
     * Handle user status change
     */
    @MessageMapping("/user.status")
    public void handleStatusChange(@Payload java.util.Map<String, Object> statusUpdate, SimpMessageHeaderAccessor headerAccessor) {
        try {
            // Handle both Integer and Long from frontend
            Object userIdObj = statusUpdate.get("userId");
            Long userId = null;
            if (userIdObj instanceof Integer) {
                userId = ((Integer) userIdObj).longValue();
            } else if (userIdObj instanceof Long) {
                userId = (Long) userIdObj;
            }
            
            String status = (String) statusUpdate.get("status");
            
            if (userId == null || status == null) {
                log.warn("Invalid status update: userId={}, status={}", userId, status);
                return;
            }
            
            log.info("🔄 User {} changed status to {}", userId, status);
            
            // Broadcast status change to all connected clients
            java.util.Map<String, Object> statusMessage = new java.util.HashMap<>();
            statusMessage.put("userId", userId);
            statusMessage.put("status", status);
            statusMessage.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/user-status", statusMessage);
            log.info("✅ Status update broadcasted to /topic/user-status");
            
            // Also broadcast updated active users list with new status
            presenceService.broadcastActiveUsers();
            log.info("✅ Active users list broadcasted with updated status");
        } catch (Exception e) {
            log.error("❌ Error handling status change", e);
        }
    }

    @MessageMapping("/chat.editMessage")
    public void handleEditMessage(@Payload java.util.Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        
        if (userId == null) {
            log.warn("User ID not found in session for edit message");
            return;
        }
        
        try {
            Long messageId = ((Number) payload.get("messageId")).longValue();
            String newContent = (String) payload.get("content");
            
            if (messageId == null || newContent == null) {
                log.warn("Message ID or content not provided for edit");
                return;
            }
            
            log.info("Editing message: messageId={}, userId={}", messageId, userId);
            messageService.editMessage(messageId, newContent, userId);
            log.info("Message edited successfully");
        } catch (Exception e) {
            log.error("Error editing message via WebSocket", e);
        }
    }

    @MessageMapping("/chat.deleteMessage")
    public void handleDeleteMessage(@Payload java.util.Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        
        if (userId == null) {
            log.warn("User ID not found in session for delete message");
            return;
        }
        
        try {
            Long messageId = ((Number) payload.get("messageId")).longValue();
            
            if (messageId == null) {
                log.warn("Message ID not provided for delete");
                return;
            }
            
            log.info("Deleting message: messageId={}, userId={}", messageId, userId);
            messageService.deleteMessage(messageId, userId);
            log.info("Message deleted successfully");
        } catch (Exception e) {
            log.error("Error deleting message via WebSocket", e);
        }
    }

    @MessageMapping("/chat.addReaction")
    public void handleAddReaction(@Payload java.util.Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        
        if (userId == null) {
            log.warn("User ID not found in session for add reaction");
            return;
        }
        
        try {
            Long messageId = ((Number) payload.get("messageId")).longValue();
            String emoji = (String) payload.get("emoji");
            
            if (messageId == null || emoji == null) {
                log.warn("Message ID or emoji not provided for reaction");
                return;
            }
            
            log.info("Adding reaction: messageId={}, userId={}, emoji={}", messageId, userId, emoji);
            reactionService.addReaction(messageId, userId, emoji);
            log.info("Reaction added successfully");
        } catch (Exception e) {
            log.error("Error adding reaction via WebSocket", e);
        }
    }

    @MessageMapping("/chat.removeReaction")
    public void handleRemoveReaction(@Payload java.util.Map<String, Object> payload, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        
        if (userId == null) {
            log.warn("User ID not found in session for remove reaction");
            return;
        }
        
        try {
            Long messageId = ((Number) payload.get("messageId")).longValue();
            String emoji = (String) payload.get("emoji");
            
            if (messageId == null || emoji == null) {
                log.warn("Message ID or emoji not provided for reaction removal");
                return;
            }
            
            log.info("Removing reaction: messageId={}, userId={}, emoji={}", messageId, userId, emoji);
            reactionService.removeReaction(messageId, userId, emoji);
            log.info("Reaction removed successfully");
        } catch (Exception e) {
            log.error("Error removing reaction via WebSocket", e);
        }
    }

    @MessageMapping("/call.signal")
    public void handleCallSignal(@Payload CallSignalRequest request, SimpMessageHeaderAccessor headerAccessor) {
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        Boolean isGuest = (Boolean) headerAccessor.getSessionAttributes().get("isGuest");
        
        if (userId == null) {
            log.warn("User ID not found in session for call signal");
            return;
        }
        
        try {
            log.info("📞 Call signal received: type={}, from={}, to={}, callType={}, isGuest={}", 
                    request.getType(), userId, request.getCalleeId(), request.getCallType(), isGuest);
            
            // Security: Block guest users from calls
            if (Boolean.TRUE.equals(isGuest)) {
                log.warn("🚫 Security: Guest user {} attempted to use call feature", userId);
                return;
            }
            
            // Validate request
            if (request.getCalleeId() == null) {
                log.warn("❌ Callee ID not provided for call signal");
                return;
            }
            
            // Security: Validate caller and callee are different users
            if (userId.equals(request.getCalleeId())) {
                log.warn("🚫 Security: User {} attempted to call themselves", userId);
                return;
            }
            
            // Security: Only allow signals between two specific users (private chat)
            // For CALL_OFFER and CALL_ANSWER, validate that this is a private chat scenario
            String signalType = request.getType();
            if ("CALL_OFFER".equals(signalType) || "CALL_ANSWER".equals(signalType)) {
                log.info("🔒 Validating private chat call between user {} and user {}", userId, request.getCalleeId());
                // In a production system, you would validate against a database that these users
                // have an active private chat or are friends. For now, we just ensure they're not guests.
            }
            
            // Build response with caller information
            CallSignalResponse response = CallSignalResponse.builder()
                    .type(request.getType())
                    .callerId(userId)
                    .callerUsername(username)
                    .calleeId(request.getCalleeId())
                    .sdp(request.getSdp())
                    .candidate(request.getCandidate())
                    .callType(request.getCallType())
                    .timestamp(System.currentTimeMillis())
                    .build();
            
            // Route signal to the callee
            messagingTemplate.convertAndSendToUser(
                    request.getCalleeId().toString(),
                    "/queue/call-signal",
                    response
            );
            
            log.info("✅ Call signal routed to user {}", request.getCalleeId());
        } catch (Exception e) {
            log.error("❌ Error handling call signal", e);
        }
    }
}
