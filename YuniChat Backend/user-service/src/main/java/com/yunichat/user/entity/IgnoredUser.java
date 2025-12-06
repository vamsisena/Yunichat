package com.yunichat.user.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

@Entity
@Table(name = "ignored_users", 
       uniqueConstraints = @UniqueConstraint(columnNames = {"ignorer_user_id", "ignored_user_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@EntityListeners(AuditingEntityListener.class)
public class IgnoredUser {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "ignorer_user_id", nullable = false)
    private Long ignorerUserId;
    
    @Column(name = "ignored_user_id", nullable = false)
    private Long ignoredUserId;
    
    @CreatedDate
    @Column(name = "ignored_at", nullable = false, updatable = false)
    private LocalDateTime ignoredAt;
}
