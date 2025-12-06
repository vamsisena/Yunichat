package com.yunichat.auth.config;

// CORS is handled by the Gateway Service
// Individual services behind the gateway don't need their own CORS configuration
// This prevents "multiple values" errors in Access-Control-Allow-Origin header
