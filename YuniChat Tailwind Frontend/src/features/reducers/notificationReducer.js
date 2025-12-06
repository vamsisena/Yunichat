import {
  LOAD_NOTIFICATIONS,
  ADD_NOTIFICATION,
  MARK_AS_READ,
  MARK_ALL_AS_READ,
  DELETE_NOTIFICATION,
  CLEAR_NOTIFICATIONS,
  UPDATE_UNREAD_COUNT,
} from '../actionTypes/notificationTypes';

const initialState = {
  notifications: [],
  unreadCount: 0,
};

export default function notificationsReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_NOTIFICATIONS:
      // Merge server notifications with local-only notifications (created on client)
      const serverNotifications = Array.isArray(action.payload) ? action.payload : [];
      const localNotifications = state.notifications.filter(n => 
        typeof n.id === 'number' && n.id > 1000000000000 // Local notifications use Date.now() as ID
      );
      const mergedNotifications = [...localNotifications, ...serverNotifications];
      
      return {
        ...state,
        notifications: mergedNotifications,
        unreadCount: mergedNotifications.filter((n) => !n.read && !n.isRead).length,
      };

    case ADD_NOTIFICATION:
      console.log('Adding notification to state:', action.payload);
      return {
        ...state,
        notifications: [action.payload, ...state.notifications],
        unreadCount: state.unreadCount + 1,
      };

    case MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.id === action.payload ? { ...n, read: true, isRead: true } : n
        ),
        unreadCount: Math.max(0, state.unreadCount - 1),
      };

    case MARK_ALL_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map((n) => ({ ...n, read: true, isRead: true })),
        unreadCount: 0,
      };

    case DELETE_NOTIFICATION:
      const notification = state.notifications.find((n) => n.id === action.payload);
      return {
        ...state,
        notifications: state.notifications.filter((n) => n.id !== action.payload),
        unreadCount: notification && !notification.read
          ? Math.max(0, state.unreadCount - 1)
          : state.unreadCount,
      };

    case CLEAR_NOTIFICATIONS:
      return {
        ...state,
        notifications: [],
        unreadCount: 0,
      };

    case UPDATE_UNREAD_COUNT:
      return {
        ...state,
        unreadCount: action.payload,
      };

    default:
      return state;
  }
}
