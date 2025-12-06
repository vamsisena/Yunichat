import {
  SET_ACTIVE_CHAT,
  CLEAR_ACTIVE_CHAT,
  LOAD_MESSAGES_REQUEST,
  LOAD_MESSAGES_SUCCESS,
  LOAD_MESSAGES_FAILURE,
  ADD_MESSAGE,
  UPDATE_MESSAGE,
  UPDATE_MESSAGE_STATUS,
  DELETE_MESSAGE,
  SET_TYPING_STATUS,
  CLEAR_TYPING_STATUS,
  LOAD_CONVERSATIONS_REQUEST,
  LOAD_CONVERSATIONS_SUCCESS,
  LOAD_CONVERSATIONS_FAILURE,
  UPDATE_CONVERSATION,
  SET_ACTIVE_USERS,
  UPDATE_ACTIVE_USERS,
  MARK_MESSAGES_AS_READ,
  CLEAR_PUBLIC_MESSAGES,
} from '../actionTypes/chatTypes';
import { 
  loadPublicMessages, 
  savePublicMessages, 
  loadPrivateMessages, 
  savePrivateMessages 
} from '../../utils/messageStorage';

// Load initial messages from localStorage
const loadInitialMessages = () => {
  const publicMessages = loadPublicMessages();
  const messages = {};
  
  if (publicMessages && publicMessages.length > 0) {
    messages.public = publicMessages;
  }
  
  return messages;
};

const initialState = {
  activeChatId: null,
  activeChatType: null, // 'public', 'private', 'group'
  activeChatUserId: null, // For single chat window - which user conversation is active
  chatMinimized: false, // Track if chat window is minimized
  loadingMessages: false,
  messages: loadInitialMessages(), // Load messages from localStorage
  privateMessages: {}, // Store private messages by userId
  conversations: [],
  loadingConversations: false,
  typingStatus: {}, // { userId: true/false }
  typingIndicators: {}, // { userId: { username, isTyping } } - for private chat typing
  activeUsers: [], // Real-time list of currently connected users from WebSocket
  unreadMessageCount: 0, // Total unread private messages count
  error: null,
};

export default function chatReducer(state = initialState, action) {
  switch (action.type) {
    case SET_ACTIVE_CHAT:
      return {
        ...state,
        activeChatId: action.payload.chatId,
        activeChatType: action.payload.chatType,
      };

    case CLEAR_ACTIVE_CHAT:
      return {
        ...state,
        activeChatId: null,
        activeChatType: null,
        typingStatus: {},
      };

    case LOAD_MESSAGES_REQUEST:
      return {
        ...state,
        loadingMessages: true,
        error: null,
      };

    case LOAD_MESSAGES_SUCCESS:
      return {
        ...state,
        loadingMessages: false,
        messages: {
          ...state.messages,
          [action.payload.chatId || 'public']: action.payload.messages || action.payload,
        },
      };

    case LOAD_MESSAGES_FAILURE:
      return {
        ...state,
        loadingMessages: false,
        error: action.payload,
      };

    case ADD_MESSAGE:
      const msg = action.payload;
      // Use chatKey if provided, otherwise determine from message
      const chatKey = msg.chatKey || msg.recipientId || msg.senderId || 'public';
      const currentMessages = state.messages[chatKey] || [];
      
      // Prevent duplicate messages - check if message already exists
      const isDuplicate = currentMessages.some(m => 
        (m.id && msg.id && m.id === msg.id && typeof m.id !== 'number') // Only check ID duplicates if ID is not a timestamp
      );
      
      console.log('🔍 ADD_MESSAGE check:', { 
        chatKey, 
        msgId: msg.id, 
        isDuplicate, 
        currentCount: currentMessages.length,
        newMsg: msg 
      });
      
      if (isDuplicate) {
        console.log('⚠️ Duplicate message detected, skipping');
        return state; // Don't add duplicate
      }
      const newMessages = [...currentMessages, msg];
      
      // Save to localStorage
      if (chatKey === 'public') {
        savePublicMessages(newMessages);
      } else {
        // Handle private messages
        const userId = chatKey;
        const currentPrivateMessages = state.privateMessages[userId] || [];
        
        // Check for duplicates in private messages too
        const isPrivateDuplicate = currentPrivateMessages.some(m =>
          (m.id && msg.id && m.id === msg.id)
        );
        
        if (isPrivateDuplicate) {
          return state;
        }
        
        const newPrivateMessages = [...currentPrivateMessages, msg]; // Keep msg.read as set by MainLayout
        savePrivateMessages(userId, newPrivateMessages);
        
        // Calculate total unread count
        const updatedPrivateMessages = {
          ...state.privateMessages,
          [userId]: newPrivateMessages,
        };
        
        // Only count messages WHERE I am the recipient (not the sender)
        const currentUserId = msg.recipientId; // The user who should see this message
        const totalUnread = Object.entries(updatedPrivateMessages).reduce((total, [chatUserId, messages]) => {
          // Count unread messages where current user is NOT the sender
          const unreadForThisChat = messages.filter(m => !m.read && m.senderId !== currentUserId && m.senderId === parseInt(chatUserId)).length;
          return total + unreadForThisChat;
        }, 0);
        
        return {
          ...state,
          messages: {
            ...state.messages,
            [chatKey]: newMessages,
          },
          privateMessages: updatedPrivateMessages,
          unreadMessageCount: totalUnread,
        };
      }
      
      console.log('✅ Adding message to state:', { 
        chatKey, 
        newMessagesCount: newMessages.length,
        messageId: msg.id,
        content: msg.content?.substring(0, 50)
      });
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [chatKey]: newMessages,
        },
      };

    case UPDATE_MESSAGE:
      const updatedMsg = action.payload;
      // Use chatKey if provided (for WebSocket updates), otherwise fall back to recipientId/senderId
      const updateChatKey = updatedMsg.chatKey || updatedMsg.recipientId || updatedMsg.senderId || 'public';
      const messagesForUpdate = state.messages[updateChatKey] || [];
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [updateChatKey]: messagesForUpdate.map((msg) =>
            msg.id === updatedMsg.id ? { ...msg, ...updatedMsg } : msg
          ),
        },
      };

    case UPDATE_MESSAGE_STATUS:
      let updatedMessages = { ...state.messages };
      Object.keys(updatedMessages).forEach(key => {
        updatedMessages[key] = updatedMessages[key].map(msg =>
          msg.id === action.payload.messageId
            ? { 
                ...msg, 
                isRead: action.payload.isRead,
                readAt: action.payload.readAt 
              }
            : msg
        );
      });
      
      return {
        ...state,
        messages: updatedMessages,
      };

    case DELETE_MESSAGE:
      let filteredMessages = { ...state.messages };
      Object.keys(filteredMessages).forEach(key => {
        filteredMessages[key] = filteredMessages[key].filter(
          (msg) => msg.id !== action.payload
        );
      });
      
      return {
        ...state,
        messages: filteredMessages,
      };

    case SET_TYPING_STATUS:
      return {
        ...state,
        typingStatus: {
          ...state.typingStatus,
          [action.payload.userId]: action.payload.isTyping,
        },
      };

    case CLEAR_TYPING_STATUS:
      return {
        ...state,
        typingStatus: {},
      };

    case LOAD_CONVERSATIONS_REQUEST:
      return {
        ...state,
        loadingConversations: true,
        error: null,
      };

    case LOAD_CONVERSATIONS_SUCCESS:
      return {
        ...state,
        loadingConversations: false,
        conversations: action.payload,
      };

    case LOAD_CONVERSATIONS_FAILURE:
      return {
        ...state,
        loadingConversations: false,
        error: action.payload,
      };

    case UPDATE_CONVERSATION:
      return {
        ...state,
        conversations: state.conversations.map((conv) =>
          conv.id === action.payload.id ? { ...conv, ...action.payload } : conv
        ),
      };



    case 'CLEAR_PRIVATE_MESSAGES':
      const { [action.payload]: removed, ...remainingMessages } = state.privateMessages;
      
      // Recalculate unread count after clearing
      const unreadAfterClear = Object.values(remainingMessages).reduce((total, messages) => {
        return total + messages.filter(m => !m.read).length;
      }, 0);
      
      return {
        ...state,
        privateMessages: remainingMessages,
        unreadMessageCount: unreadAfterClear,
      };

    case 'SET_ACTIVE_CHAT_WINDOW':
      // Just open the chat window, don't mark messages as read yet (that happens with delay)
      return {
        ...state,
        activeChatUserId: action.payload,
        chatMinimized: action.payload ? false : state.chatMinimized, // Reset minimized when opening chat
      };

    case MARK_MESSAGES_AS_READ:
      // Mark messages as read for the specified user and recalculate unread count
      if (action.payload) {
        const userId = action.payload;
        const userMessages = state.privateMessages[userId] || [];
        const updatedUserMessages = userMessages.map(msg => ({ ...msg, read: true, isRead: true }));
        const updatedPrivateMsgs = {
          ...state.privateMessages,
          [userId]: updatedUserMessages,
        };
        
        // Recalculate unread count
        const newUnreadCount = Object.values(updatedPrivateMsgs).reduce((total, messages) => {
          return total + messages.filter(m => !m.read && !m.isRead).length;
        }, 0);
        
        return {
          ...state,
          privateMessages: updatedPrivateMsgs,
          unreadMessageCount: newUnreadCount,
        };
      }
      return state;

    case 'UPDATE_PRIVATE_MESSAGE_STATUS':
      // Update read status for a specific message in privateMessages
      const { messageId, isRead, readAt } = action.payload;
      let updatedPrivateMessages = { ...state.privateMessages };
      let messageUpdated = false;

      // Find and update the message across all conversations
      Object.keys(updatedPrivateMessages).forEach(userId => {
        updatedPrivateMessages[userId] = updatedPrivateMessages[userId].map(msg => {
          if (msg.id === messageId) {
            messageUpdated = true;
            return { ...msg, isRead, read: isRead, readAt };
          }
          return msg;
        });
      });

      if (!messageUpdated) return state;

      // Recalculate unread count
      const unreadCountAfterUpdate = Object.values(updatedPrivateMessages).reduce((total, messages) => {
        return total + messages.filter(m => !m.read && !m.isRead).length;
      }, 0);

      return {
        ...state,
        privateMessages: updatedPrivateMessages,
        unreadMessageCount: unreadCountAfterUpdate,
      };

    case SET_ACTIVE_USERS:
      return {
        ...state,
        activeUsers: action.payload || [],
      };

    case 'UPDATE_ACTIVE_USERS':
      const newActiveUsers = (action.payload || []).map(u => ({ ...u, _updated: Date.now() }));
      return {
        ...state,
        activeUsers: newActiveUsers,
        _lastUpdate: Date.now(), // Force re-render trigger
      };

    case 'CLEAR_OLD_PUBLIC_MESSAGES':
      return {
        ...state,
        messages: {
          ...state.messages,
          public: action.payload || [],
        },
      };

    case 'UPDATE_USER_STATUS_IN_ACTIVE':
      // Update status for a specific user in activeUsers array
      const updatedUsers = state.activeUsers.map(user => 
        user.id === action.payload.userId 
          ? { ...user, status: action.payload.status, _updated: Date.now() }
          : user
      );
      return {
        ...state,
        activeUsers: [...updatedUsers], // Create new array reference
        _lastUpdate: Date.now(), // Force re-render trigger
      };

    case 'REMOVE_USER_FROM_ACTIVE':
      // Remove a specific user from activeUsers array (on disconnect)
      console.log('🗑️ Redux: REMOVE_USER_FROM_ACTIVE', action.payload);
      const filteredActiveUsers = state.activeUsers.filter(user => user.id !== action.payload);
      console.log('✅ Redux: User removed from activeUsers, remaining:', filteredActiveUsers.length);
      return {
        ...state,
        activeUsers: filteredActiveUsers,
        _lastUpdate: Date.now(),
      };

    case 'TOGGLE_CHAT_MINIMIZED':
      return {
        ...state,
        chatMinimized: action.payload,
      };

    case CLEAR_PUBLIC_MESSAGES:
      // Clear public messages from Redux store when TTL expires
      const { public: removedPublic, ...restMessages } = state.messages;
      return {
        ...state,
        messages: restMessages,
      };

    case 'SET_TYPING_INDICATOR':
      // Set typing indicator for a specific user
      const { userId: typingUserId, username, isTyping } = action.payload;
      return {
        ...state,
        typingIndicators: {
          ...state.typingIndicators,
          [typingUserId]: { username, isTyping, timestamp: Date.now() }
        }
      };

    default:
      return state;
  }
}
