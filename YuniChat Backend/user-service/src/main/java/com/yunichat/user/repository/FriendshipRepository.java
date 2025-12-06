package com.yunichat.user.repository;

import com.yunichat.user.entity.Friendship;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FriendshipRepository extends JpaRepository<Friendship, Long> {
    
    List<Friendship> findByUserId(Long userId);
    
    Optional<Friendship> findByUserIdAndFriendId(Long userId, Long friendId);
    
    boolean existsByUserIdAndFriendId(Long userId, Long friendId);
    
    void deleteByUserIdAndFriendId(Long userId, Long friendId);
    
    @Query("SELECT f.friendId FROM Friendship f WHERE f.userId = :userId")
    List<Long> findFriendIdsByUserId(@Param("userId") Long userId);
}
