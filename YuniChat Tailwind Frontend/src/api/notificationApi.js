import axiosClient from './axiosClient';

const notificationApi = {
  // Get all notifications (paginated)
  getNotifications: (page = 0, size = 20) => {
    return axiosClient.get('/notifications', {
      params: { page, size },
    });
  },

  // Get unread notifications
  getUnreadNotifications: (page = 0, size = 20) => {
    return axiosClient.get('/notifications/unread', {
      params: { page, size },
    });
  },

  // Get notification by ID
  getNotificationById: (notificationId) => {
    return axiosClient.get(`/notifications/${notificationId}`);
  },

  // Get notifications by type
  getNotificationsByType: (type, page = 0, size = 20) => {
    return axiosClient.get('/notifications/type', {
      params: { type, page, size },
    });
  },

  // Mark notification as read
  markAsRead: (notificationId) => {
    return axiosClient.put(`/notifications/${notificationId}/read`);
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    return axiosClient.put('/notifications/read-all');
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    return axiosClient.delete(`/notifications/${notificationId}`);
  },

  // Clear all notifications
  clearAllNotifications: () => {
    return axiosClient.delete('/notifications');
  },

  // Get notification statistics
  getStatistics: () => {
    return axiosClient.get('/notifications/statistics');
  },

  // Get notification count
  getUnreadCount: () => {
    return axiosClient.get('/notifications/unread/count');
  },
};

export default notificationApi;
