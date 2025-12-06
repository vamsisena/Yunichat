package com.yunichat.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserDTO {
    private Long id;
    private String username;
    private String email;
    private String gender;
    private Integer age;
    private String avatarUrl;
    private String status;
    private Boolean isGuest;
    private Boolean isVerified;
    private String createdAt;
    private String lastSeen;
}
