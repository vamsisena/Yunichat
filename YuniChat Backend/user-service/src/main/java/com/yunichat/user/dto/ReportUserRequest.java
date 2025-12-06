package com.yunichat.user.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReportUserRequest {
    
    @NotNull(message = "User ID to report is required")
    private Long reportedUserId;
    
    @NotBlank(message = "Reason is required")
    private String reason;
    
    private String description;
}
