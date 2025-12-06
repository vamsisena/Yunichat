package com.yunichat.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class IgnoreUserRequest {
    
    @NotNull(message = "User ID to ignore is required")
    private Long ignoredUserId;
}
