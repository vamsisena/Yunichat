package com.yunichat.user.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long id;
    private String username;
    private String email;
    private String gender;
    private Integer age;
    private String bio;
    private String avatarUrl;
    private String status;
    private Boolean isGuest;
    private Boolean isVerified;
    private LocalDateTime lastSeen;
    private LocalDateTime createdAt;
}
