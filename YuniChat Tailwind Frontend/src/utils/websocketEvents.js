// WebSocket event types for Chat Service
export const CHAT_EVENTS = {
  // Outgoing (client to server)
  SEND_MESSAGE: '/app/chat.sendMessage',
  TYPING_START: '/app/chat.typing',
  TYPING_STOP: '/app/chat.stopTyping',
  JOIN_ROOM: '/app/chat.addUser',
  LEAVE_ROOM: '/app/chat.removeUser',

  // Incoming (server to client)
  MESSAGE: '/topic/public',
  PRIVATE_MESSAGE: '/user/queue/messages',
  TYPING_STATUS: '/topic/typing',
  USER_JOINED: '/topic/public',
  USER_LEFT: '/topic/public',
  MESSAGE_STATUS: '/user/queue/status',
};

// WebSocket event types for Notification Service
export const NOTIFICATION_EVENTS = {
  // Incoming (server to client)
  NOTIFICATION: '/topic/notifications.',  // + userId
  FRIEND_REQUEST: '/user/queue/friend-requests',
  MESSAGE_NOTIFICATION: '/user/queue/message-notifications',
};

// Message types
export const MESSAGE_TYPES = {
  CHAT: 'CHAT',
  JOIN: 'JOIN',
  LEAVE: 'LEAVE',
  TYPING: 'TYPING',
  STOP_TYPING: 'STOP_TYPING',
};

// Connection states
export const CONNECTION_STATES = {
  CONNECTING: 'CONNECTING',
  CONNECTED: 'CONNECTED',
  DISCONNECTED: 'DISCONNECTED',
  RECONNECTING: 'RECONNECTING',
  ERROR: 'ERROR',
};
