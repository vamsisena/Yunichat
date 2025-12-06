package com.yunichat.chat.controller;

import com.yunichat.chat.dto.CreateRoomRequest;
import com.yunichat.chat.dto.RoomResponse;
import com.yunichat.chat.service.ChatRoomService;
import com.yunichat.common.dto.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/chat/rooms")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "Chat Rooms", description = "APIs for chat room management")
public class ChatRoomController {

    private final ChatRoomService chatRoomService;

    @PostMapping
    @Operation(summary = "Create chat room", description = "Create a new chat room")
    public ResponseEntity<ApiResponse<RoomResponse>> createRoom(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody CreateRoomRequest request) {
        log.info("Create room request from user: {}", userId);
        RoomResponse room = chatRoomService.createRoom(request, userId);
        return ResponseEntity.ok(ApiResponse.success("Room created successfully", room));
    }

    @GetMapping("/{roomId}")
    @Operation(summary = "Get room details", description = "Get chat room by ID")
    public ResponseEntity<ApiResponse<RoomResponse>> getRoom(@PathVariable String roomId) {
        log.info("Get room request: {}", roomId);
        RoomResponse room = chatRoomService.getRoomById(roomId);
        return ResponseEntity.ok(ApiResponse.success("Room retrieved successfully", room));
    }

    @GetMapping("/public")
    @Operation(summary = "Get public rooms", description = "Get all public chat rooms")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getPublicRooms() {
        log.info("Get public rooms request");
        List<RoomResponse> rooms = chatRoomService.getPublicRooms();
        return ResponseEntity.ok(ApiResponse.success("Public rooms retrieved", rooms));
    }

    @GetMapping("/my-rooms")
    @Operation(summary = "Get user's rooms", description = "Get all rooms the user is a member of")
    public ResponseEntity<ApiResponse<List<RoomResponse>>> getUserRooms(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get user rooms request for user: {}", userId);
        List<RoomResponse> rooms = chatRoomService.getUserRooms(userId);
        return ResponseEntity.ok(ApiResponse.success("User rooms retrieved", rooms));
    }

    @PostMapping("/{roomId}/join")
    @Operation(summary = "Join room", description = "Join a chat room")
    public ResponseEntity<ApiResponse<Void>> joinRoom(
            @PathVariable String roomId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Join room request: room={}, user={}", roomId, userId);
        chatRoomService.joinRoom(roomId, userId);
        return ResponseEntity.ok(ApiResponse.success("Joined room successfully", null));
    }

    @PostMapping("/{roomId}/leave")
    @Operation(summary = "Leave room", description = "Leave a chat room")
    public ResponseEntity<ApiResponse<Void>> leaveRoom(
            @PathVariable String roomId,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Leave room request: room={}, user={}", roomId, userId);
        chatRoomService.leaveRoom(roomId, userId);
        return ResponseEntity.ok(ApiResponse.success("Left room successfully", null));
    }

    @GetMapping("/{roomId}/members")
    @Operation(summary = "Get room members", description = "Get list of room member IDs")
    public ResponseEntity<ApiResponse<List<Long>>> getRoomMembers(@PathVariable String roomId) {
        log.info("Get room members request: {}", roomId);
        List<Long> members = chatRoomService.getRoomMembers(roomId);
        return ResponseEntity.ok(ApiResponse.success("Room members retrieved", members));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if Chat Service is running")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("Chat Service is running", "UP"));
    }
}
