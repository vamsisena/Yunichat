package com.yunichat.notification.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Value("${notification.websocket.allowed-origins:*}")
    private String allowedOrigins;

    @Value("${notification.websocket.endpoint:/ws}")
    private String websocketEndpoint;

    @Value("${notification.websocket.broker.prefix:/topic}")
    private String brokerPrefix;

    @Value("${notification.websocket.broker.application-prefix:/app}")
    private String applicationPrefix;

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        // Enable a simple in-memory message broker
        config.enableSimpleBroker(brokerPrefix);
        
        // Set application destination prefix
        config.setApplicationDestinationPrefixes(applicationPrefix);
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Register STOMP endpoint with SockJS fallback
        registry.addEndpoint(websocketEndpoint)
                .setAllowedOriginPatterns("http://localhost:3000", "http://localhost:3001", "http://localhost:5173")
                .withSockJS();
    }
}
