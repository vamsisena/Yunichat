package com.yunichat.user.repository;

import com.yunichat.user.entity.BlockedUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface BlockedUserRepository extends JpaRepository<BlockedUser, Long> {
    
    List<BlockedUser> findByBlockerUserId(Long blockerUserId);
    
    Optional<BlockedUser> findByBlockerUserIdAndBlockedUserId(Long blockerUserId, Long blockedUserId);
    
    boolean existsByBlockerUserIdAndBlockedUserId(Long blockerUserId, Long blockedUserId);
    
    void deleteByBlockerUserIdAndBlockedUserId(Long blockerUserId, Long blockedUserId);
    
    void deleteByBlockerUserIdOrBlockedUserId(Long blockerUserId, Long blockedUserId);
}
