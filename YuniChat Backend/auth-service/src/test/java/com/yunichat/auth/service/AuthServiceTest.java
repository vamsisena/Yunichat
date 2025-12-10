package com.yunichat.auth.service;

import com.yunichat.auth.dto.LoginRequest;
import com.yunichat.auth.dto.RegisterRequest;
import com.yunichat.auth.dto.AuthResponse;
import com.yunichat.auth.entity.User;
import com.yunichat.auth.repository.GuestSessionRepository;
import com.yunichat.auth.repository.UserRepository;
import com.yunichat.common.exception.BadRequestException;
import com.yunichat.common.exception.UnauthorizedException;
import com.yunichat.common.util.JwtUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.core.ValueOperations;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private GuestSessionRepository guestSessionRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtUtil jwtUtil;

    @Mock
    private OtpService otpService;

    @Mock
    private RedisTemplate<String, String> redisTemplate;

    @Mock
    private ValueOperations<String, String> valueOperations;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;
    private User testUser;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "guestSessionExpiryMinutes", 30);
        
        // Mock Redis operations (lenient mode for tests that don't need it)
        lenient().when(redisTemplate.opsForValue()).thenReturn(valueOperations);

        registerRequest = new RegisterRequest();
        registerRequest.setUsername("testuser");
        registerRequest.setEmail("test@example.com");
        registerRequest.setPassword("password123");
        registerRequest.setGender("MALE");
        registerRequest.setAge(25);

        loginRequest = new LoginRequest();
        loginRequest.setUsernameOrEmail("testuser");
        loginRequest.setPassword("password123");

        testUser = User.builder()
                .id(1L)
                .username("testuser")
                .email("test@example.com")
                .passwordHash("hashedPassword")
                .isGuest(false)
                .isVerified(true)
                .status("offline")
                .build();
    }

    @Test
    @DisplayName("Should register new user successfully")
    void shouldRegisterNewUser() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(userRepository.save(any(User.class))).thenReturn(testUser);
        doNothing().when(otpService).sendOtp(anyString());

        // When
        authService.register(registerRequest);

        // Then
        verify(userRepository).existsByUsername("testuser");
        verify(userRepository).existsByEmail("test@example.com");
        verify(passwordEncoder).encode("password123");
        verify(userRepository).save(any(User.class));
        verify(otpService).sendOtp("test@example.com");
    }

    @Test
    @DisplayName("Should throw exception when username already exists")
    void shouldThrowExceptionWhenUsernameExists() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(true);

        // When & Then
        BadRequestException exception = assertThrows(
            BadRequestException.class,
            () -> authService.register(registerRequest)
        );
        assertEquals("Username already exists", exception.getMessage());
        verify(userRepository).existsByUsername("testuser");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should throw exception when email already exists")
    void shouldThrowExceptionWhenEmailExists() {
        // Given
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(true);

        // When & Then
        BadRequestException exception = assertThrows(
            BadRequestException.class,
            () -> authService.register(registerRequest)
        );
        assertEquals("Email already registered", exception.getMessage());
        verify(userRepository).existsByEmail("test@example.com");
        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Should login successfully with valid credentials")
    void shouldLoginWithValidCredentials() {
        // Given
        when(userRepository.findByUsernameOrEmail(anyString(), anyString()))
            .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtil.generateAccessToken(anyLong(), anyString(), anyBoolean()))
            .thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(anyLong())).thenReturn("refresh-token");

        // When
        AuthResponse response = authService.login(loginRequest);

        // Then
        assertNotNull(response);
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        verify(userRepository).findByUsernameOrEmail("testuser", "testuser");
        verify(passwordEncoder).matches("password123", "hashedPassword");
        verify(jwtUtil).generateAccessToken(1L, "testuser", false);
        verify(jwtUtil).generateRefreshToken(1L);
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw exception when user not found during login")
    void shouldThrowExceptionWhenUserNotFound() {
        // Given
        when(userRepository.findByUsernameOrEmail(anyString(), anyString()))
            .thenReturn(Optional.empty());

        // When & Then
        UnauthorizedException exception = assertThrows(
            UnauthorizedException.class,
            () -> authService.login(loginRequest)
        );
        assertEquals("Invalid credentials", exception.getMessage());
        verify(passwordEncoder, never()).matches(anyString(), anyString());
    }

    @Test
    @DisplayName("Should throw exception when password is incorrect")
    void shouldThrowExceptionWhenPasswordIncorrect() {
        // Given
        when(userRepository.findByUsernameOrEmail(anyString(), anyString()))
            .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(false);

        // When & Then
        UnauthorizedException exception = assertThrows(
            UnauthorizedException.class,
            () -> authService.login(loginRequest)
        );
        assertEquals("Invalid credentials", exception.getMessage());
        verify(jwtUtil, never()).generateAccessToken(anyLong(), anyString(), anyBoolean());
    }

    @Test
    @DisplayName("Should throw exception when user is not verified")
    void shouldThrowExceptionWhenUserNotVerified() {
        // Given
        testUser.setIsVerified(false);
        when(userRepository.findByUsernameOrEmail(anyString(), anyString()))
            .thenReturn(Optional.of(testUser));
        lenient().when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);

        // When & Then
        UnauthorizedException exception = assertThrows(
            UnauthorizedException.class,
            () -> authService.login(loginRequest)
        );
        assertTrue(exception.getMessage().contains("not verified") || 
                   exception.getMessage().contains("verify"));
    }

    @Test
    @DisplayName("Should update user status to online after login")
    void shouldUpdateUserStatusAfterLogin() {
        // Given
        when(userRepository.findByUsernameOrEmail(anyString(), anyString()))
            .thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches(anyString(), anyString())).thenReturn(true);
        when(jwtUtil.generateAccessToken(anyLong(), anyString(), anyBoolean()))
            .thenReturn("access-token");
        when(jwtUtil.generateRefreshToken(anyLong())).thenReturn("refresh-token");

        // When
        authService.login(loginRequest);

        // Then
        assertEquals("online", testUser.getStatus());
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Should throw exception when guest user tries to login with password")
    void shouldHandleGuestUserLogin() {
        // Given
        testUser.setIsGuest(true);
        when(userRepository.findByUsernameOrEmail(anyString(), anyString()))
            .thenReturn(Optional.of(testUser));

        // When & Then
        UnauthorizedException exception = assertThrows(
            UnauthorizedException.class,
            () -> authService.login(loginRequest)
        );
        assertTrue(exception.getMessage().contains("Guest users"));
    }

    @Test
    @DisplayName("Should encode password before saving user")
    void shouldEncodePasswordBeforeSaving() {
        // Given
        String rawPassword = "password123";
        String encodedPassword = "encoded-password";
        when(userRepository.existsByUsername(anyString())).thenReturn(false);
        when(userRepository.existsByEmail(anyString())).thenReturn(false);
        when(passwordEncoder.encode(rawPassword)).thenReturn(encodedPassword);
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> {
            User savedUser = invocation.getArgument(0);
            assertEquals(encodedPassword, savedUser.getPasswordHash());
            return savedUser;
        });
        doNothing().when(otpService).sendOtp(anyString());

        // When
        authService.register(registerRequest);

        // Then
        verify(passwordEncoder).encode(rawPassword);
    }
}
