package com.yunichat.gateway.filter;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.reactive.CorsWebFilter;
import org.springframework.web.cors.reactive.UrlBasedCorsConfigurationSource;

import java.util.Arrays;
import java.util.Collections;

/**
 * CORS configuration using Spring's built-in CorsWebFilter.
 * This ensures CORS headers are added ONCE and correctly for WebSocket and HTTP requests.
 */
@Configuration
public class CorsConfig {

    @Bean
    public org.springframework.web.cors.reactive.CorsWebFilter corsWebFilter() {
        CorsConfiguration corsConfig = new CorsConfiguration();
        corsConfig.setAllowedOrigins(Arrays.asList(
            "http://localhost:3000", 
            "http://localhost:3001",
            "https://yunichat.vercel.app",
            "https://yunichat-ttu3gyo3b-vamsis-projects-1d80189d.vercel.app"
        ));
        corsConfig.setAllowedMethods(Arrays.asList("GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"));
        corsConfig.setAllowedHeaders(Collections.singletonList("*"));
        corsConfig.setExposedHeaders(Collections.singletonList("*"));
        corsConfig.setAllowCredentials(true);
        corsConfig.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        // Apply CORS to API routes only, NOT to WebSocket routes
        source.registerCorsConfiguration("/api/**", corsConfig);
        source.registerCorsConfiguration("/auth/**", corsConfig);

        return new org.springframework.web.cors.reactive.CorsWebFilter(source);
    }
}

