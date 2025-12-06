package com.yunichat.user.dto;

import jakarta.validation.constraints.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {
    
    @Size(min = 3, max = 50, message = "Username must be between 3 and 50 characters")
    private String username;
    
    @Email(message = "Invalid email format")
    private String email;
    
    @Pattern(regexp = "(?i)^(male|female|other)$", message = "Gender must be male, female, or other")
    private String gender;
    
    @Min(value = 13, message = "Age must be at least 13")
    @Max(value = 120, message = "Age must be less than 120")
    private Integer age;
    
    @Size(max = 500, message = "Bio must not exceed 500 characters")
    private String bio;
    
    private String avatarUrl;
    
    @Pattern(regexp = "(?i)^(online|offline|away|busy)$", message = "Invalid status")
    private String status;
}
