package com.yunichat.user.repository;

import com.yunichat.user.entity.IgnoredUser;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface IgnoredUserRepository extends JpaRepository<IgnoredUser, Long> {
    
    List<IgnoredUser> findByIgnorerUserId(Long ignorerUserId);
    
    Optional<IgnoredUser> findByIgnorerUserIdAndIgnoredUserId(Long ignorerUserId, Long ignoredUserId);
    
    boolean existsByIgnorerUserIdAndIgnoredUserId(Long ignorerUserId, Long ignoredUserId);
    
    void deleteByIgnorerUserIdAndIgnoredUserId(Long ignorerUserId, Long ignoredUserId);
    
    void deleteByIgnorerUserIdOrIgnoredUserId(Long ignorerUserId, Long ignoredUserId);
}
