// Message persistence utilities
const PUBLIC_MESSAGES_KEY = 'yunichat_public_messages';
const PRIVATE_MESSAGES_KEY_PREFIX = 'yunichat_private_messages_';
const GUEST_SESSION_KEY_PREFIX = 'yunichat_guest_session_';
const MESSAGE_TIMESTAMP_KEY = 'yunichat_messages_timestamp';
const PUBLIC_CHAT_TTL = 30 * 60 * 1000; // 30 minutes in milliseconds to match backend
const GUEST_SESSION_TTL = 24 * 60 * 60 * 1000; // 24 hours for guests

/**
 * Get current IST date string (YYYY-MM-DD) for daily reset
 */
const getISTDateString = () => {
  const now = new Date();
  const istDate = new Date(now.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
  return istDate.toISOString().split('T')[0];
};

/**
 * Check if user is guest
 */
const isGuestUser = (userId) => {
  const userStr = localStorage.getItem('yunichat_user');
  if (!userStr) return false;
  try {
    const user = JSON.parse(userStr);
    return user.isGuest === true;
  } catch {
    return false;
  }
};






/**
 * Save public messages to localStorage with timestamp
 * Preserves original timestamp to allow proper TTL expiration
 */
export const savePublicMessages = (messages) => {
  try {
    // Get existing timestamp or create new one
    let timestamp = Date.now();
    const existingData = localStorage.getItem(PUBLIC_MESSAGES_KEY);
    if (existingData) {
      try {
        const parsed = JSON.parse(existingData);
        if (parsed.timestamp) {
          timestamp = parsed.timestamp; // Preserve original timestamp
        }
      } catch (e) {
        // If parsing fails, use new timestamp
      }
    }
    
    const data = {
      messages,
      timestamp: timestamp,
    };
    localStorage.setItem(PUBLIC_MESSAGES_KEY, JSON.stringify(data));
    localStorage.setItem(MESSAGE_TIMESTAMP_KEY, timestamp.toString());
  } catch (error) {
    console.error('Error saving public messages:', error);
  }
};

/**
 * Load public messages from localStorage
 * Returns null if messages are older than 15 minutes
 */
export const loadPublicMessages = () => {
  try {
    const data = localStorage.getItem(PUBLIC_MESSAGES_KEY);
    if (!data) return null;

    const { messages, timestamp } = JSON.parse(data);
    const now = Date.now();

    // Check if messages are older than 30 minutes
    if (now - timestamp > PUBLIC_CHAT_TTL) {
      console.log('Public chat messages expired (> 30 minutes), clearing...');
      clearPublicMessages();
      return null;
    }

    console.log(`Loaded ${messages.length} public messages from localStorage`);
    return messages;
  } catch (error) {
    console.error('Error loading public messages:', error);
    return null;
  }
};

/**
 * Clear public messages from localStorage
 */
export const clearPublicMessages = () => {
  try {
    localStorage.removeItem(PUBLIC_MESSAGES_KEY);
    localStorage.removeItem(MESSAGE_TIMESTAMP_KEY);
    console.log('Public messages cleared from localStorage');
  } catch (error) {
    console.error('Error clearing public messages:', error);
  }
};

/**
 * Save private messages for a specific user
 * For guests: Uses sessionStorage (cleared on logout/close)
 * For registered: Uses localStorage (persists indefinitely - backend is source of truth)
 */
export const savePrivateMessages = (userId, messages) => {
  try {
    const isGuest = isGuestUser();
    const key = `${isGuest ? GUEST_SESSION_KEY_PREFIX : PRIVATE_MESSAGES_KEY_PREFIX}${userId}`;
    const data = {
      messages,
      timestamp: Date.now(),
    };
    
    if (isGuest) {
      sessionStorage.setItem(key, JSON.stringify(data));
    } else {
      // For registered users, store in localStorage without expiry
      // Backend database is the source of truth, localStorage is just a cache
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (error) {
    console.error('Error saving private messages:', error);
  }
};

/**
 * Load private messages for a specific user
 * For guests: Load from sessionStorage
 * For registered: Load from localStorage (no expiry - persists indefinitely)
 */
export const loadPrivateMessages = (userId) => {
  try {
    const isGuest = isGuestUser();
    const key = `${isGuest ? GUEST_SESSION_KEY_PREFIX : PRIVATE_MESSAGES_KEY_PREFIX}${userId}`;
    const storage = isGuest ? sessionStorage : localStorage;
    const dataStr = storage.getItem(key);
    
    if (!dataStr) return null;

    const data = JSON.parse(dataStr);
    const messages = data.messages || data; // Support old format
    
    // For registered users, private messages persist indefinitely in localStorage
    // Backend database is always the source of truth and is loaded on chat open
    // localStorage just provides quick access to cached messages
    
    console.log(`Loaded ${messages.length} private messages for user ${userId} from ${isGuest ? 'sessionStorage' : 'localStorage'}`);
    return messages;
  } catch (error) {
    console.error('Error loading private messages:', error);
    return null;
  }
};

/**
 * Clear private messages for a specific user
 */
export const clearPrivateMessages = (userId) => {
  try {
    const key = `${PRIVATE_MESSAGES_KEY_PREFIX}${userId}`;
    localStorage.removeItem(key);
  } catch (error) {
    console.error('Error clearing private messages:', error);
  }
};

/**
 * Get all private message keys
 */
export const getAllPrivateMessageKeys = () => {
  const keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(PRIVATE_MESSAGES_KEY_PREFIX)) {
      keys.push(key);
    }
  }
  return keys;
};

/**
 * Clear all private messages
 */
export const clearAllPrivateMessages = () => {
  try {
    const keys = getAllPrivateMessageKeys();
    keys.forEach(key => localStorage.removeItem(key));
    console.log(`Cleared ${keys.length} private message conversations`);
  } catch (error) {
    console.error('Error clearing all private messages:', error);
  }
};

/**
 * Initialize message cleanup timer
 * Automatically clears public messages after 30 minutes
 * @param {Function} dispatchClearAction - Redux action dispatcher to clear messages from store
 */
export const initializeMessageCleanup = (dispatchClearAction = null) => {
  const checkAndCleanup = () => {
    try {
      const timestampStr = localStorage.getItem(MESSAGE_TIMESTAMP_KEY);
      if (!timestampStr) return;

      const timestamp = parseInt(timestampStr, 10);
      const now = Date.now();

      if (now - timestamp > PUBLIC_CHAT_TTL) {
        console.log('30 minutes elapsed, clearing public chat messages...');
        clearPublicMessages();
        
        // Also clear from Redux store if dispatch function provided
        if (dispatchClearAction && typeof dispatchClearAction === 'function') {
          dispatchClearAction();
          console.log('✅ Public messages cleared from Redux store');
        }
      }
    } catch (error) {
      console.error('Error in message cleanup:', error);
    }
  };

  // Check every 5 minutes
  const intervalId = setInterval(checkAndCleanup, 5 * 60 * 1000);

  // Initial check
  checkAndCleanup();

  return intervalId;
};
