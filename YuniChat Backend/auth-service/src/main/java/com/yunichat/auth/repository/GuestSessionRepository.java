package com.yunichat.auth.repository;

import com.yunichat.auth.entity.GuestSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface GuestSessionRepository extends JpaRepository<GuestSession, Long> {
    
    Optional<GuestSession> findByGuestUserId(Long guestUserId);
    
    List<GuestSession> findByExpiresAtBefore(LocalDateTime dateTime);
    
    void deleteByGuestUserId(Long guestUserId);
}
