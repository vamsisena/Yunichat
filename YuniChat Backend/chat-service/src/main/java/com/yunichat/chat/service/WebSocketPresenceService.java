package com.yunichat.chat.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Service;
import org.springframework.web.socket.messaging.SessionConnectEvent;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;
import org.springframework.web.socket.messaging.SessionSubscribeEvent;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class WebSocketPresenceService {

    private final SimpMessagingTemplate messagingTemplate;
    private final org.springframework.web.client.RestTemplate restTemplate;
    
    // Maps sessionId -> userId
    private final Map<String, Long> sessionToUser = new ConcurrentHashMap<>();
    
    // Maps userId -> Set of sessionIds (user can have multiple tabs/browsers open)
    private final Map<Long, Set<String>> userToSessions = new ConcurrentHashMap<>();
    
    // Maps userId -> username for quick lookup
    private final Map<Long, String> userIdToUsername = new ConcurrentHashMap<>();
    
    // Maps userId -> isGuest flag for guest user cleanup
    private final Map<Long, Boolean> userIdToIsGuest = new ConcurrentHashMap<>();

    /**
     * Called when WebSocket connection is established
     */
    @EventListener
    public void handleWebSocketConnectListener(SessionConnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Get user info from session attributes (set during handshake interceptor)
        Long userId = (Long) headerAccessor.getSessionAttributes().get("userId");
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        Boolean isGuest = (Boolean) headerAccessor.getSessionAttributes().get("isGuest");
        
        if (userId == null) {
            log.warn("⚠️ WebSocket connected but no userId in session: {}", sessionId);
            return;
        }
        
        log.info("✅ WebSocket CONNECTED: sessionId={}, userId={}, username={}, isGuest={}", 
                sessionId, userId, username, isGuest);
        
        // Check if this is a new user connection (first session)
        boolean isNewConnection = !userToSessions.containsKey(userId) || userToSessions.get(userId).isEmpty();
        
        // Track this session
        sessionToUser.put(sessionId, userId);
        userToSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
        
        if (username != null) {
            userIdToUsername.put(userId, username);
        }
        
        if (isGuest != null) {
            userIdToIsGuest.put(userId, isGuest);
        }
        
        // Broadcast JOIN event ONLY if this is the user's first session
        if (isNewConnection && username != null) {
            Map<String, Object> joinEvent = new HashMap<>();
            joinEvent.put("type", "JOIN");
            joinEvent.put("userId", userId);
            joinEvent.put("username", username);
            joinEvent.put("timestamp", System.currentTimeMillis());
            
            messagingTemplate.convertAndSend("/topic/room/public/events", joinEvent);
            log.info("📢 Broadcasted JOIN event for NEW user {} to /topic/room/public/events", username);
        }
        
        // Broadcast updated active users list immediately
        log.info("📢 Broadcasting active users after connection");
        broadcastActiveUsers();
    }
    
    /**
     * Called when client subscribes to a destination
     * This ensures active users are sent even if SessionConnectEvent didn't have user info
     */
    @EventListener
    public void handleWebSocketSubscribeListener(SessionSubscribeEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        // Check if we have this user tracked
        Long userId = sessionToUser.get(sessionId);
        if (userId == null) {
            // Try to get from session attributes again
            userId = (Long) headerAccessor.getSessionAttributes().get("userId");
            String username = (String) headerAccessor.getSessionAttributes().get("username");
            
            if (userId != null) {
                log.info("✅ Adding user on SUBSCRIBE: sessionId={}, userId={}, username={}", 
                        sessionId, userId, username);
                sessionToUser.put(sessionId, userId);
                userToSessions.computeIfAbsent(userId, k -> ConcurrentHashMap.newKeySet()).add(sessionId);
                if (username != null) {
                    userIdToUsername.put(userId, username);
                }
                // Broadcast after adding user
                log.info("📢 Broadcasting active users after subscription");
                broadcastActiveUsers();
            }
        }
    }

    /**
     * Called when WebSocket connection is closed
     */
    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String sessionId = headerAccessor.getSessionId();
        
        Long userId = sessionToUser.remove(sessionId);
        
        if (userId == null) {
            log.warn("⚠️ WebSocket disconnected but no userId found: {}", sessionId);
            return;
        }
        
        String username = userIdToUsername.get(userId);
        log.info("❌ WebSocket DISCONNECTED: sessionId={}, userId={}, username={}", sessionId, userId, username);
        
        // Remove this session from user's session set
        Set<String> userSessions = userToSessions.get(userId);
        if (userSessions != null) {
            userSessions.remove(sessionId);
            
            // If user has no more active sessions, remove them completely
            if (userSessions.isEmpty()) {
                Boolean isGuest = userIdToIsGuest.remove(userId);
                userToSessions.remove(userId);
                userIdToUsername.remove(userId);
                log.info("👋 User {} ({}) is now completely offline (no active sessions), isGuest={}", userId, username, isGuest);
                
                // Broadcast user left event to public chat
                if (username != null) {
                    Map<String, Object> leaveEvent = new HashMap<>();
                    leaveEvent.put("type", "LEAVE");
                    leaveEvent.put("userId", userId);
                    leaveEvent.put("username", username);
                    leaveEvent.put("timestamp", System.currentTimeMillis());
                    
                    messagingTemplate.convertAndSend("/topic/room/public/events", leaveEvent);
                    log.info("📢 Broadcasted LEAVE event for user {} to /topic/room/public/events", username);
                }
                
                // Delete guest user data from database
                if (Boolean.TRUE.equals(isGuest)) {
                    deleteGuestUser(userId);
                }
            } else {
                log.info("🔄 User {} still has {} active session(s)", userId, userSessions.size());
            }
        }
        
        // Broadcast updated active users list
        broadcastActiveUsers();
    }

    /**
     * Broadcast list of currently connected users to all clients
     */
    public void broadcastActiveUsers() {
        List<Map<String, Object>> activeUsers = new ArrayList<>();
        
        // Build list of unique active users
        for (Map.Entry<Long, Set<String>> entry : userToSessions.entrySet()) {
            Long userId = entry.getKey();
            String username = userIdToUsername.get(userId);
            int sessionCount = entry.getValue().size();
            
            // Fetch actual status and user info from user-service
            String userStatus = "ONLINE"; // Default fallback
            Boolean isGuest = null; // Will be fetched from user-service
            String email = null;
            String avatarUrl = null;
            String gender = null;
            try {
                // Fetch full user profile to get isGuest field, avatarUrl, and gender
                String profileUrl = "http://user-service:8082/api/users/profile/" + userId;
                log.info("🔍 Fetching profile for user {} from: {}", userId, profileUrl);
                @SuppressWarnings("unchecked")
                Map<String, Object> profileResponse = restTemplate.getForObject(profileUrl, Map.class);
                if (profileResponse != null && profileResponse.get("data") != null) {
                    @SuppressWarnings("unchecked")
                    Map<String, Object> userData = (Map<String, Object>) profileResponse.get("data");
                    isGuest = (Boolean) userData.get("isGuest");
                    email = (String) userData.get("email");
                    avatarUrl = (String) userData.get("avatarUrl");
                    gender = (String) userData.get("gender");
                    log.info("✅ User {} profile: isGuest={}, email={}, avatarUrl={}, gender={}", userId, isGuest, email, avatarUrl, gender);
                }
                
                // Also fetch status
                String statusUrl = "http://user-service:8082/api/users/presence/" + userId;
                @SuppressWarnings("unchecked")
                Map<String, Object> statusResponse = restTemplate.getForObject(statusUrl, Map.class);
                if (statusResponse != null && statusResponse.get("data") != null) {
                    String status = (String) statusResponse.get("data");
                    if (status != null && !status.isEmpty()) {
                        userStatus = status.toUpperCase();
                    }
                }
            } catch (Exception e) {
                log.error("❌ Could not fetch user info for {}: {}", userId, e.getMessage());
            }
            
            Map<String, Object> user = new HashMap<>();
            user.put("id", userId);
            user.put("username", username != null ? username : "User" + userId);
            user.put("status", userStatus);
            user.put("sessionCount", sessionCount);
            user.put("isGuest", isGuest != null ? isGuest : false); // Include isGuest field
            if (email != null) {
                user.put("email", email); // Include email if available
            }
            if (avatarUrl != null) {
                user.put("avatarUrl", avatarUrl); // Include avatarUrl if available
            }
            if (gender != null) {
                user.put("gender", gender); // Include gender for avatar color
            }
            
            activeUsers.add(user);
        }
        
        log.info("📢 Broadcasting {} active users to /topic/active-users", activeUsers.size());
        if (!activeUsers.isEmpty()) {
            log.debug("Active users with status: {}", activeUsers);
        }
        
        Map<String, Object> message = new HashMap<>();
        message.put("type", "ACTIVE_USERS");
        message.put("users", activeUsers);
        message.put("count", activeUsers.size());
        message.put("timestamp", System.currentTimeMillis());
        
        messagingTemplate.convertAndSend("/topic/active-users", message);
    }

    /**
     * Get currently active user count
     */
    public int getActiveUserCount() {
        return userToSessions.size();
    }

    /**
     * Check if a specific user is online
     */
    public boolean isUserOnline(Long userId) {
        return userToSessions.containsKey(userId);
    }

    /**
     * Get all active user IDs
     */
    public Set<Long> getActiveUserIds() {
        return new HashSet<>(userToSessions.keySet());
    }
    
    /**
     * Delete guest user from database via user-service
     */
    private void deleteGuestUser(Long userId) {
        try {
            String userServiceUrl = "http://user-service:8082/api/users/guest/" + userId;
            restTemplate.delete(userServiceUrl);
            log.info("✅ Deleted guest user {} from database", userId);
        } catch (Exception e) {
            log.error("❌ Failed to delete guest user {}: {}", userId, e.getMessage());
        }
    }
}
