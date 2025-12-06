package com.yunichat.file.dto;

import com.yunichat.file.entity.FileMetadata;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileUploadRequest {
    
    @NotNull(message = "File category is required")
    private FileMetadata.FileCategory category;
    
    private Boolean isPublic;
    
    private String relatedEntityId;  // e.g., roomId for chat attachments
}
