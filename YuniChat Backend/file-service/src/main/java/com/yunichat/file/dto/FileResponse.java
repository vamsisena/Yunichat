package com.yunichat.file.dto;

import com.yunichat.file.entity.FileMetadata;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FileResponse {
    private Long id;
    private String fileId;
    private String originalName;
    private String contentType;
    private Long fileSize;
    private FileMetadata.FileType fileType;
    private FileMetadata.FileCategory category;
    private Long uploadedBy;
    private String downloadUrl;
    private String thumbnailUrl;
    private Boolean isPublic;
    private LocalDateTime uploadedAt;
    private Long downloadCount;
}
