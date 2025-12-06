package com.yunichat.user.controller;

import com.yunichat.common.dto.ApiResponse;
import com.yunichat.user.dto.*;
import com.yunichat.user.service.PresenceService;
import com.yunichat.user.service.UserService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Set;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@Slf4j
@Tag(name = "User Management", description = "APIs for user profile and management operations")
public class UserController {

    private final UserService userService;
    private final PresenceService presenceService;

    @GetMapping("/profile")
    @Operation(summary = "Get user profile", description = "Get the profile of the authenticated user")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getProfile(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get profile request for user: {}", userId);
        UserProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    @GetMapping("/profile/{userId}")
    @Operation(summary = "Get another user's profile", description = "Get the profile of any user by ID")
    public ResponseEntity<ApiResponse<UserProfileResponse>> getUserProfile(
            @PathVariable Long userId) {
        log.info("Get profile request for user: {}", userId);
        UserProfileResponse profile = userService.getProfile(userId);
        return ResponseEntity.ok(ApiResponse.success("Profile retrieved successfully", profile));
    }

    @PutMapping("/profile")
    @Operation(summary = "Update profile", description = "Update the authenticated user's profile")
    public ResponseEntity<ApiResponse<UserProfileResponse>> updateProfile(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdateProfileRequest request) {
        log.info("Update profile request for user: {}", userId);
        UserProfileResponse updatedProfile = userService.updateProfile(userId, request);
        return ResponseEntity.ok(ApiResponse.success("Profile updated successfully", updatedProfile));
    }

    @GetMapping("/search")
    @Operation(summary = "Search users", description = "Search users by username or email")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> searchUsers(
            @RequestParam String query,
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Search users request: query={}, userId={}", query, userId);
        List<UserProfileResponse> users = userService.searchUsers(query, userId);
        return ResponseEntity.ok(ApiResponse.success("Users found: " + users.size(), users));
    }

    @PostMapping("/block")
    @Operation(summary = "Block a user", description = "Block a user to prevent interactions")
    public ResponseEntity<ApiResponse<Void>> blockUser(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody BlockUserRequest request) {
        log.info("Block user request: blocker={}, blocked={}", userId, request.getBlockedUserId());
        userService.blockUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User blocked successfully", null));
    }

    @DeleteMapping("/block/{blockedUserId}")
    @Operation(summary = "Unblock a user", description = "Unblock a previously blocked user")
    public ResponseEntity<ApiResponse<Void>> unblockUser(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long blockedUserId) {
        log.info("Unblock user request: blocker={}, blocked={}", userId, blockedUserId);
        userService.unblockUser(userId, blockedUserId);
        return ResponseEntity.ok(ApiResponse.success("User unblocked successfully", null));
    }

    @GetMapping("/blocked")
    @Operation(summary = "Get blocked users", description = "Get list of all blocked users")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getBlockedUsers(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get blocked users request for user: {}", userId);
        List<UserProfileResponse> blockedUsers = userService.getBlockedUsers(userId);
        return ResponseEntity.ok(ApiResponse.success("Blocked users retrieved", blockedUsers));
    }

    @PostMapping("/ignore")
    @Operation(summary = "Ignore a user", description = "Ignore a user to stop receiving their messages without notification")
    public ResponseEntity<ApiResponse<Void>> ignoreUser(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody IgnoreUserRequest request) {
        log.info("Ignore user request: ignorer={}, ignored={}", userId, request.getIgnoredUserId());
        userService.ignoreUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User ignored successfully", null));
    }

    @DeleteMapping("/ignore/{ignoredUserId}")
    @Operation(summary = "Unignore a user", description = "Unignore a previously ignored user")
    public ResponseEntity<ApiResponse<Void>> unignoreUser(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long ignoredUserId) {
        log.info("Unignore user request: ignorer={}, ignored={}", userId, ignoredUserId);
        userService.unignoreUser(userId, ignoredUserId);
        return ResponseEntity.ok(ApiResponse.success("User unignored successfully", null));
    }

    @GetMapping("/ignored")
    @Operation(summary = "Get ignored users", description = "Get list of all ignored users")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getIgnoredUsers(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get ignored users request for user: {}", userId);
        List<UserProfileResponse> ignoredUsers = userService.getIgnoredUsers(userId);
        return ResponseEntity.ok(ApiResponse.success("Ignored users retrieved", ignoredUsers));
    }

    @GetMapping("/ignore/status/{targetUserId}")
    @Operation(summary = "Check ignore status", description = "Check if a user is ignored")
    public ResponseEntity<ApiResponse<Boolean>> checkIgnoreStatus(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long targetUserId) {
        boolean isIgnored = userService.isUserIgnored(userId, targetUserId);
        return ResponseEntity.ok(ApiResponse.success("Ignore status retrieved", isIgnored));
    }

    @PostMapping("/report")
    @Operation(summary = "Report a user", description = "Report a user for inappropriate behavior")
    public ResponseEntity<ApiResponse<Void>> reportUser(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody ReportUserRequest request) {
        log.info("Report user request: reporter={}, reported={}, reason={}", 
                userId, request.getReportedUserId(), request.getReason());
        userService.reportUser(userId, request);
        return ResponseEntity.ok(ApiResponse.success("User reported successfully", null));
    }

    @PutMapping("/presence")
    @Operation(summary = "Update presence status", description = "Update user's online presence status")
    public ResponseEntity<ApiResponse<Void>> updatePresence(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody UpdatePresenceRequest request) {
        log.info("Update presence request: userId={}, status={}", userId, request.getStatus());
        presenceService.updatePresence(userId, request.getStatus());
        userService.updateUserStatusAndLastSeen(userId, request.getStatus());
        return ResponseEntity.ok(ApiResponse.success("Presence updated successfully", null));
    }

    @GetMapping("/presence/{userId}")
    @Operation(summary = "Get user presence", description = "Get online presence status of a user")
    public ResponseEntity<ApiResponse<String>> getPresence(@PathVariable Long userId) {
        log.info("Get presence request for user: {}", userId);
        String presence = presenceService.getPresence(userId);
        return ResponseEntity.ok(ApiResponse.success("Presence retrieved", presence));
    }

    @PostMapping("/presence/bulk")
    @Operation(summary = "Get bulk presence", description = "Get presence status for multiple users")
    public ResponseEntity<ApiResponse<Map<Long, String>>> getBulkPresence(
            @RequestBody Set<Long> userIds) {
        log.info("Get bulk presence request for {} users", userIds.size());
        Map<Long, String> presenceMap = presenceService.getBulkPresence(userIds);
        return ResponseEntity.ok(ApiResponse.success("Bulk presence retrieved", presenceMap));
    }

    @DeleteMapping("/guest/{userId}")
    @Operation(summary = "Delete guest user", description = "Delete a guest user when they disconnect (internal use)")
    public ResponseEntity<ApiResponse<Void>> deleteGuestUser(@PathVariable Long userId) {
        log.info("Delete guest user request for userId: {}", userId);
        userService.deleteGuestUser(userId);
        return ResponseEntity.ok(ApiResponse.success("Guest user deleted successfully", null));
    }

    // Friend Management Endpoints
    @PostMapping("/friends/request")
    @Operation(summary = "Send friend request", description = "Send a friend request to another user")
    public ResponseEntity<ApiResponse<FriendRequestResponse>> sendFriendRequest(
            @RequestHeader("X-User-Id") Long userId,
            @Valid @RequestBody SendFriendRequestDto request) {
        log.info("Send friend request: sender={}, recipient={}", userId, request.getRecipientId());
        FriendRequestResponse friendRequest = userService.sendFriendRequest(userId, request.getRecipientId());
        return ResponseEntity.ok(ApiResponse.success("Friend request sent successfully", friendRequest));
    }

    @PostMapping("/friends/accept/{requestId}")
    @Operation(summary = "Accept friend request", description = "Accept a pending friend request")
    public ResponseEntity<ApiResponse<UserProfileResponse>> acceptFriendRequest(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long requestId) {
        log.info("Accept friend request: userId={}, requestId={}", userId, requestId);
        UserProfileResponse friend = userService.acceptFriendRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success("Friend request accepted", friend));
    }

    @PostMapping("/friends/decline/{requestId}")
    @Operation(summary = "Decline friend request", description = "Decline a pending friend request")
    public ResponseEntity<ApiResponse<Void>> declineFriendRequest(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long requestId) {
        log.info("Decline friend request: userId={}, requestId={}", userId, requestId);
        userService.declineFriendRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success("Friend request declined", null));
    }

    @DeleteMapping("/friends/request/{requestId}")
    @Operation(summary = "Cancel friend request", description = "Cancel a sent friend request")
    public ResponseEntity<ApiResponse<Void>> cancelFriendRequest(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long requestId) {
        log.info("Cancel friend request: userId={}, requestId={}", userId, requestId);
        userService.cancelFriendRequest(userId, requestId);
        return ResponseEntity.ok(ApiResponse.success("Friend request cancelled", null));
    }

    @GetMapping("/friends")
    @Operation(summary = "Get friends", description = "Get list of all friends")
    public ResponseEntity<ApiResponse<List<UserProfileResponse>>> getFriends(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get friends request for user: {}", userId);
        List<UserProfileResponse> friends = userService.getFriends(userId);
        return ResponseEntity.ok(ApiResponse.success("Friends retrieved", friends));
    }

    @GetMapping("/friends/requests/pending")
    @Operation(summary = "Get pending requests", description = "Get list of pending friend requests received")
    public ResponseEntity<ApiResponse<List<FriendRequestResponse>>> getPendingRequests(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get pending friend requests for user: {}", userId);
        List<FriendRequestResponse> requests = userService.getPendingFriendRequests(userId);
        return ResponseEntity.ok(ApiResponse.success("Pending requests retrieved", requests));
    }

    @GetMapping("/friends/requests/sent")
    @Operation(summary = "Get sent requests", description = "Get list of friend requests sent")
    public ResponseEntity<ApiResponse<List<FriendRequestResponse>>> getSentRequests(
            @RequestHeader("X-User-Id") Long userId) {
        log.info("Get sent friend requests for user: {}", userId);
        List<FriendRequestResponse> requests = userService.getSentFriendRequests(userId);
        return ResponseEntity.ok(ApiResponse.success("Sent requests retrieved", requests));
    }

    @DeleteMapping("/friends/{friendId}")
    @Operation(summary = "Remove friend", description = "Remove a friend from friend list")
    public ResponseEntity<ApiResponse<Void>> removeFriend(
            @RequestHeader("X-User-Id") Long userId,
            @PathVariable Long friendId) {
        log.info("Remove friend: userId={}, friendId={}", userId, friendId);
        userService.removeFriend(userId, friendId);
        return ResponseEntity.ok(ApiResponse.success("Friend removed successfully", null));
    }

    @GetMapping("/friends/status/{userId}")
    @Operation(summary = "Get friendship status", description = "Get friendship status with a user")
    public ResponseEntity<ApiResponse<String>> getFriendshipStatus(
            @RequestHeader("X-User-Id") Long currentUserId,
            @PathVariable Long userId) {
        log.info("Get friendship status: currentUser={}, targetUser={}", currentUserId, userId);
        String status = userService.getFriendshipStatus(currentUserId, userId);
        return ResponseEntity.ok(ApiResponse.success("Friendship status retrieved", status));
    }

    @GetMapping("/health")
    @Operation(summary = "Health check", description = "Check if the User Service is running")
    public ResponseEntity<ApiResponse<String>> healthCheck() {
        return ResponseEntity.ok(ApiResponse.success("User Service is running", "UP"));
    }
}
