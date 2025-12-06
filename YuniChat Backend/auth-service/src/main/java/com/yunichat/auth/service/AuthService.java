package com.yunichat.auth.service;

import com.yunichat.auth.dto.*;
import com.yunichat.auth.entity.GuestSession;
import com.yunichat.auth.entity.User;
import com.yunichat.auth.repository.GuestSessionRepository;
import com.yunichat.auth.repository.UserRepository;
import com.yunichat.common.exception.BadRequestException;
import com.yunichat.common.exception.UnauthorizedException;
import com.yunichat.common.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class AuthService {

    private final UserRepository userRepository;
    private final GuestSessionRepository guestSessionRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final OtpService otpService;
    private final RedisTemplate<String, String> redisTemplate;

    @Value("${guest.session.expiry-minutes:30}")
    private int guestSessionExpiryMinutes;

    @Transactional
    public void register(RegisterRequest request) {
        log.info("Registering new user: {}", request.getUsername());

        // Check if username already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new BadRequestException("Username already exists");
        }

        // Check if email already exists
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered");
        }

        // Create user
        User user = User.builder()
                .username(request.getUsername())
                .email(request.getEmail())
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .gender(request.getGender())
                .age(request.getAge())
                .isGuest(false)
                .isVerified(false)  // User must verify email before login
                .status("offline")
                .build();

        userRepository.save(user);
        log.info("User registered successfully: {}", user.getUsername());

        // Send OTP to email
        otpService.sendOtp(request.getEmail());
        log.info("OTP sent to email: {}", request.getEmail());
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        log.info("Login attempt for: {}", request.getUsernameOrEmail());

        // Find user by username or email
        User user = userRepository.findByUsernameOrEmail(
                request.getUsernameOrEmail(), 
                request.getUsernameOrEmail()
        ).orElseThrow(() -> new UnauthorizedException("Invalid credentials"));

        // Check if guest
        if (user.getIsGuest()) {
            throw new UnauthorizedException("Guest users cannot login with password");
        }

        // Check if verified
        if (!user.getIsVerified()) {
            throw new UnauthorizedException("Please verify your email first. Check your inbox for OTP.");
        }

        // Verify password
        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new UnauthorizedException("Invalid credentials");
        }

        // Update status and last seen
        user.setStatus("online");
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        // Generate tokens
        String accessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), false);
        String refreshToken = jwtUtil.generateRefreshToken(user.getId());

        // Store refresh token in Redis
        storeRefreshToken(user.getId(), refreshToken);

        log.info("User logged in successfully: {}", user.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .isGuest(false)
                .build();
    }

    @Transactional
    public AuthResponse guestLogin(GuestLoginRequest request) {
        log.info("Guest login attempt for: {}", request.getUsername());

        // Check if username exists
        User existingUser = userRepository.findByUsername(request.getUsername()).orElse(null);
        
        if (existingUser != null) {
            if (!existingUser.getIsGuest()) {
                // Registered user - cannot use this username
                throw new BadRequestException("Username already taken by a registered user");
            } else {
                // Old guest session exists - delete it and create fresh one
                log.info("Deleting old guest session for username: {}", request.getUsername());
                userRepository.delete(existingUser);
                userRepository.flush(); // Ensure deletion is committed
            }
        }

        // Create fresh guest user
        User guestUser = User.builder()
                .username(request.getUsername())
                .gender(request.getGender())
                .age(request.getAge())
                .isGuest(true)
                .isVerified(false)
                .status("online")
                .build();

        guestUser = userRepository.save(guestUser);

        // Create guest session
        GuestSession session = GuestSession.builder()
                .guestUserId(guestUser.getId())
                .createdAt(LocalDateTime.now())
                .expiresAt(LocalDateTime.now().plusMinutes(guestSessionExpiryMinutes))
                .lastActivity(LocalDateTime.now())
                .build();

        guestSessionRepository.save(session);

        // Generate tokens
        String accessToken = jwtUtil.generateAccessToken(guestUser.getId(), guestUser.getUsername(), true);
        String refreshToken = jwtUtil.generateRefreshToken(guestUser.getId());

        // Store refresh token in Redis with expiry
        storeRefreshToken(guestUser.getId(), refreshToken, guestSessionExpiryMinutes);

        log.info("Guest user logged in successfully: {}", guestUser.getUsername());

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(guestUser.getId())
                .username(guestUser.getUsername())
                .isGuest(true)
                .build();
    }

    @Transactional
    public void logout(Long userId) {
        log.info("Logging out user: {}", userId);

        User user = userRepository.findById(userId).orElse(null);
        
        // User might have been already deleted (e.g., guest session expired)
        if (user == null) {
            log.warn("User not found during logout: {}", userId);
            removeRefreshToken(userId);
            return;
        }

        // Update status
        user.setStatus("offline");
        user.setLastSeen(LocalDateTime.now());
        userRepository.save(user);

        // Remove refresh token from Redis
        removeRefreshToken(userId);

        // If guest, delete user and session
        if (user.getIsGuest()) {
            guestSessionRepository.deleteByGuestUserId(userId);
            userRepository.delete(user);
            log.info("Guest user deleted: {}", userId);
        }

        log.info("User logged out successfully: {}", userId);
    }

    public void verifyOtp(OtpVerifyRequest request) {
        log.info("Verifying OTP for email: {}", request.getEmail());

        // Verify OTP without deleting (for registration verification, we delete after verification)
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        // Update user verification status
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        user.setIsVerified(true);
        userRepository.save(user);

        log.info("Email verified successfully for: {}", request.getEmail());
    }

    public void resendOtp(OtpRequest request) {
        log.info("Resending OTP to: {}", request.getEmail());

        // Check if user exists
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getIsVerified()) {
            throw new BadRequestException("Email already verified");
        }

        // Send OTP
        otpService.sendOtp(request.getEmail());
    }

    public void forgotPassword(ForgotPasswordRequest request) {
        log.info("Forgot password request for: {}", request.getEmail());

        // Check if user exists and is verified
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found with this email"));

        if (!user.getIsVerified()) {
            throw new BadRequestException("Please verify your email first");
        }

        if (user.getIsGuest()) {
            throw new BadRequestException("Guest users cannot reset password");
        }

        // Send OTP for password reset
        otpService.sendOtp(request.getEmail());
        log.info("Password reset OTP sent to: {}", request.getEmail());
    }

    @Transactional
    public void resetPassword(ResetPasswordRequest request) {
        log.info("Reset password request for: {}", request.getEmail());

        // Verify OTP first (this will delete the OTP after verification)
        if (!otpService.verifyOtp(request.getEmail(), request.getOtp())) {
            throw new BadRequestException("Invalid or expired OTP");
        }

        // Find user
        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        if (user.getIsGuest()) {
            throw new BadRequestException("Guest users cannot reset password");
        }

        // Check if new password is same as current password
        if (passwordEncoder.matches(request.getNewPassword(), user.getPasswordHash())) {
            throw new BadRequestException("New password cannot be the same as your current password");
        }

        // Update password
        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);

        log.info("Password reset successfully for: {}", request.getEmail());
    }

    public AuthResponse refreshToken(String refreshToken) {
        log.info("Refreshing token");

        // Validate refresh token
        if (!jwtUtil.validateToken(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        Long userId = jwtUtil.extractUserId(refreshToken);

        // Check if refresh token exists in Redis
        String storedToken = getRefreshToken(userId);
        if (storedToken == null || !storedToken.equals(refreshToken)) {
            throw new UnauthorizedException("Invalid refresh token");
        }

        // Get user
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new UnauthorizedException("User not found"));

        // Generate new access token
        String newAccessToken = jwtUtil.generateAccessToken(user.getId(), user.getUsername(), user.getIsGuest());

        return AuthResponse.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken)
                .tokenType("Bearer")
                .userId(user.getId())
                .username(user.getUsername())
                .isGuest(user.getIsGuest())
                .build();
    }

    private void storeRefreshToken(Long userId, String token) {
        redisTemplate.opsForValue().set(
                "refresh_token:" + userId, 
                token, 
                24, 
                TimeUnit.HOURS
        );
    }

    private void storeRefreshToken(Long userId, String token, int expiryMinutes) {
        redisTemplate.opsForValue().set(
                "refresh_token:" + userId, 
                token, 
                expiryMinutes, 
                TimeUnit.MINUTES
        );
    }

    private String getRefreshToken(Long userId) {
        return redisTemplate.opsForValue().get("refresh_token:" + userId);
    }

    private void removeRefreshToken(Long userId) {
        redisTemplate.delete("refresh_token:" + userId);
    }
}
