package com.yunichat.chat.repository;

import com.yunichat.chat.entity.RoomMember;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RoomMemberRepository extends JpaRepository<RoomMember, Long> {
    
    List<RoomMember> findByRoomId(String roomId);
    
    List<RoomMember> findByUserId(Long userId);
    
    Optional<RoomMember> findByRoomIdAndUserId(String roomId, Long userId);
    
    boolean existsByRoomIdAndUserId(String roomId, Long userId);
    
    void deleteByRoomIdAndUserId(String roomId, Long userId);
    
    @Query("SELECT COUNT(rm) FROM RoomMember rm WHERE rm.roomId = :roomId")
    int countMembersByRoomId(String roomId);
    
    @Query("SELECT rm.userId FROM RoomMember rm WHERE rm.roomId = :roomId")
    List<Long> findUserIdsByRoomId(String roomId);
}
