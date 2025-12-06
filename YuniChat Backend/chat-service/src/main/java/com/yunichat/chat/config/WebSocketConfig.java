package com.yunichat.chat.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.server.ServerHttpRequest;
import org.springframework.http.server.ServerHttpResponse;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;
import org.springframework.web.socket.server.HandshakeInterceptor;

import java.util.Map;

@Configuration
@EnableWebSocketMessageBroker
@RequiredArgsConstructor
@Slf4j
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        config.enableSimpleBroker("/topic", "/queue");
        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
                
                // Log ALL incoming STOMP messages for debugging
                if (accessor != null && accessor.getCommand() != null) {
                    String destination = accessor.getDestination();
                    // Log typing and call-related messages
                    if (destination != null && (destination.contains("privateTyping") || destination.contains("call"))) {
                        log.info("🔵 STOMP Message Intercepted: command={}, destination={}", 
                                accessor.getCommand(), destination);
                    }
                }
                
                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    // Extract userId and username from STOMP headers
                    String userIdStr = accessor.getFirstNativeHeader("userId");
                    String username = accessor.getFirstNativeHeader("username");
                    
                    log.info("🔑 STOMP CONNECT headers - userId: {}, username: {}", userIdStr, username);
                    
                    if (userIdStr != null) {
                        try {
                            Long userId = Long.parseLong(userIdStr);
                            accessor.getSessionAttributes().put("userId", userId);
                            
                            // CRITICAL FIX: Set Principal so convertAndSendToUser can route messages
                            accessor.setUser(() -> userIdStr);
                            log.info("✅ Set Principal to userId: {} for STOMP user destination routing", userIdStr);
                            
                            log.info("✅ Stored userId {} in session attributes", userId);
                        } catch (NumberFormatException e) {
                            log.warn("⚠️ Invalid userId in STOMP headers: {}", userIdStr);
                        }
                    }
                    
                    if (username != null) {
                        accessor.getSessionAttributes().put("username", username);
                        log.info("✅ Stored username {} in session attributes", username);
                    }
                }
                
                return message;
            }
        });
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // CRITICAL: SockJS /info endpoint needs CORS configured here
        // Gateway CORS doesn't apply to SockJS internal endpoints
        registry.addEndpoint("/ws/chat")
                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001") // Specific origins only
                .addInterceptors(new UserHandshakeInterceptor())
                .withSockJS(); // Enable SockJS support for /info endpoint
        
        log.info("✅ WebSocket endpoint registered: /ws/chat with SockJS support and CORS");
    }
    
    /**
     * Handshake interceptor to extract user info from query params and store in session
     */
    @Slf4j
    private static class UserHandshakeInterceptor implements HandshakeInterceptor {
        
        @Override
        public boolean beforeHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                      WebSocketHandler wsHandler, Map<String, Object> attributes) {
            String query = request.getURI().getQuery();
            
            if (query != null && !query.isEmpty()) {
                String[] params = query.split("&");
                for (String param : params) {
                    String[] keyValue = param.split("=");
                    if (keyValue.length == 2) {
                        String key = keyValue[0];
                        String value = keyValue[1];
                        
                        if ("userId".equals(key)) {
                            try {
                                Long userId = Long.parseLong(value);
                                attributes.put("userId", userId);
                                log.info("🔑 WebSocket handshake: userId={}", userId);
                            } catch (NumberFormatException e) {
                                log.warn("⚠️ Invalid userId in WebSocket handshake: {}", value);
                            }
                        } else if ("username".equals(key)) {
                            try {
                                // Decode URL-encoded username
                                String decodedUsername = java.net.URLDecoder.decode(value, "UTF-8");
                                attributes.put("username", decodedUsername);
                                log.info("🔑 WebSocket handshake: username={} (decoded from: {})", decodedUsername, value);
                            } catch (Exception e) {
                                attributes.put("username", value);
                                log.warn("⚠️ Could not decode username, using as-is: {}", value);
                            }
                        } else if ("isGuest".equals(key)) {
                            try {
                                Boolean isGuest = Boolean.parseBoolean(value);
                                attributes.put("isGuest", isGuest);
                                log.info("🔑 WebSocket handshake: isGuest={}", isGuest);
                            } catch (Exception e) {
                                log.warn("⚠️ Invalid isGuest in WebSocket handshake: {}", value);
                            }
                        }
                    }
                }
            }
            
            return true; // Always allow connection
        }

        @Override
        public void afterHandshake(ServerHttpRequest request, ServerHttpResponse response,
                                  WebSocketHandler wsHandler, Exception exception) {
            // Nothing to do after handshake
        }
    }
}
