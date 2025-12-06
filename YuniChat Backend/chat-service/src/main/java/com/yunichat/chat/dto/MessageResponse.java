package com.yunichat.chat.dto;

import com.yunichat.chat.entity.Message;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {

    private Long id;
    private String roomId;
    private Long senderId;
    private Long recipientId;
    private String senderUsername;
    private String content;
    private Message.MessageType type;
    private String fileUrl;
    private String fileName;
    private String voiceUrl;
    private Integer voiceDuration;
    private Boolean isEdited;
    private Boolean isDeleted;
    private Boolean isRead;
    private LocalDateTime readAt;
    private LocalDateTime createdAt;
    private LocalDateTime editedAt;
    private java.util.List<Long> mentionedUserIds;
}
