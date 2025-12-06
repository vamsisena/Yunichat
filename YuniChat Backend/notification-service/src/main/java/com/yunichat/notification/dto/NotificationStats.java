package com.yunichat.notification.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class NotificationStats {
    private Long totalCount;
    private Long unreadCount;
    private Long readCount;
    private Long expiredCount;
}
