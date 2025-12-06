package com.yunichat.user.repository;

import com.yunichat.user.entity.FriendRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendRequestRepository extends JpaRepository<FriendRequest, Long> {
    
    List<FriendRequest> findByRecipientIdAndStatus(Long recipientId, FriendRequest.RequestStatus status);
    
    List<FriendRequest> findBySenderIdAndStatus(Long senderId, FriendRequest.RequestStatus status);
    
    Optional<FriendRequest> findBySenderIdAndRecipientIdAndStatus(
            Long senderId, Long recipientId, FriendRequest.RequestStatus status);
    
    boolean existsBySenderIdAndRecipientIdAndStatus(
            Long senderId, Long recipientId, FriendRequest.RequestStatus status);
}
