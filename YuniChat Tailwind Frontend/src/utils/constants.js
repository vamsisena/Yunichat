// API Base URL - Direct connection to backend Gateway like MUI version
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8080/api';

// WebSocket URLs - Direct connection to backend Gateway (SockJS uses HTTP/HTTPS, not WS)
const WS_BASE = process.env.REACT_APP_WS_URL || 'http://localhost:8080';
export const WS_URL = `${WS_BASE}/ws/chat`;
export const NOTIFICATION_WS_URL = `${WS_BASE}/ws/notifications`;

// Auth
export const TOKEN_KEY = 'yunichat_token';
export const USER_KEY = 'yunichat_user';

// Inactivity timeout (30 minutes)
export const INACTIVITY_TIMEOUT = 30 * 60 * 1000;

// File upload limits
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain',
];

// Message status
export const MESSAGE_STATUS = {
  SENDING: 'SENDING',
  SENT: 'SENT',
  DELIVERED: 'DELIVERED',
  READ: 'READ',
  FAILED: 'FAILED',
};

// User status
export const USER_STATUS = {
  ONLINE: 'ONLINE',
  OFFLINE: 'OFFLINE',
  AWAY: 'AWAY',
  BUSY: 'BUSY',
};

// Notification types
export const NOTIFICATION_TYPES = {
  FRIEND_REQUEST: 'FRIEND_REQUEST',
  FRIEND_REQUEST_ACCEPTED: 'FRIEND_REQUEST_ACCEPTED',
  NEW_MESSAGE: 'NEW_MESSAGE',
  GROUP_INVITE: 'GROUP_INVITE',
  SYSTEM: 'SYSTEM',
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;
export const MESSAGES_PAGE_SIZE = 50;
