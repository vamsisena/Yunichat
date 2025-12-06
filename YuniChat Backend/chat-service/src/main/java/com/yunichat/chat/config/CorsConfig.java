package com.yunichat.chat.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * CORS is handled ENTIRELY by the Gateway Service.
 * This configuration explicitly DISABLES CORS at the service level
 * to prevent duplicate Access-Control-Allow-Origin headers.
 */
@Configuration
public class CorsConfig implements WebMvcConfigurer {
    
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        // Explicitly register NO CORS mappings
        // This prevents Spring Boot's auto-configuration from adding CORS
        // Gateway will handle ALL CORS headers
    }
}
