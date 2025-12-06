import notificationApi from '../../api/notificationApi';
import {
  LOAD_NOTIFICATIONS,
  ADD_NOTIFICATION,
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION,
  CLEAR_NOTIFICATIONS,
  UPDATE_UNREAD_COUNT,
} from '../actionTypes/notificationTypes';

// Load notifications
export const loadNotifications = (page = 0, size = 20) => async (dispatch) => {
  try {
    const response = await notificationApi.getNotifications(page, size);
    // Handle both response.data and response.data.data formats
    const notifications = response.data?.data?.content || response.data?.content || response.data || [];
    
    dispatch({
      type: LOAD_NOTIFICATIONS,
      payload: notifications,
    });
    
    return { success: true, data: notifications };
  } catch (error) {
    console.error('Error loading notifications:', error);
    return { success: false, message: error.message };
  }
};

// Add notification (from WebSocket)
export const addNotification = (notification) => ({
  type: ADD_NOTIFICATION,
  payload: notification,
});

// Mark as read
export const markAsRead = (notificationId) => async (dispatch) => {
  try {
    console.log('Marking notification as read:', notificationId);
    
    // Check if this is a local-only notification (uses Date.now() as ID)
    const isLocalNotification = typeof notificationId === 'number' && notificationId > 1000000000000;
    
    if (!isLocalNotification) {
      // Only call API for server notifications
      await notificationApi.markAsRead(notificationId);
    } else {
      console.log('Marking local notification as read (no API call needed)');
    }
    
    dispatch({
      type: MARK_AS_READ,
      payload: notificationId,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking notification as read:', error);
    return { success: false, message: error.message };
  }
};

// Mark all as read
export const markAllAsRead = () => async (dispatch, getState) => {
  try {
    console.log('Marking all notifications as read');
    
    // Check if there are any server notifications (not local-only)
    const notifications = getState()?.notifications?.notifications || [];
    const hasServerNotifications = notifications.some(n => 
      typeof n.id !== 'number' || n.id <= 1000000000000
    );
    
    if (hasServerNotifications) {
      // Only call API if there are server notifications
      await notificationApi.markAllAsRead();
    } else {
      console.log('All notifications are local (no API call needed)');
    }
    
    dispatch({
      type: MARK_ALL_AS_READ,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error marking all as read:', error);
    return { success: false, message: error.message };
  }
};

// Delete notification
export const deleteNotification = (notificationId) => async (dispatch) => {
  try {
    console.log('Deleting notification:', notificationId);
    
    // Check if this is a local-only notification (uses Date.now() as ID)
    const isLocalNotification = typeof notificationId === 'number' && notificationId > 1000000000000;
    
    if (!isLocalNotification) {
      // Only call API for server notifications
      await notificationApi.deleteNotification(notificationId);
    } else {
      console.log('Deleting local notification (no API call needed)');
    }
    
    dispatch({
      type: DELETE_NOTIFICATION,
      payload: notificationId,
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting notification:', error);
    return { success: false, message: error.message };
  }
};

// Clear all notifications
export const clearAllNotifications = () => async (dispatch) => {
  try {
    await notificationApi.clearAllNotifications();
    
    dispatch({
      type: CLEAR_NOTIFICATIONS,
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Update unread count
export const updateUnreadCount = (count) => ({
  type: UPDATE_UNREAD_COUNT,
  payload: count,
});
