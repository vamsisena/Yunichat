import axiosClient from './axiosClient';

const friendApi = {
  // Send friend request
  sendFriendRequest: (recipientId) => {
    return axiosClient.post('/users/friends/request', { recipientId });
  },

  // Accept friend request
  acceptFriendRequest: (requestId) => {
    return axiosClient.post(`/users/friends/accept/${requestId}`);
  },

  // Decline friend request
  declineFriendRequest: (requestId) => {
    return axiosClient.post(`/users/friends/decline/${requestId}`);
  },

  // Cancel sent friend request
  cancelFriendRequest: (requestId) => {
    return axiosClient.delete(`/users/friends/request/${requestId}`);
  },

  // Get friend list
  getFriends: () => {
    return axiosClient.get('/users/friends');
  },

  // Get pending friend requests (received)
  getPendingRequests: () => {
    return axiosClient.get('/users/friends/requests/pending');
  },

  // Get sent friend requests
  getSentRequests: () => {
    return axiosClient.get('/users/friends/requests/sent');
  },

  // Remove friend
  removeFriend: (friendId) => {
    return axiosClient.delete(`/users/friends/${friendId}`);
  },

  // Check friendship status
  getFriendshipStatus: (userId) => {
    return axiosClient.get(`/users/friends/status/${userId}`);
  },
};

export default friendApi;
