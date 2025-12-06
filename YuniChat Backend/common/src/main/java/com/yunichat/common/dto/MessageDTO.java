package com.yunichat.common.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageDTO {
    private Long id;
    private Long senderId;
    private Long receiverId;
    private String senderUsername;
    private String receiverUsername;
    private String content;
    private String attachmentUrl;
    private String status; // sent, delivered, read
    private Boolean isGuestMessage;
    private String createdAt;
    private String editedAt;
}
