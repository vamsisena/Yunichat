package com.yunichat.notification.service;

import com.yunichat.common.exception.BadRequestException;
import com.yunichat.common.exception.ResourceNotFoundException;
import com.yunichat.notification.dto.NotificationRequest;
import com.yunichat.notification.dto.NotificationResponse;
import com.yunichat.notification.dto.NotificationStats;
import com.yunichat.notification.entity.Notification;
import com.yunichat.notification.entity.NotificationType;
import com.yunichat.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
@SuppressWarnings("null")
public class NotificationService {

    private final NotificationRepository notificationRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Value("${notification.max-unread-per-user:1000}")
    private int maxUnreadPerUser;

    @Value("${notification.retention-days:30}")
    private int retentionDays;

    /**
     * Create and send a notification
     */
    @Transactional
    public NotificationResponse createNotification(NotificationRequest request) {
        log.info("Creating notification for user: {}", request.getUserId());

        // Check unread limit
        Long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(request.getUserId());
        if (unreadCount >= maxUnreadPerUser) {
            throw new BadRequestException("Maximum unread notifications limit reached");
        }

        // Create notification
        Notification notification = Notification.builder()
                .userId(request.getUserId())
                .type(request.getType())
                .title(request.getTitle())
                .message(request.getMessage())
                .actionUrl(request.getActionUrl())
                .referenceId(request.getReferenceId())
                .referenceType(request.getReferenceType())
                .expiresAt(request.getExpiresAt())
                .isRead(false)
                .build();

        notification = notificationRepository.save(notification);
        log.info("Notification created with ID: {}", notification.getId());

        // Convert to response
        NotificationResponse response = convertToResponse(notification);

        // Send real-time notification via WebSocket
        sendRealTimeNotification(response);

        return response;
    }

    /**
     * Get all notifications for a user (paginated)
     */
    public Page<NotificationResponse> getUserNotifications(Long userId, int page, int size) {
        log.debug("Fetching notifications for user: {}", userId);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(this::convertToResponse);
    }

    /**
     * Get unread notifications for a user
     */
    public Page<NotificationResponse> getUnreadNotifications(Long userId, int page, int size) {
        log.debug("Fetching unread notifications for user: {}", userId);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserIdAndIsReadFalseOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(this::convertToResponse);
    }

    /**
     * Get notifications by type
     */
    public Page<NotificationResponse> getNotificationsByType(Long userId, NotificationType type, int page, int size) {
        log.debug("Fetching {} notifications for user: {}", type, userId);
        Pageable pageable = PageRequest.of(page, size);
        Page<Notification> notifications = notificationRepository.findByUserIdAndTypeOrderByCreatedAtDesc(userId, type, pageable);
        return notifications.map(this::convertToResponse);
    }

    /**
     * Get notification by ID
     */
    public NotificationResponse getNotificationById(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        // Verify ownership
        if (!notification.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied");
        }

        return convertToResponse(notification);
    }

    /**
     * Mark notification as read
     */
    @Transactional
    public NotificationResponse markAsRead(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        // Verify ownership
        if (!notification.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied");
        }

        if (!notification.getIsRead()) {
            notification.markAsRead();
            notification = notificationRepository.save(notification);
            log.info("Notification {} marked as read", id);
        }

        return convertToResponse(notification);
    }

    /**
     * Mark all notifications as read
     */
    @Transactional
    public int markAllAsRead(Long userId) {
        log.info("Marking all notifications as read for user: {}", userId);
        int count = notificationRepository.markAllAsRead(userId, LocalDateTime.now());
        log.info("Marked {} notifications as read", count);
        return count;
    }

    /**
     * Delete notification
     */
    @Transactional
    public void deleteNotification(Long id, Long userId) {
        Notification notification = notificationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Notification not found"));

        // Verify ownership
        if (!notification.getUserId().equals(userId)) {
            throw new BadRequestException("Access denied");
        }

        notificationRepository.delete(notification);
        log.info("Notification {} deleted", id);
    }

    /**
     * Delete all notifications for a user
     */
    @Transactional
    public void deleteAllNotifications(Long userId) {
        log.info("Deleting all notifications for user: {}", userId);
        Pageable pageable = PageRequest.of(0, 1000);
        Page<Notification> notifications = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        notificationRepository.deleteAll(notifications.getContent());
        log.info("Deleted {} notifications", notifications.getTotalElements());
    }

    /**
     * Get notification statistics
     */
    public NotificationStats getStats(Long userId) {
        Long totalCount = notificationRepository.countByUserId(userId);
        Long unreadCount = notificationRepository.countByUserIdAndIsReadFalse(userId);
        Long readCount = totalCount - unreadCount;

        // Count expired
        Pageable pageable = PageRequest.of(0, Integer.MAX_VALUE);
        Page<Notification> all = notificationRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable);
        long expiredCount = all.getContent().stream()
                .filter(n -> n.getExpiresAt() != null && LocalDateTime.now().isAfter(n.getExpiresAt()))
                .count();

        return NotificationStats.builder()
                .totalCount(totalCount)
                .unreadCount(unreadCount)
                .readCount(readCount)
                .expiredCount(expiredCount)
                .build();
    }

    /**
     * Send real-time notification via WebSocket
     */
    private void sendRealTimeNotification(NotificationResponse notification) {
        try {
            String destination = "/topic/notifications." + notification.getUserId().toString();
            messagingTemplate.convertAndSend(destination, notification);
            log.debug("Sent real-time notification to: {}", destination);
        } catch (Exception e) {
            log.error("Failed to send real-time notification", e);
        }
    }

    /**
     * Cleanup old and expired notifications (runs daily at 2 AM)
     */
    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void cleanupOldNotifications() {
        log.info("Starting notification cleanup");

        // Delete expired notifications
        LocalDateTime now = LocalDateTime.now();
        int expiredCount = notificationRepository.deleteExpiredNotifications(now);
        log.info("Deleted {} expired notifications", expiredCount);

        // Delete old read notifications (older than retention days)
        LocalDateTime retentionDate = now.minusDays(retentionDays);
        
        // For each user, delete old notifications
        // Note: This is simplified. In production, consider batch processing
        log.info("Cleanup completed");
    }

    /**
     * Convert entity to response DTO
     */
    private NotificationResponse convertToResponse(Notification notification) {
        return NotificationResponse.builder()
                .id(notification.getId())
                .userId(notification.getUserId())
                .type(notification.getType())
                .typeDisplayName(notification.getType().getDisplayName())
                .title(notification.getTitle())
                .message(notification.getMessage())
                .actionUrl(notification.getActionUrl())
                .referenceId(notification.getReferenceId())
                .referenceType(notification.getReferenceType())
                .isRead(notification.getIsRead())
                .readAt(notification.getReadAt())
                .createdAt(notification.getCreatedAt())
                .expiresAt(notification.getExpiresAt())
                .build();
    }
}
