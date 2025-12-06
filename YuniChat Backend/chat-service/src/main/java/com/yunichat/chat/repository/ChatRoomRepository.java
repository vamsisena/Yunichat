package com.yunichat.chat.repository;

import com.yunichat.chat.entity.ChatRoom;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ChatRoomRepository extends JpaRepository<ChatRoom, Long> {
    
    Optional<ChatRoom> findByRoomId(String roomId);
    
    List<ChatRoom> findByType(ChatRoom.RoomType type);
    
    @Query("SELECT r FROM ChatRoom r WHERE r.isActive = true AND r.type = 'PUBLIC'")
    List<ChatRoom> findAllPublicRooms();
    
    List<ChatRoom> findByCreatedBy(Long userId);
    
    boolean existsByRoomId(String roomId);
}
