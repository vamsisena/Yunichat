package com.yunichat.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class BlockUserRequest {
    
    @NotNull(message = "User ID to block is required")
    private Long blockedUserId;
    
    private String reason;
}
