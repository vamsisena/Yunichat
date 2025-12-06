/**
 * Browser Notifications Utility
 * Handles browser notifications for incoming calls
 */

let notificationPermission = 'default';

/**
 * Request notification permission from user
 */
export const requestNotificationPermission = async () => {
  if (!('Notification' in window)) {
    console.warn('Browser does not support notifications');
    return false;
  }

  if (Notification.permission === 'granted') {
    notificationPermission = 'granted';
    return true;
  }

  if (Notification.permission !== 'denied') {
    try {
      const permission = await Notification.requestPermission();
      notificationPermission = permission;
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  return false;
};

/**
 * Show notification for incoming call
 * @param {string} callerUsername - Name of the caller
 * @param {string} callType - 'AUDIO' or 'VIDEO'
 * @param {Function} onClickCallback - Callback when notification is clicked
 */
export const showIncomingCallNotification = (callerUsername, callType, onClickCallback) => {
  // Only show if tab is not focused
  if (document.hasFocus()) {
    return null;
  }

  if (notificationPermission !== 'granted' && Notification.permission === 'granted') {
    notificationPermission = 'granted';
  }

  if (notificationPermission !== 'granted') {
    console.log('Notification permission not granted');
    return null;
  }

  try {
    const notification = new Notification('YuniChat - Incoming Call', {
      body: `Incoming ${callType.toLowerCase()} call from ${callerUsername}`,
      icon: '/logo192.png',
      badge: '/logo192.png',
      tag: 'incoming-call',
      requireInteraction: true,
      vibrate: [200, 100, 200],
    });

    notification.onclick = () => {
      window.focus();
      if (onClickCallback) {
        onClickCallback();
      }
      notification.close();
    };

    // Auto-close after 30 seconds
    setTimeout(() => {
      notification.close();
    }, 30000);

    return notification;
  } catch (error) {
    console.error('Error showing notification:', error);
    return null;
  }
};

/**
 * Close all call notifications
 */
export const closeCallNotifications = () => {
  // Close notification by tag is not widely supported
  // So we rely on the notification.close() in individual handlers
};

/**
 * Check if notifications are supported
 */
export const isNotificationSupported = () => {
  return 'Notification' in window;
};

/**
 * Get current notification permission status
 */
export const getNotificationPermission = () => {
  if (!('Notification' in window)) {
    return 'unsupported';
  }
  return Notification.permission;
};
