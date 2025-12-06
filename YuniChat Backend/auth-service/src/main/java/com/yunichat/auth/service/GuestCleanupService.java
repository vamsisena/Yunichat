package com.yunichat.auth.service;

import com.yunichat.auth.entity.GuestSession;
import com.yunichat.auth.repository.GuestSessionRepository;
import com.yunichat.auth.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class GuestCleanupService {

    private final GuestSessionRepository guestSessionRepository;
    private final UserRepository userRepository;

    /**
     * Cleanup expired guest sessions every 5 minutes
     */
    @Scheduled(fixedRate = 300000) // 5 minutes
    @Transactional
    public void cleanupExpiredGuestSessions() {
        log.info("Starting cleanup of expired guest sessions");

        List<GuestSession> expiredSessions = guestSessionRepository
                .findByExpiresAtBefore(LocalDateTime.now());

        log.info("Found {} expired guest sessions", expiredSessions.size());

        for (GuestSession session : expiredSessions) {
            try {
                // Delete user
                userRepository.findById(session.getGuestUserId()).ifPresent(user -> {
                    userRepository.delete(user);
                    log.debug("Deleted guest user: {}", user.getUsername());
                });

                // Delete session
                guestSessionRepository.delete(session);
                log.debug("Deleted guest session: {}", session.getId());

            } catch (Exception e) {
                log.error("Error deleting guest session: {}", session.getId(), e);
            }
        }

        log.info("Completed cleanup of expired guest sessions");
    }
}
