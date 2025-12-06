package com.yunichat.user.service;

import com.yunichat.common.exception.BadRequestException;
import com.yunichat.common.exception.ResourceNotFoundException;
import com.yunichat.user.dto.*;
import com.yunichat.user.entity.*;
import com.yunichat.user.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserService {

    private final UserRepository userRepository;
    private final BlockedUserRepository blockedUserRepository;
    private final IgnoredUserRepository ignoredUserRepository;
    private final UserReportRepository userReportRepository;
    private final PresenceService presenceService;
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;

    public UserProfileResponse getProfile(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        // Validate and update username
        if (request.getUsername() != null && !request.getUsername().trim().isEmpty() 
                && !request.getUsername().equals(user.getUsername())) {
            String username = request.getUsername().trim();
            if (username.length() < 3 || username.length() > 50) {
                throw new BadRequestException("Username must be between 3 and 50 characters");
            }
            if (userRepository.existsByUsername(username)) {
                throw new BadRequestException("Username already taken");
            }
            user.setUsername(username);
        }

        // Email cannot be changed after account creation (security measure)
        if (request.getEmail() != null && !request.getEmail().trim().isEmpty() 
                && !request.getEmail().equals(user.getEmail())) {
            throw new BadRequestException("Email cannot be changed after account creation");
        }

        // Validate and update age
        if (request.getAge() != null) {
            if (request.getAge() < 13 || request.getAge() > 120) {
                throw new BadRequestException("Age must be between 13 and 120");
            }
            user.setAge(request.getAge());
        }

        // Validate and update gender
        if (request.getGender() != null && !request.getGender().trim().isEmpty()) {
            String gender = request.getGender().toLowerCase().trim();
            if (!gender.equals("male") && !gender.equals("female") && !gender.equals("other")) {
                throw new BadRequestException("Gender must be male, female, or other");
            }
            user.setGender(gender);
        }

        // Validate and update bio
        if (request.getBio() != null) {
            String bio = request.getBio().trim();
            if (bio.length() > 500) {
                throw new BadRequestException("Bio must not exceed 500 characters");
            }
            user.setBio(bio);
        }

        if (request.getAvatarUrl() != null && !request.getAvatarUrl().trim().isEmpty()) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }
        
        if (request.getStatus() != null && !request.getStatus().trim().isEmpty()) {
            String status = request.getStatus().toLowerCase().trim();
            user.setStatus(status);
            presenceService.updatePresence(userId, status);
        }

        user = userRepository.save(user);
        log.info("Profile updated for user: {}", userId);
        
        return mapToProfileResponse(user);
    }

    public List<UserProfileResponse> searchUsers(String query, Long currentUserId) {
        List<User> users = userRepository.searchUsers(query);
        
        // Filter out blocked users
        List<Long> blockedUserIds = blockedUserRepository.findByBlockerUserId(currentUserId)
                .stream()
                .map(BlockedUser::getBlockedUserId)
                .collect(Collectors.toList());
        
        return users.stream()
                .filter(user -> !user.getId().equals(currentUserId) && !blockedUserIds.contains(user.getId()))
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void blockUser(Long blockerUserId, BlockUserRequest request) {
        if (blockerUserId.equals(request.getBlockedUserId())) {
            throw new BadRequestException("Cannot block yourself");
        }

        User blockedUser = userRepository.findById(request.getBlockedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User to block not found"));

        if (blockedUserRepository.existsByBlockerUserIdAndBlockedUserId(blockerUserId, request.getBlockedUserId())) {
            throw new BadRequestException("User already blocked");
        }

        BlockedUser blockedUserEntry = new BlockedUser();
        blockedUserEntry.setBlockerUserId(blockerUserId);
        blockedUserEntry.setBlockedUserId(request.getBlockedUserId());
        blockedUserEntry.setReason(request.getReason());
        
        blockedUserRepository.save(blockedUserEntry);
        log.info("User {} blocked user {}", blockerUserId, request.getBlockedUserId());
    }

    @Transactional
    public void unblockUser(Long blockerUserId, Long blockedUserId) {
        if (!blockedUserRepository.existsByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId)) {
            throw new ResourceNotFoundException("Block entry not found");
        }
        
        blockedUserRepository.deleteByBlockerUserIdAndBlockedUserId(blockerUserId, blockedUserId);
        log.info("User {} unblocked user {}", blockerUserId, blockedUserId);
    }

    public List<UserProfileResponse> getBlockedUsers(Long userId) {
        List<BlockedUser> blocked = blockedUserRepository.findByBlockerUserId(userId);
        List<Long> blockedUserIds = blocked.stream()
                .map(BlockedUser::getBlockedUserId)
                .collect(Collectors.toList());
        
        return userRepository.findAllById(blockedUserIds).stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void reportUser(Long reporterUserId, ReportUserRequest request) {
        if (reporterUserId.equals(request.getReportedUserId())) {
            throw new BadRequestException("Cannot report yourself");
        }

        User reportedUser = userRepository.findById(request.getReportedUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User to report not found"));

        UserReport report = new UserReport();
        report.setReporterUserId(reporterUserId);
        report.setReportedUserId(request.getReportedUserId());
        report.setReason(request.getReason());
        report.setDescription(request.getDescription());
        report.setStatus(UserReport.ReportStatus.PENDING);
        
        userReportRepository.save(report);
        log.info("User {} reported user {} for: {}", reporterUserId, request.getReportedUserId(), request.getReason());
    }

    @Transactional
    public void updateLastSeen(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
        });
    }

    @Transactional
    public void updateUserStatusAndLastSeen(Long userId, String status) {
        userRepository.findById(userId).ifPresent(user -> {
            user.setStatus(status.toLowerCase());
            user.setLastSeen(LocalDateTime.now());
            userRepository.save(user);
            log.info("✅ Updated user {}: status={}, lastSeen={}", userId, status, user.getLastSeen());
        });
    }

    @Transactional
    public void ignoreUser(Long ignorerUserId, IgnoreUserRequest request) {
        if (ignorerUserId.equals(request.getIgnoredUserId())) {
            throw new BadRequestException("Cannot ignore yourself");
        }

        User ignoredUser = userRepository.findById(request.getIgnoredUserId())
                .orElseThrow(() -> new ResourceNotFoundException("User to ignore not found"));

        if (ignoredUserRepository.existsByIgnorerUserIdAndIgnoredUserId(ignorerUserId, request.getIgnoredUserId())) {
            throw new BadRequestException("User already ignored");
        }

        IgnoredUser ignoredUserEntry = new IgnoredUser();
        ignoredUserEntry.setIgnorerUserId(ignorerUserId);
        ignoredUserEntry.setIgnoredUserId(request.getIgnoredUserId());
        
        ignoredUserRepository.save(ignoredUserEntry);
        log.info("User {} ignored user {}", ignorerUserId, request.getIgnoredUserId());
    }

    @Transactional
    public void unignoreUser(Long ignorerUserId, Long ignoredUserId) {
        if (!ignoredUserRepository.existsByIgnorerUserIdAndIgnoredUserId(ignorerUserId, ignoredUserId)) {
            throw new ResourceNotFoundException("Ignore entry not found");
        }
        
        ignoredUserRepository.deleteByIgnorerUserIdAndIgnoredUserId(ignorerUserId, ignoredUserId);
        log.info("User {} unignored user {}", ignorerUserId, ignoredUserId);
    }

    public List<UserProfileResponse> getIgnoredUsers(Long userId) {
        List<IgnoredUser> ignored = ignoredUserRepository.findByIgnorerUserId(userId);
        List<Long> ignoredUserIds = ignored.stream()
                .map(IgnoredUser::getIgnoredUserId)
                .collect(Collectors.toList());
        
        return userRepository.findAllById(ignoredUserIds).stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    public boolean isUserIgnored(Long ignorerUserId, Long ignoredUserId) {
        return ignoredUserRepository.existsByIgnorerUserIdAndIgnoredUserId(ignorerUserId, ignoredUserId);
    }

    /**
     * Delete a guest user when they disconnect
     * Guest users are temporary and should be cleaned up
     */
    @Transactional
    public void deleteGuestUser(Long userId) {
        userRepository.findById(userId).ifPresent(user -> {
            if (Boolean.TRUE.equals(user.getIsGuest())) {
                // Delete all related data
                blockedUserRepository.deleteByBlockerUserIdOrBlockedUserId(userId, userId);
                ignoredUserRepository.deleteByIgnorerUserIdOrIgnoredUserId(userId, userId);
                userReportRepository.deleteByReporterUserIdOrReportedUserId(userId, userId);
                userRepository.delete(user);
                log.info("🗑️ Deleted guest user: {} ({})", userId, user.getUsername());
            }
        });
    }

    // Friend Management Methods
    @Transactional
    public FriendRequestResponse sendFriendRequest(Long senderId, Long recipientId) {
        if (senderId.equals(recipientId)) {
            throw new BadRequestException("Cannot send friend request to yourself");
        }

        User recipient = userRepository.findById(recipientId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        if (recipient.getIsGuest()) {
            throw new BadRequestException("Cannot send friend request to guest users");
        }

        // Check if already friends
        if (friendshipRepository.existsByUserIdAndFriendId(senderId, recipientId)) {
            throw new BadRequestException("Already friends with this user");
        }

        // Check for existing pending request
        if (friendRequestRepository.existsBySenderIdAndRecipientIdAndStatus(
                senderId, recipientId, FriendRequest.RequestStatus.PENDING)) {
            throw new BadRequestException("Friend request already sent");
        }

        // Check for existing non-pending request (ACCEPTED/DECLINED) and reuse it
        Optional<FriendRequest> existingRequest = friendRequestRepository
                .findBySenderIdAndRecipientIdAndStatus(senderId, recipientId, FriendRequest.RequestStatus.ACCEPTED)
                .or(() -> friendRequestRepository.findBySenderIdAndRecipientIdAndStatus(
                        senderId, recipientId, FriendRequest.RequestStatus.DECLINED));

        FriendRequest friendRequest;
        if (existingRequest.isPresent()) {
            // Reuse existing request and update to PENDING
            friendRequest = existingRequest.get();
            friendRequest.setStatus(FriendRequest.RequestStatus.PENDING);
            friendRequest.setUpdatedAt(LocalDateTime.now());
            log.info("♻️ Reusing existing friend request: sender={}, recipient={}", senderId, recipientId);
        } else {
            // Create new request
            friendRequest = FriendRequest.builder()
                    .senderId(senderId)
                    .recipientId(recipientId)
                    .status(FriendRequest.RequestStatus.PENDING)
                    .build();
            log.info("✅ Friend request sent: sender={}, recipient={}", senderId, recipientId);
        }

        friendRequest = friendRequestRepository.save(friendRequest);

        return mapToFriendRequestResponse(friendRequest);
    }

    @Transactional
    public UserProfileResponse acceptFriendRequest(Long userId, Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (!request.getRecipientId().equals(userId)) {
            throw new BadRequestException("You are not the recipient of this request");
        }

        if (request.getStatus() != FriendRequest.RequestStatus.PENDING) {
            throw new BadRequestException("Friend request is not pending");
        }

        // Check if already friends (handles simultaneous requests case)
        boolean alreadyFriends = friendshipRepository.existsByUserIdAndFriendId(
                request.getSenderId(), request.getRecipientId());

        if (!alreadyFriends) {
            // Create bidirectional friendship
            Friendship friendship1 = Friendship.builder()
                    .userId(request.getSenderId())
                    .friendId(request.getRecipientId())
                    .build();

            Friendship friendship2 = Friendship.builder()
                    .userId(request.getRecipientId())
                    .friendId(request.getSenderId())
                    .build();

            friendshipRepository.save(friendship1);
            friendshipRepository.save(friendship2);
            log.info("✅ Created friendship: user1={}, user2={}", request.getSenderId(), request.getRecipientId());
        } else {
            log.info("⚠️ Already friends (simultaneous request): user1={}, user2={}", 
                    request.getSenderId(), request.getRecipientId());
        }

        // Update this request status
        request.setStatus(FriendRequest.RequestStatus.ACCEPTED);
        request.setUpdatedAt(LocalDateTime.now());
        friendRequestRepository.save(request);

        // Check for reverse pending request (simultaneous requests) and mark it as ACCEPTED too
        friendRequestRepository.findBySenderIdAndRecipientIdAndStatus(
                request.getRecipientId(), request.getSenderId(), FriendRequest.RequestStatus.PENDING)
                .ifPresent(reverseRequest -> {
                    reverseRequest.setStatus(FriendRequest.RequestStatus.ACCEPTED);
                    reverseRequest.setUpdatedAt(LocalDateTime.now());
                    friendRequestRepository.save(reverseRequest);
                    log.info("✅ Auto-accepted reverse pending request: requestId={}", reverseRequest.getId());
                });

        log.info("✅ Friend request accepted: requestId={}, sender={}, recipient={}", 
                requestId, request.getSenderId(), request.getRecipientId());

        return getProfile(request.getSenderId());
    }

    @Transactional
    public void declineFriendRequest(Long userId, Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (!request.getRecipientId().equals(userId)) {
            throw new BadRequestException("You are not the recipient of this request");
        }

        request.setStatus(FriendRequest.RequestStatus.DECLINED);
        request.setUpdatedAt(LocalDateTime.now());
        friendRequestRepository.save(request);

        log.info("Friend request declined: requestId={}", requestId);
    }

    @Transactional
    public void cancelFriendRequest(Long userId, Long requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
                .orElseThrow(() -> new ResourceNotFoundException("Friend request not found"));

        if (!request.getSenderId().equals(userId)) {
            throw new BadRequestException("You are not the sender of this request");
        }

        friendRequestRepository.delete(request);
        log.info("Friend request cancelled: requestId={}", requestId);
    }

    public List<UserProfileResponse> getFriends(Long userId) {
        List<Long> friendIds = friendshipRepository.findFriendIdsByUserId(userId);
        return userRepository.findAllById(friendIds).stream()
                .map(this::mapToProfileResponse)
                .collect(Collectors.toList());
    }

    public List<FriendRequestResponse> getPendingFriendRequests(Long userId) {
        return friendRequestRepository.findByRecipientIdAndStatus(userId, FriendRequest.RequestStatus.PENDING)
                .stream()
                .map(this::mapToFriendRequestResponse)
                .collect(Collectors.toList());
    }

    public List<FriendRequestResponse> getSentFriendRequests(Long userId) {
        return friendRequestRepository.findBySenderIdAndStatus(userId, FriendRequest.RequestStatus.PENDING)
                .stream()
                .map(this::mapToFriendRequestResponse)
                .collect(Collectors.toList());
    }

    @Transactional
    public void removeFriend(Long userId, Long friendId) {
        friendshipRepository.deleteByUserIdAndFriendId(userId, friendId);
        friendshipRepository.deleteByUserIdAndFriendId(friendId, userId);
        
        // Delete any associated friend requests in both directions
        friendRequestRepository.findBySenderIdAndRecipientIdAndStatus(
                userId, friendId, FriendRequest.RequestStatus.ACCEPTED)
                .ifPresent(friendRequestRepository::delete);
        friendRequestRepository.findBySenderIdAndRecipientIdAndStatus(
                friendId, userId, FriendRequest.RequestStatus.ACCEPTED)
                .ifPresent(friendRequestRepository::delete);
        
        log.info("Friendship removed and associated requests deleted: user={}, friend={}", userId, friendId);
    }

    public String getFriendshipStatus(Long userId, Long targetUserId) {
        if (friendshipRepository.existsByUserIdAndFriendId(userId, targetUserId)) {
            return "FRIENDS";
        }

        if (friendRequestRepository.existsBySenderIdAndRecipientIdAndStatus(
                userId, targetUserId, FriendRequest.RequestStatus.PENDING)) {
            return "REQUEST_SENT";
        }

        if (friendRequestRepository.existsBySenderIdAndRecipientIdAndStatus(
                targetUserId, userId, FriendRequest.RequestStatus.PENDING)) {
            return "REQUEST_RECEIVED";
        }

        return "NONE";
    }

    private FriendRequestResponse mapToFriendRequestResponse(FriendRequest request) {
        FriendRequestResponse response = FriendRequestResponse.builder()
                .id(request.getId())
                .senderId(request.getSenderId())
                .recipientId(request.getRecipientId())
                .status(request.getStatus().name())
                .createdAt(request.getCreatedAt())
                .build();

        // Optionally load sender and recipient details
        userRepository.findById(request.getSenderId()).ifPresent(sender ->
                response.setSender(mapToProfileResponse(sender)));
        userRepository.findById(request.getRecipientId()).ifPresent(recipient ->
                response.setRecipient(mapToProfileResponse(recipient)));

        return response;
    }

    private UserProfileResponse mapToProfileResponse(User user) {
        UserProfileResponse response = new UserProfileResponse();
        response.setId(user.getId());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail());
        response.setGender(user.getGender());
        response.setAge(user.getAge());
        response.setBio(user.getBio());
        response.setAvatarUrl(user.getAvatarUrl());
        response.setStatus(user.getStatus());
        response.setIsGuest(user.getIsGuest());
        response.setIsVerified(user.getIsVerified());
        response.setLastSeen(user.getLastSeen());
        response.setCreatedAt(user.getCreatedAt());
        return response;
    }
}
