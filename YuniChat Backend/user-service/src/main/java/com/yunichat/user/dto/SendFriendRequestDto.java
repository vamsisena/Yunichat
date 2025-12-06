package com.yunichat.user.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SendFriendRequestDto {
    @NotNull(message = "Recipient ID is required")
    private Long recipientId;
}
