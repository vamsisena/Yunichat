package com.yunichat.chat.repository;

import com.yunichat.chat.entity.Message;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface MessageRepository extends JpaRepository<Message, Long> {
    
    Page<Message> findByRoomIdAndIsDeletedFalseOrderByCreatedAtDesc(String roomId, Pageable pageable);
    
    List<Message> findByRoomIdAndCreatedAtAfter(String roomId, LocalDateTime after);
    
    @Query("SELECT m FROM Message m WHERE m.roomId = :roomId AND m.isDeleted = false ORDER BY m.createdAt DESC")
    List<Message> findRecentMessages(String roomId, Pageable pageable);
    
    long countByRoomIdAndIsDeletedFalse(String roomId);
    
    List<Message> findBySenderIdAndRoomId(Long senderId, String roomId);
    
    @Query("SELECT m FROM Message m WHERE (m.roomId = :roomId1 OR m.roomId = :roomId2) AND m.isDeleted = false ORDER BY m.createdAt ASC")
    List<Message> findPrivateMessages(String roomId1, String roomId2);
    
    // New query for finding old messages to cleanup
    @Query("SELECT m FROM Message m WHERE m.roomId = :roomId AND m.createdAt < :cutoffTime")
    List<Message> findByRoomIdAndCreatedAtBefore(@Param("roomId") String roomId, @Param("cutoffTime") LocalDateTime cutoffTime);
    
    // Query for paginated messages with time filter
    @Query("SELECT m FROM Message m WHERE m.roomId = :roomId AND m.createdAt > :cutoffTime AND m.isDeleted = false ORDER BY m.createdAt DESC")
    Page<Message> findByRoomIdAndCreatedAtAfterAndIsDeletedFalse(@Param("roomId") String roomId, @Param("cutoffTime") LocalDateTime cutoffTime, Pageable pageable);
    
    // Find unread messages for a recipient in a specific room
    @Query("SELECT m FROM Message m WHERE m.roomId = :roomId AND m.senderId != :userId AND m.isRead = false")
    List<Message> findUnreadMessagesForUser(@Param("roomId") String roomId, @Param("userId") Long userId);
    
    // Find specific message by ID and room
    Optional<Message> findByIdAndRoomId(Long id, String roomId);
}
