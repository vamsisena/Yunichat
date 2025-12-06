package com.yunichat.file.repository;

import com.yunichat.file.entity.FileMetadata;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileMetadataRepository extends JpaRepository<FileMetadata, Long> {
    
    Optional<FileMetadata> findByFileIdAndIsDeletedFalse(String fileId);
    
    Optional<FileMetadata> findByFileId(String fileId);
    
    Page<FileMetadata> findByUploadedByAndIsDeletedFalse(Long userId, Pageable pageable);
    
    Page<FileMetadata> findByCategoryAndIsDeletedFalse(FileMetadata.FileCategory category, Pageable pageable);
    
    Page<FileMetadata> findByUploadedByAndCategoryAndIsDeletedFalse(
            Long userId, FileMetadata.FileCategory category, Pageable pageable);
    
    @Query("SELECT f FROM FileMetadata f WHERE f.uploadedBy = ?1 AND f.category = ?2 ORDER BY f.uploadedAt DESC")
    List<FileMetadata> findLatestByUserAndCategory(Long userId, FileMetadata.FileCategory category);
    
    Long countByUploadedByAndIsDeletedFalse(Long userId);
    
    @Query("SELECT SUM(f.fileSize) FROM FileMetadata f WHERE f.uploadedBy = ?1 AND f.isDeleted = false")
    Long getTotalSizeByUser(Long userId);
}
