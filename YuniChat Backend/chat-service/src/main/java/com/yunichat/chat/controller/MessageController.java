package com.yunichat.chat.controller;

import com.yunichat.chat.dto.MessageReactionRequest;
import com.yunichat.chat.dto.MessageReactionResponse;
import com.yunichat.chat.dto.MessageRequest;
import com.yunichat.chat.dto.MessageResponse;
import com.yunichat.chat.service.MessageReactionService;
import com.yunichat.chat.service.MessageService;
import com.yunichat.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;

@RestController
@RequestMapping("/api/chat/messages")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Messages", description = "APIs for message management")
public class MessageController {

    private final MessageService messageService;
    private final MessageReactionService reactionService;

    @PostMapping
    @Operation(summary = "Send message", description = "Send a message to a chat room")
    public ResponseEntity<ApiResponse<MessageResponse>> sendMessage(
            @RequestHeader("X-User-Id") Long userId,
            @RequestHeader(value = "X-Username", defaultValue = "Unknown") String username,
            @Valid @RequestBody MessageRequest request) {
        log.info("Send message request: room={}, user={}", request.getRoomId(), userId);
        MessageResponse message = messageService.sendMessage(request, userId, username);
        return ResponseEntity.ok(ApiResponse.success("Message sent successfully", message));
    }

    @GetMapping("/room/{roomId}")
    @Operation(summary = "Get room messages", description = "Get messages from a chat room with pagination")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getRoomMessages(
            @PathVariable String roomId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        log.info("Get room messages request: room={}, page={}, size={}", roomId, page, size);
        List<MessageResponse> messages = messageService.getRoomMessages(roomId, page, size);
        return ResponseEntity.ok(ApiResponse.success("Messages retrieved successfully", messages));
    }

    @GetMapping("/room/{roomId}/since")
    @Operation(summary = "Get new messages", description = "Get messages since a specific timestamp")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getMessagesSince(
            @PathVariable String roomId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime since) {
        log.info("Get messages since request: room={}, since={}", roomId, since);
        List<MessageResponse> messages = messageService.getMessagesSince(roomId, since);
        return ResponseEntity.ok(ApiResponse.success("New messages retrieved", messages));
    }

    @PutMapping("/{messageId}/edit")
    @Operation(summary = "Edit message", description = "Edit a sent message")
    public ResponseEntity<ApiResponse<MessageResponse>> editMessage(
            @PathVariable Long messageId,
            @RequestHeader("X-User-Id") Long userId,
            @RequestBody com.yunichat.chat.dto.MessageEditRequest request) {
        log.info("Edit message request: messageId={}, user={}", messageId, userId);
        MessageResponse message = messageService.editMessage(messageId, request.getContent(), userId);
        return ResponseEntity.ok(ApiResponse.success("Message edited successfully", message));
    }

    @DeleteMapping("/{messageId}")
    @Operation(summary = "Delete message", description = "Delete a sent message")
    public ResponseEntity<ApiResponse<Void>> deleteMessage(
            @PathVariable Long messageId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Delete message request: messageId={}, user={}", messageId, userId);
        messageService.deleteMessage(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message deleted successfully", null));
    }

    @GetMapping("/room/{roomId}/count")
    @Operation(summary = "Get message count", description = "Get total message count in a room")
    public ResponseEntity<ApiResponse<Long>> getMessageCount(@PathVariable String roomId) {
        log.info("Get message count request: room={}", roomId);
        long count = messageService.getRoomMessageCount(roomId);
        return ResponseEntity.ok(ApiResponse.success("Message count retrieved", count));
    }

    @GetMapping("/private/{otherUserId}")
    @Operation(summary = "Get private messages", description = "Get private messages with another user")
    public ResponseEntity<ApiResponse<List<MessageResponse>>> getPrivateMessages(
            @PathVariable Long otherUserId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get private messages request: userId={}, otherUserId={}", userId, otherUserId);
        List<MessageResponse> messages = messageService.getPrivateMessages(userId, otherUserId);
        return ResponseEntity.ok(ApiResponse.success("Private messages retrieved successfully", messages));
    }

    @PostMapping("/cleanup/public")
    @Operation(summary = "Cleanup old public messages", description = "Manually trigger cleanup of public messages older than 30 minutes")
    public ResponseEntity<ApiResponse<String>> cleanupPublicMessages() {
        log.info("Manual cleanup of public messages triggered");
        int deletedCount = messageService.cleanupOldPublicMessagesNow();
        String message = deletedCount > 0 
            ? "Deleted " + deletedCount + " public messages older than 30 minutes"
            : "No public messages to delete";
        return ResponseEntity.ok(ApiResponse.success(message, message));
    }

    @PutMapping("/{messageId}/read")
    @Operation(summary = "Mark message as read", description = "Mark a specific message as read and notify sender")
    public ResponseEntity<ApiResponse<MessageResponse>> markMessageAsRead(
            @PathVariable Long messageId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Mark message as read request: messageId={}, userId={}", messageId, userId);
        MessageResponse message = messageService.markMessageAsRead(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Message marked as read", message));
    }
    @PutMapping("/room/{roomId}/read")
    @Operation(summary = "Mark all messages as read", description = "Mark all messages in a room as read for the current user")
    public ResponseEntity<ApiResponse<String>> markRoomMessagesAsRead(
            @PathVariable String roomId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Mark room messages as read request: roomId={}, userId={}", roomId, userId);
        int count = messageService.markMessagesAsRead(roomId, userId);
        String message = count > 0 
            ? "Marked " + count + " messages as read"
            : "No messages to mark as read";
        return ResponseEntity.ok(ApiResponse.success(message, message));
    }

    @PostMapping("/{messageId}/reactions")
    @Operation(summary = "Add reaction to message", description = "Add an emoji reaction to a message")
    public ResponseEntity<ApiResponse<MessageReactionResponse>> addReaction(
            @PathVariable Long messageId,
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody MessageReactionRequest request) {
        log.info("Add reaction request: messageId={}, userId={}, emoji={}", messageId, userId, request.getEmoji());
        MessageReactionResponse reaction = reactionService.addReaction(messageId, userId, request.getEmoji());
        return ResponseEntity.ok(ApiResponse.success("Reaction added successfully", reaction));
    }

    @DeleteMapping("/{messageId}/reactions/{emoji}")
    @Operation(summary = "Remove reaction from message", description = "Remove an emoji reaction from a message")
    public ResponseEntity<ApiResponse<Void>> removeReaction(
            @PathVariable Long messageId,
            @PathVariable String emoji,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Remove reaction request: messageId={}, userId={}, emoji={}", messageId, userId, emoji);
        reactionService.removeReaction(messageId, userId, emoji);
        return ResponseEntity.ok(ApiResponse.success("Reaction removed successfully", null));
    }

    @GetMapping("/{messageId}/reactions")
    @Operation(summary = "Get message reactions", description = "Get all reactions for a message")
    public ResponseEntity<ApiResponse<List<MessageReactionResponse>>> getMessageReactions(
            @PathVariable Long messageId) {
        log.info("Get reactions request: messageId={}", messageId);
        List<MessageReactionResponse> reactions = reactionService.getMessageReactions(messageId);
        return ResponseEntity.ok(ApiResponse.success("Reactions retrieved successfully", reactions));
    }

    @GetMapping("/{messageId}/reactions/summary")
    @Operation(summary = "Get reaction summary", description = "Get reaction summary with counts for a message")
    public ResponseEntity<ApiResponse<List<MessageReactionResponse.ReactionSummary>>> getReactionSummary(
            @PathVariable Long messageId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get reaction summary request: messageId={}, userId={}", messageId, userId);
        List<MessageReactionResponse.ReactionSummary> summary = reactionService.getReactionSummary(messageId, userId);
        return ResponseEntity.ok(ApiResponse.success("Reaction summary retrieved successfully", summary));
    }
}
