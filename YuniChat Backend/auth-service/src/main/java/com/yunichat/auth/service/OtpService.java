package com.yunichat.auth.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.mail.SimpleMailMessage;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.stereotype.Service;

import java.security.SecureRandom;
import java.util.concurrent.TimeUnit;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class OtpService {

    private final JavaMailSender mailSender;
    private final RedisTemplate<String, String> redisTemplate;
    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${otp.expiry-minutes:5}")
    private int otpExpiryMinutes;

    @Value("${otp.length:6}")
    private int otpLength;

    @Value("${spring.mail.properties.mail.from:noreply@yunichat.com}")
    private String fromEmail;

    public void sendOtp(String email) {
        // Generate OTP
        String otp = generateOtp();

        // Store OTP in Redis with expiry
        redisTemplate.opsForValue().set(
                "otp:" + email,
                otp,
                otpExpiryMinutes,
                TimeUnit.MINUTES
        );

        // Send email
        sendOtpEmail(email, otp);

        log.info("OTP sent to email: {}", email);
    }

    public boolean verifyOtp(String email, String otp) {
        String storedOtp = redisTemplate.opsForValue().get("otp:" + email);

        if (storedOtp == null) {
            log.warn("OTP not found or expired for email: {}", email);
            return false;
        }

        if (storedOtp.equals(otp)) {
            // Delete OTP after successful verification
            redisTemplate.delete("otp:" + email);
            log.info("OTP verified successfully for email: {}", email);
            return true;
        }

        log.warn("Invalid OTP for email: {}", email);
        return false;
    }

    public boolean verifyOtpWithoutDelete(String email, String otp) {
        String storedOtp = redisTemplate.opsForValue().get("otp:" + email);

        if (storedOtp == null) {
            log.warn("OTP not found or expired for email: {}", email);
            return false;
        }

        if (storedOtp.equals(otp)) {
            log.info("OTP verified successfully (not deleted) for email: {}", email);
            return true;
        }

        log.warn("Invalid OTP for email: {}", email);
        return false;
    }

    private String generateOtp() {
        StringBuilder otp = new StringBuilder();
        for (int i = 0; i < otpLength; i++) {
            otp.append(secureRandom.nextInt(10));
        }
        return otp.toString();
    }

    private void sendOtpEmail(String to, String otp) {
        try {
            SimpleMailMessage message = new SimpleMailMessage();
            message.setFrom(fromEmail);
            message.setTo(to);
            message.setSubject("YuniChat - Email Verification OTP");
            message.setText(String.format(
                    "Welcome to YuniChat!\n\n" +
                    "Your verification code is: %s\n\n" +
                    "This code will expire in %d minutes.\n\n" +
                    "If you didn't request this code, please ignore this email.\n\n" +
                    "Best regards,\n" +
                    "YuniChat Team",
                    otp,
                    otpExpiryMinutes
            ));

            mailSender.send(message);
            log.info("OTP email sent successfully to: {}", to);
        } catch (Exception e) {
            log.error("Failed to send OTP email to: {}. Error: {}", to, e.getMessage());
            throw new RuntimeException("Failed to send OTP email. Please check your email configuration.", e);
        }
    }
}
