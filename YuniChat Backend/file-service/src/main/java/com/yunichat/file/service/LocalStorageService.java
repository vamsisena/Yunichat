package com.yunichat.file.service;

import com.yunichat.file.config.FileStorageProperties;
import com.yunichat.file.entity.FileMetadata;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import net.coobird.thumbnailator.Thumbnails;
import org.apache.tika.Tika;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class LocalStorageService {
    
    private final FileStorageProperties properties;
    private final Tika tika = new Tika();
    private Path uploadLocation;
    
    @PostConstruct
    public void init() {
        try {
            uploadLocation = Paths.get(properties.getStorage().getLocation()).toAbsolutePath().normalize();
            Files.createDirectories(uploadLocation);
            Files.createDirectories(uploadLocation.resolve("thumbnails"));
            log.info("Created upload directory at: {}", uploadLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not create upload directory", e);
        }
    }
    
    public String storeFile(MultipartFile file, FileMetadata.FileCategory category) throws IOException {
        String originalFilename = file.getOriginalFilename();
        String extension = getFileExtension(originalFilename);
        String storedName = UUID.randomUUID().toString() + extension;
        
        Path categoryPath = uploadLocation.resolve(category.name().toLowerCase());
        Files.createDirectories(categoryPath);
        
        Path targetLocation = categoryPath.resolve(storedName);
        
        try (InputStream inputStream = file.getInputStream()) {
            Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
        }
        
        log.info("Stored file: {} as {}", originalFilename, storedName);
        return category.name().toLowerCase() + "/" + storedName;
    }
    
    public String createThumbnail(String storedLocation, int size) throws IOException {
        Path sourcePath = uploadLocation.resolve(storedLocation);
        
        if (!Files.exists(sourcePath)) {
            throw new IOException("Source file not found: " + storedLocation);
        }
        
        String thumbnailName = "thumb_" + Paths.get(storedLocation).getFileName().toString();
        Path thumbnailPath = uploadLocation.resolve("thumbnails").resolve(thumbnailName);
        
        Thumbnails.of(sourcePath.toFile())
                .size(size, size)
                .keepAspectRatio(true)
                .toFile(thumbnailPath.toFile());
        
        log.info("Created thumbnail: {}", thumbnailName);
        return "thumbnails/" + thumbnailName;
    }
    
    public Path loadFile(String storedLocation) {
        return uploadLocation.resolve(storedLocation).normalize();
    }
    
    public void deleteFile(String storedLocation) throws IOException {
        Path filePath = uploadLocation.resolve(storedLocation).normalize();
        Files.deleteIfExists(filePath);
        log.info("Deleted file: {}", storedLocation);
    }
    
    public void deleteThumbnail(String thumbnailLocation) throws IOException {
        if (thumbnailLocation != null) {
            Path thumbnailPath = uploadLocation.resolve(thumbnailLocation).normalize();
            Files.deleteIfExists(thumbnailPath);
            log.info("Deleted thumbnail: {}", thumbnailLocation);
        }
    }
    
    public String detectContentType(MultipartFile file) throws IOException {
        return tika.detect(file.getInputStream(), file.getOriginalFilename());
    }
    
    public FileMetadata.FileType determineFileType(String contentType) {
        if (contentType.startsWith("image/")) return FileMetadata.FileType.IMAGE;
        if (contentType.startsWith("video/")) return FileMetadata.FileType.VIDEO;
        if (contentType.startsWith("audio/")) return FileMetadata.FileType.AUDIO;
        if (contentType.contains("pdf") || contentType.contains("document") || 
            contentType.contains("text") || contentType.contains("spreadsheet")) {
            return FileMetadata.FileType.DOCUMENT;
        }
        if (contentType.contains("zip") || contentType.contains("rar") || 
            contentType.contains("7z") || contentType.contains("tar")) {
            return FileMetadata.FileType.ARCHIVE;
        }
        return FileMetadata.FileType.OTHER;
    }
    
    private String getFileExtension(String filename) {
        if (filename == null || filename.lastIndexOf('.') == -1) {
            return "";
        }
        return filename.substring(filename.lastIndexOf('.'));
    }
}
