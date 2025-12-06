package com.yunichat.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FriendRequestResponse {
    private Long id;
    private Long senderId;
    private Long recipientId;
    private String status;  // PENDING, ACCEPTED, DECLINED
    private LocalDateTime createdAt;
    private UserProfileResponse sender;
    private UserProfileResponse recipient;
}
