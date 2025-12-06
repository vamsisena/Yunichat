import axiosClient from './axiosClient';

const chatApi = {
  // Get chat messages (paginated)
  getMessages: (chatId, page = 0, size = 50) => {
    return axiosClient.get(`/chat/${chatId}/messages`, {
      params: { page, size },
    });
  },

  // Get conversation between two users
  getConversation: (userId1, userId2) => {
    return axiosClient.get(`/chat/conversation`, {
      params: { userId1, userId2 },
    });
  },

  // Get user's conversations
  getConversations: (userId) => {
    return axiosClient.get(`/chat/conversations/${userId}`);
  },

  // Send message (REST API - fallback if WebSocket fails)
  sendMessage: (messageData) => {
    return axiosClient.post('/chat/send', messageData);
  },

  // Mark message as read
  markAsRead: (messageId) => {
    return axiosClient.put(`/chat/messages/${messageId}/read`);
  },

  // Mark all messages in a room as read
  markRoomMessagesAsRead: (roomId) => {
    return axiosClient.put(`/chat/messages/room/${roomId}/read`);
  },

  // Mark conversation as read
  markConversationAsRead: (conversationId) => {
    return axiosClient.patch(`/chat/conversations/${conversationId}/read`);
  },

  // Delete message
  deleteMessage: (messageId) => {
    return axiosClient.delete(`/chat/messages/${messageId}`);
  },

  // Get unread message count
  getUnreadCount: (userId) => {
    return axiosClient.get(`/chat/unread/${userId}`);
  },

  // Search messages
  searchMessages: (query, chatId) => {
    return axiosClient.get('/chat/search', {
      params: { query, chatId },
    });
  },

  // Create group chat
  createGroup: (groupData) => {
    return axiosClient.post('/chat/groups', groupData);
  },

  // Get group details
  getGroup: (groupId) => {
    return axiosClient.get(`/chat/groups/${groupId}`);
  },

  // Add member to group
  addGroupMember: (groupId, userId) => {
    return axiosClient.post(`/chat/groups/${groupId}/members`, { userId });
  },

  // Remove member from group
  removeGroupMember: (groupId, userId) => {
    return axiosClient.delete(`/chat/groups/${groupId}/members/${userId}`);
  },

  // Leave group
  leaveGroup: (groupId) => {
    return axiosClient.post(`/chat/groups/${groupId}/leave`);
  },

  // Get user's groups
  getUserGroups: (userId) => {
    return axiosClient.get(`/chat/groups/user/${userId}`);
  },

  // Get private messages with a specific user
  getPrivateMessages: (otherUserId, page = 0, size = 50) => {
    return axiosClient.get(`/chat/messages/private/${otherUserId}`, {
      params: { page, size },
    });
  },

  // Get room messages (public chat)
  getRoomMessages: (roomId, page = 0, size = 50) => {
    return axiosClient.get(`/chat/messages/room/${roomId}`, {
      params: { page, size },
    });
  },

  // Edit message
  editMessage: (messageId, content) => {
    return axiosClient.put(`/chat/messages/${messageId}/edit`, { content });
  },

  // Add reaction to message
  addMessageReaction: (messageId, emoji) => {
    return axiosClient.post(`/chat/messages/${messageId}/reactions`, { emoji });
  },

  // Remove reaction from message
  removeMessageReaction: (messageId, emoji) => {
    return axiosClient.delete(`/chat/messages/${messageId}/reactions/${encodeURIComponent(emoji)}`);
  },

  // Get message reactions
  getMessageReactions: (messageId) => {
    return axiosClient.get(`/chat/messages/${messageId}/reactions`);
  },

  // Get reaction summary for message
  getReactionSummary: (messageId) => {
    return axiosClient.get(`/chat/messages/${messageId}/reactions/summary`);
  },
};

export default chatApi;
