import axiosClient from './axiosClient';

const userApi = {
  // Get user by ID
  getUserById: (userId) => {
    return axiosClient.get(`/users/profile/${userId}`);
  },

  // Get current user profile
  getCurrentUser: () => {
    return axiosClient.get('/users/profile');
  },

  // Get user by username
  getUserByUsername: (username) => {
    return axiosClient.get(`/users/username/${username}`);
  },

  // Search users
  searchUsers: (query) => {
    return axiosClient.get('/users/search', {
      params: { query },
    });
  },

  // Get all users (paginated)
  getAllUsers: (page = 0, size = 20) => {
    return axiosClient.get('/users', {
      params: { page, size },
    });
  },

  // Update user profile
  updateProfile: (profileData) => {
    return axiosClient.put('/users/profile', profileData);
  },

  // Update user status
  updateStatus: (status) => {
    // Backend expects lowercase status values
    return axiosClient.put('/users/presence', { status: status.toLowerCase() });
  },

  // Delete user account
  deleteAccount: (userId) => {
    return axiosClient.delete(`/users/${userId}`);
  },

  // Get online users
  getOnlineUsers: () => {
    return axiosClient.get('/users/online');
  },

  // Block user
  blockUser: (userId) => {
    return axiosClient.post(`/users/block/${userId}`);
  },

  // Unblock user
  unblockUser: (userId) => {
    return axiosClient.delete(`/users/block/${userId}`);
  },

  // Get blocked users
  getBlockedUsers: () => {
    return axiosClient.get('/users/blocked');
  },

  // Ignore user
  ignoreUser: (userId) => {
    return axiosClient.post('/users/ignore', { ignoredUserId: userId });
  },

  // Unignore user
  unignoreUser: (userId) => {
    return axiosClient.delete(`/users/ignore/${userId}`);
  },

  // Get ignored users
  getIgnoredUsers: () => {
    return axiosClient.get('/users/ignored');
  },

  // Check ignore status
  checkIgnoreStatus: (targetUserId) => {
    return axiosClient.get(`/users/ignore/status/${targetUserId}`);
  },

  // Get private messages with a user (delegates to chat service)
  getPrivateMessages: (otherUserId, page = 0, size = 50) => {
    return axiosClient.get(`/chat/private/${otherUserId}`, {
      params: { page, size },
    });
  },
};

export default userApi;
