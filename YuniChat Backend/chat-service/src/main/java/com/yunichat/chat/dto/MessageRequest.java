package com.yunichat.chat.dto;

import com.yunichat.chat.entity.Message;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MessageRequest {

    @NotBlank(message = "Room ID is required")
    private String roomId;

    @Size(max = 2000, message = "Message content cannot exceed 2000 characters")
    private String content; // Allow empty content for file-only messages

    @NotNull(message = "Message type is required")
    private Message.MessageType type;

    private String fileUrl;
    
    private String fileName;
    
    // For private messages
    private Long recipientId;
    
    // For voice messages
    private String voiceUrl;
    
    private Integer voiceDuration;
    
    // For mentions
    private java.util.List<Long> mentionedUserIds;
}
