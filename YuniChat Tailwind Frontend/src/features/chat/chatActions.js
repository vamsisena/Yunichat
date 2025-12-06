import chatApi from '../../api/chatApi';
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
  OPEN_CHAT_POPUP,
  CLOSE_CHAT_POPUP,
  MARK_MESSAGES_AS_READ,
} from './chatTypes';

// Set active chat
export const setActiveChat = (chatId, chatType) => ({
  type: SET_ACTIVE_CHAT,
  payload: { chatId, chatType },
});

// Clear active chat
export const clearActiveChat = () => ({
  type: CLEAR_ACTIVE_CHAT,
});

// Load messages
export const loadMessages = (chatId, page = 0, size = 50) => async (dispatch) => {
  dispatch({ type: LOAD_MESSAGES_REQUEST });
  try {
    const response = await chatApi.getMessages(chatId, page, size);
    const messages = response.data.data;
    
    dispatch({
      type: LOAD_MESSAGES_SUCCESS,
      payload: messages,
    });
    
    return { success: true, data: messages };
  } catch (error) {
    dispatch({
      type: LOAD_MESSAGES_FAILURE,
      payload: error.message || 'Failed to load messages',
    });
    return { success: false, message: error.message };
  }
};

// Load conversations
export const loadConversations = (userId) => async (dispatch) => {
  dispatch({ type: LOAD_CONVERSATIONS_REQUEST });
  try {
    const response = await chatApi.getConversations(userId);
    const conversations = response.data.data;
    
    dispatch({
      type: LOAD_CONVERSATIONS_SUCCESS,
      payload: conversations,
    });
    
    return { success: true, data: conversations };
  } catch (error) {
    dispatch({
      type: LOAD_CONVERSATIONS_FAILURE,
      payload: error.message || 'Failed to load conversations',
    });
    return { success: false, message: error.message };
  }
};

// Add message (from WebSocket or REST)
export const addMessage = (message) => ({
  type: ADD_MESSAGE,
  payload: message,
});

// Update message
export const updateMessage = (message) => ({
  type: UPDATE_MESSAGE,
  payload: message,
});

// Update message status
export const updateMessageStatus = (messageId, status) => ({
  type: UPDATE_MESSAGE_STATUS,
  payload: { id: messageId, status },
});

// Delete message
export const deleteMessage = (messageId) => ({
  type: DELETE_MESSAGE,
  payload: messageId,
});

// Set typing status
export const setTypingStatus = (userId, isTyping) => ({
  type: SET_TYPING_STATUS,
  payload: { userId, isTyping },
});

// Clear typing status
export const clearTypingStatus = () => ({
  type: CLEAR_TYPING_STATUS,
});

// Update conversation
export const updateConversation = (conversation) => ({
  type: UPDATE_CONVERSATION,
  payload: conversation,
});

// Clear private messages for a specific user
export const clearPrivateMessages = (userId) => ({
  type: 'CLEAR_PRIVATE_MESSAGES',
  payload: userId,
});

// Set active chat window (single window for all conversations)
export const setActiveChatWindow = (userId) => ({
  type: 'SET_ACTIVE_CHAT_WINDOW',
  payload: userId,
});

// Toggle minimize state of chat window
export const toggleChatMinimized = (minimized) => ({
  type: 'TOGGLE_CHAT_MINIMIZED',
  payload: minimized,
});

// Mark messages as read for a specific user (for badge clearing with delay)
export const markMessagesAsRead = (userId) => ({
  type: MARK_MESSAGES_AS_READ,
  payload: userId,
});
