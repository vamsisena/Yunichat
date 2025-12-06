package com.yunichat.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<com.yunichat.user.entity.User, Long> {
    
    Optional<com.yunichat.user.entity.User> findByUsername(String username);
    
    Optional<com.yunichat.user.entity.User> findByEmail(String email);
    
    boolean existsByUsername(String username);
    
    boolean existsByEmail(String email);
    
    @Query("SELECT u FROM User u WHERE " +
           "(LOWER(u.username) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(u.email) LIKE LOWER(CONCAT('%', :query, '%'))) AND " +
           "u.status != 'offline' ORDER BY u.isGuest ASC, u.username ASC")
    List<com.yunichat.user.entity.User> searchUsers(@Param("query") String query);
    
    List<com.yunichat.user.entity.User> findByIsGuestTrue();
}
