package com.yunichat.file.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "file_metadata")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class FileMetadata {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(nullable = false, unique = true)
    private String fileId;  // UUID for file identification
    
    @Column(nullable = false)
    private String originalName;
    
    @Column(nullable = false)
    private String storedName;  // Name on disk/storage
    
    @Column(nullable = false)
    private String contentType;
    
    @Column(nullable = false)
    private Long fileSize;  // Size in bytes
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileType fileType;
    
    @Column(nullable = false)
    @Enumerated(EnumType.STRING)
    private FileCategory category;
    
    @Column(nullable = false)
    private Long uploadedBy;  // User ID
    
    private String storageLocation;  // Path or S3 key
    
    private String thumbnailLocation;  // For images
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isPublic = false;
    
    @Column(nullable = false)
    @Builder.Default
    private Boolean isDeleted = false;
    
    @CreatedDate
    @Column(nullable = false, updatable = false)
    private LocalDateTime uploadedAt;
    
    private LocalDateTime deletedAt;
    
    // File download tracking
    @Builder.Default
    private Long downloadCount = 0L;
    
    public enum FileType {
        IMAGE, DOCUMENT, ARCHIVE, VIDEO, AUDIO, OTHER
    }
    
    public enum FileCategory {
        AVATAR,           // User profile pictures
        CHAT_ATTACHMENT,  // Files sent in chat
        CHAT_VOICE,       // Voice messages
        USER_FILE,        // General user uploads
        SYSTEM           // System files
    }
}
