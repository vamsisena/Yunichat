package com.yunichat.file.controller;

import com.yunichat.common.dto.ApiResponse;
import com.yunichat.common.util.JwtUtil;
import com.yunichat.file.dto.FileResponse;
import com.yunichat.file.entity.FileMetadata;
import com.yunichat.file.service.FileService;
import com.yunichat.file.service.LocalStorageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import jakarta.servlet.http.HttpServletRequest;
import java.io.IOException;
import java.nio.file.Path;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Slf4j
public class FileController {
    
    private final FileService fileService;
    private final LocalStorageService storageService;
    private final JwtUtil jwtUtil;
    
    @PostMapping("/upload")
    public ResponseEntity<ApiResponse<FileResponse>> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("category") FileMetadata.FileCategory category,
            @RequestParam(value = "isPublic", required = false, defaultValue = "false") Boolean isPublic,
            HttpServletRequest request) {
        
        try {
            Long userId = extractUserId(request);
            FileResponse response = fileService.uploadFile(file, category, userId, isPublic);
            
            return ResponseEntity.ok(ApiResponse.success("File uploaded successfully", response));
        } catch (Exception e) {
            log.error("File upload failed", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File upload failed: " + e.getMessage()));
        }
    }
    
    @PostMapping("/avatar")
    public ResponseEntity<ApiResponse<FileResponse>> uploadAvatar(
            @RequestParam("file") MultipartFile file,
            HttpServletRequest request) {
        
        try {
            Long userId = extractUserId(request);
            FileResponse response = fileService.uploadFile(
                file, 
                FileMetadata.FileCategory.AVATAR, 
                userId, 
                true  // Avatars are public
            );
            
            return ResponseEntity.ok(ApiResponse.success("Avatar uploaded successfully", response));
        } catch (Exception e) {
            log.error("Avatar upload failed", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Avatar upload failed: " + e.getMessage()));
        }
    }
    
    @GetMapping("/download/{fileId}")
    public ResponseEntity<Resource> downloadFile(
            @PathVariable String fileId,
            HttpServletRequest request) {
        
        try {
            FileMetadata metadata = fileService.getFileMetadataEntity(fileId);
            
            // Check access permission
            if (!metadata.getIsPublic()) {
                Long userId = extractUserId(request);
                if (!metadata.getUploadedBy().equals(userId)) {
                    return ResponseEntity.status(403).build();
                }
            }
            
            Path filePath = storageService.loadFile(metadata.getStorageLocation());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            
            // Increment download count
            fileService.incrementDownloadCount(fileId);
            
            String contentType = metadata.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, 
                            "attachment; filename=\"" + metadata.getOriginalName() + "\"")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("File download failed for fileId: {}", fileId, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/view/{fileId}")
    public ResponseEntity<Resource> viewFile(@PathVariable String fileId) {
        try {
            FileMetadata metadata = fileService.getFileMetadataEntity(fileId);
            
            Path filePath = storageService.loadFile(metadata.getStorageLocation());
            Resource resource = new UrlResource(filePath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            
            String contentType = metadata.getContentType();
            if (contentType == null) {
                contentType = "application/octet-stream";
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.parseMediaType(contentType))
                    .header(HttpHeaders.CONTENT_DISPOSITION, "inline")
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("File view failed for fileId: {}", fileId, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/thumbnail/{fileId}")
    public ResponseEntity<Resource> getThumbnail(@PathVariable String fileId) {
        try {
            FileMetadata metadata = fileService.getFileMetadataEntity(fileId);
            
            if (metadata.getThumbnailLocation() == null) {
                return ResponseEntity.notFound().build();
            }
            
            Path thumbnailPath = storageService.loadFile(metadata.getThumbnailLocation());
            Resource resource = new UrlResource(thumbnailPath.toUri());
            
            if (!resource.exists() || !resource.isReadable()) {
                return ResponseEntity.notFound().build();
            }
            
            return ResponseEntity.ok()
                    .contentType(MediaType.IMAGE_JPEG)
                    .body(resource);
                    
        } catch (Exception e) {
            log.error("Thumbnail retrieval failed for fileId: {}", fileId, e);
            return ResponseEntity.notFound().build();
        }
    }
    
    @GetMapping("/{fileId}")
    public ResponseEntity<ApiResponse<FileResponse>> getFileMetadata(@PathVariable String fileId) {
        try {
            FileResponse response = fileService.getFileMetadata(fileId);
            return ResponseEntity.ok(ApiResponse.success("File metadata retrieved", response));
        } catch (Exception e) {
            return ResponseEntity.status(404)
                    .body(ApiResponse.error("File not found"));
        }
    }
    
    @GetMapping("/my-files")
    public ResponseEntity<ApiResponse<Page<FileResponse>>> getMyFiles(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        
        Long userId = extractUserId(request);
        Pageable pageable = PageRequest.of(page, size, Sort.by("uploadedAt").descending());
        Page<FileResponse> files = fileService.getUserFiles(userId, pageable);
        
        return ResponseEntity.ok(ApiResponse.success("Files retrieved", files));
    }
    
    @GetMapping("/my-files/category/{category}")
    public ResponseEntity<ApiResponse<Page<FileResponse>>> getMyFilesByCategory(
            @PathVariable FileMetadata.FileCategory category,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            HttpServletRequest request) {
        
        Long userId = extractUserId(request);
        Pageable pageable = PageRequest.of(page, size, Sort.by("uploadedAt").descending());
        Page<FileResponse> files = fileService.getUserFilesByCategory(userId, category, pageable);
        
        return ResponseEntity.ok(ApiResponse.success("Files retrieved", files));
    }
    
    @GetMapping("/avatar/latest")
    public ResponseEntity<ApiResponse<FileResponse>> getLatestAvatar(HttpServletRequest request) {
        Long userId = extractUserId(request);
        FileResponse avatar = fileService.getLatestAvatar(userId);
        
        if (avatar == null) {
            return ResponseEntity.ok(ApiResponse.success("No avatar found", null));
        }
        
        return ResponseEntity.ok(ApiResponse.success("Avatar retrieved", avatar));
    }
    
    @DeleteMapping("/{fileId}")
    public ResponseEntity<ApiResponse<Void>> deleteFile(
            @PathVariable String fileId,
            HttpServletRequest request) {
        
        try {
            Long userId = extractUserId(request);
            fileService.deleteFile(fileId, userId);
            
            return ResponseEntity.ok(ApiResponse.success("File deleted successfully", null));
        } catch (Exception e) {
            log.error("File deletion failed", e);
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("File deletion failed: " + e.getMessage()));
        }
    }
    
    @GetMapping("/stats")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getUserStats(HttpServletRequest request) {
        Long userId = extractUserId(request);
        
        Map<String, Object> stats = new HashMap<>();
        stats.put("totalFiles", fileService.getUserFileCount(userId));
        stats.put("totalSize", fileService.getUserTotalSize(userId));
        
        return ResponseEntity.ok(ApiResponse.success("Stats retrieved", stats));
    }
    
    @GetMapping("/health")
    public ResponseEntity<ApiResponse<String>> health() {
        return ResponseEntity.ok(ApiResponse.success("File Service is running", "UP"));
    }
    
    private Long extractUserId(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            return jwtUtil.extractUserId(token);
        }
        throw new RuntimeException("Unauthorized");
    }
}
