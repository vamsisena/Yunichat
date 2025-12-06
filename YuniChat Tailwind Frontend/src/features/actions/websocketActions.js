import {
  WS_CHAT_CONNECTED,
  WS_CHAT_DISCONNECTED,
  WS_CHAT_SET_CLIENT,
  WS_NOTIFICATION_CONNECTED,
  WS_NOTIFICATION_DISCONNECTED,
  WS_NOTIFICATION_SET_CLIENT,
} from '../actionTypes/websocketTypes';

// Chat WebSocket actions
export const setChatConnected = (connected) => ({
  type: connected ? WS_CHAT_CONNECTED : WS_CHAT_DISCONNECTED,
});

export const setChatClient = (client) => ({
  type: WS_CHAT_SET_CLIENT,
  payload: client,
});

// Notification WebSocket actions
export const setNotificationConnected = (connected) => ({
  type: connected ? WS_NOTIFICATION_CONNECTED : WS_NOTIFICATION_DISCONNECTED,
});

export const setNotificationClient = (client) => ({
  type: WS_NOTIFICATION_SET_CLIENT,
  payload: client,
});
