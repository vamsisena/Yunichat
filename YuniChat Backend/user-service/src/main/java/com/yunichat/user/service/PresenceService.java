package com.yunichat.user.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class PresenceService {

    private final RedisTemplate<String, String> redisTemplate;
    private static final String PRESENCE_KEY_PREFIX = "presence:";
    private static final Duration PRESENCE_TTL = Duration.ofMinutes(5);

    public void updatePresence(Long userId, String status) {
        String key = PRESENCE_KEY_PREFIX + userId;
        redisTemplate.opsForValue().set(key, status, PRESENCE_TTL);
        log.info("✅ Updated presence for user {}: {} (key: {})", userId, status, key);
    }

    public String getPresence(Long userId) {
        String key = PRESENCE_KEY_PREFIX + userId;
        String presence = redisTemplate.opsForValue().get(key);
        log.info("📖 Read presence for user {}: {} (key: {})", userId, presence != null ? presence : "offline", key);
        return presence != null ? presence : "offline";
    }

    public Map<Long, String> getBulkPresence(Set<Long> userIds) {
        Map<Long, String> presenceMap = new HashMap<>();
        
        for (Long userId : userIds) {
            String presence = getPresence(userId);
            presenceMap.put(userId, presence);
        }
        
        return presenceMap;
    }

    public void removePresence(Long userId) {
        String key = PRESENCE_KEY_PREFIX + userId;
        redisTemplate.delete(key);
        log.debug("Removed presence for user {}", userId);
    }

    public void markOnline(Long userId) {
        updatePresence(userId, "online");
    }

    public void markOffline(Long userId) {
        updatePresence(userId, "offline");
    }
}
