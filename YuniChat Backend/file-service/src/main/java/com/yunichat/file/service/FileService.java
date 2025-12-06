package com.yunichat.file.service;

import com.yunichat.file.config.FileStorageProperties;
import com.yunichat.file.dto.FileResponse;
import com.yunichat.file.entity.FileMetadata;
import com.yunichat.file.repository.FileMetadataRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class FileService {
    
    private final FileMetadataRepository fileRepository;
    private final LocalStorageService storageService;
    private final FileStorageProperties properties;
    
    @Transactional
    public FileResponse uploadFile(MultipartFile file, FileMetadata.FileCategory category, 
                                   Long userId, Boolean isPublic) throws IOException {
        
        // Validate file
        validateFile(file, category);
        
        // Detect content type
        String contentType = storageService.detectContentType(file);
        FileMetadata.FileType fileType = storageService.determineFileType(contentType);
        
        // Store file
        String storedLocation = storageService.storeFile(file, category);
        
        // Create thumbnail for images
        String thumbnailLocation = null;
        if (fileType == FileMetadata.FileType.IMAGE) {
            try {
                thumbnailLocation = storageService.createThumbnail(
                    storedLocation, 
                    properties.getAvatar().getThumbnailSize()
                );
            } catch (Exception e) {
                log.warn("Failed to create thumbnail for {}: {}", file.getOriginalFilename(), e.getMessage());
            }
        }
        
        // Save metadata
        FileMetadata metadata = FileMetadata.builder()
                .fileId(UUID.randomUUID().toString())
                .originalName(file.getOriginalFilename())
                .storedName(storedLocation.substring(storedLocation.lastIndexOf('/') + 1))
                .contentType(contentType)
                .fileSize(file.getSize())
                .fileType(fileType)
                .category(category)
                .uploadedBy(userId)
                .storageLocation(storedLocation)
                .thumbnailLocation(thumbnailLocation)
                .isPublic(isPublic != null ? isPublic : false)
                .isDeleted(false)
                .downloadCount(0L)
                .build();
        
        metadata = fileRepository.save(metadata);
        log.info("File uploaded: {} by user {}", metadata.getFileId(), userId);
        
        return mapToResponse(metadata);
    }
    
    public FileResponse getFileMetadata(String fileId) {
        FileMetadata metadata = fileRepository.findByFileIdAndIsDeletedFalse(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
        return mapToResponse(metadata);
    }
    
    public FileMetadata getFileMetadataEntity(String fileId) {
        return fileRepository.findByFileIdAndIsDeletedFalse(fileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + fileId));
    }
    
    @Transactional
    public void incrementDownloadCount(String fileId) {
        FileMetadata metadata = getFileMetadataEntity(fileId);
        metadata.setDownloadCount(metadata.getDownloadCount() + 1);
        fileRepository.save(metadata);
    }
    
    public Page<FileResponse> getUserFiles(Long userId, Pageable pageable) {
        return fileRepository.findByUploadedByAndIsDeletedFalse(userId, pageable)
                .map(this::mapToResponse);
    }
    
    public Page<FileResponse> getFilesByCategory(FileMetadata.FileCategory category, Pageable pageable) {
        return fileRepository.findByCategoryAndIsDeletedFalse(category, pageable)
                .map(this::mapToResponse);
    }
    
    public Page<FileResponse> getUserFilesByCategory(Long userId, FileMetadata.FileCategory category, 
                                                     Pageable pageable) {
        return fileRepository.findByUploadedByAndCategoryAndIsDeletedFalse(userId, category, pageable)
                .map(this::mapToResponse);
    }
    
    public FileResponse getLatestAvatar(Long userId) {
        List<FileMetadata> avatars = fileRepository.findLatestByUserAndCategory(
            userId, FileMetadata.FileCategory.AVATAR
        );
        
        if (avatars.isEmpty()) {
            return null;
        }
        
        return mapToResponse(avatars.get(0));
    }
    
    @Transactional
    public void deleteFile(String fileId, Long userId) throws IOException {
        FileMetadata metadata = getFileMetadataEntity(fileId);
        
        // Check ownership
        if (!metadata.getUploadedBy().equals(userId)) {
            throw new RuntimeException("Unauthorized to delete this file");
        }
        
        // Soft delete
        metadata.setIsDeleted(true);
        metadata.setDeletedAt(LocalDateTime.now());
        fileRepository.save(metadata);
        
        // Physical deletion (optional - could be done by scheduled job)
        try {
            storageService.deleteFile(metadata.getStorageLocation());
            if (metadata.getThumbnailLocation() != null) {
                storageService.deleteThumbnail(metadata.getThumbnailLocation());
            }
        } catch (Exception e) {
            log.error("Failed to delete physical file {}: {}", fileId, e.getMessage());
        }
        
        log.info("File deleted: {} by user {}", fileId, userId);
    }
    
    public Long getUserTotalSize(Long userId) {
        Long size = fileRepository.getTotalSizeByUser(userId);
        return size != null ? size : 0L;
    }
    
    public Long getUserFileCount(Long userId) {
        return fileRepository.countByUploadedByAndIsDeletedFalse(userId);
    }
    
    private void validateFile(MultipartFile file, FileMetadata.FileCategory category) {
        if (file.isEmpty()) {
            throw new RuntimeException("File is empty");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isEmpty()) {
            throw new RuntimeException("Invalid filename");
        }
        
        // Check file size
        Long maxSize = category == FileMetadata.FileCategory.AVATAR
                ? properties.getAvatar().getMaxSize()
                : properties.getUpload().getMaxSize();
        
        if (file.getSize() > maxSize) {
            throw new RuntimeException("File size exceeds maximum allowed: " + maxSize + " bytes");
        }
        
        // Check file extension
        String extension = getFileExtension(originalFilename).toLowerCase();
        if (extension.startsWith(".")) {
            extension = extension.substring(1);
        }
        
        String allowedTypes = category == FileMetadata.FileCategory.AVATAR
                ? properties.getAvatar().getAllowedTypes()
                : properties.getUpload().getAllowedTypes().get("all");
        
        if (allowedTypes != null && !allowedTypes.isEmpty()) {
            List<String> allowed = Arrays.asList(allowedTypes.split(","));
            if (!allowed.contains(extension)) {
                throw new RuntimeException("File type not allowed: " + extension);
            }
        }
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
    
    private FileResponse mapToResponse(FileMetadata metadata) {
        String baseUrl = properties.getStorage().getBaseUrl();
        
        return FileResponse.builder()
                .id(metadata.getId())
                .fileId(metadata.getFileId())
                .originalName(metadata.getOriginalName())
                .contentType(metadata.getContentType())
                .fileSize(metadata.getFileSize())
                .fileType(metadata.getFileType())
                .category(metadata.getCategory())
                .uploadedBy(metadata.getUploadedBy())
                .downloadUrl(baseUrl + "/download/" + metadata.getFileId())
                .thumbnailUrl(metadata.getThumbnailLocation() != null 
                    ? baseUrl + "/thumbnail/" + metadata.getFileId() 
                    : null)
                .isPublic(metadata.getIsPublic())
                .uploadedAt(metadata.getUploadedAt())
                .downloadCount(metadata.getDownloadCount())
                .build();
    }
}
