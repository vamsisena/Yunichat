import friendApi from '../../api/friendApi';
import {
  LOAD_FRIENDS_REQUEST,
  LOAD_FRIENDS_SUCCESS,
  LOAD_FRIENDS_FAILURE,
  SEND_FRIEND_REQUEST,
  ACCEPT_FRIEND_REQUEST,
  DECLINE_FRIEND_REQUEST,
  CANCEL_FRIEND_REQUEST,
  REMOVE_FRIEND,
  ADD_FRIEND_REQUEST,
  UPDATE_FRIEND_STATUS,
} from '../actionTypes/friendTypes';

// Load friends and requests
export const loadFriends = (silent = false) => async (dispatch, getState) => {
  // Don't load friends for guest users
  const { auth, friends: currentFriendsState } = getState();
  if (auth?.isGuest) {
    return { success: true, skipped: true };
  }
  
  dispatch({ type: LOAD_FRIENDS_REQUEST });
  try {
    const [friendsRes, requestsRes, sentRes] = await Promise.all([
      friendApi.getFriends(),
      friendApi.getPendingRequests(),
      friendApi.getSentRequests(),
    ]);
    
    const newFriends = friendsRes.data.data;
    const oldFriends = currentFriendsState?.friends || [];
    const wasLoaded = currentFriendsState?.loading === false && oldFriends.length >= 0;
    
    // Only show notification if this is not the initial load and friends list was previously loaded
    if (!silent && wasLoaded && oldFriends.length > 0) {
      // Detect new friends (someone accepted your friend request)
      const newFriendAdded = newFriends.find(
        newFriend => !oldFriends.some(oldFriend => oldFriend.id === newFriend.id)
      );
      
      if (newFriendAdded) {
        // Show notification that someone accepted your friend request
        const { addNotification } = await import('./notificationActions');
        const notification = {
          id: Date.now(),
          type: 'FRIEND_REQUEST_ACCEPTED',
          title: 'Friend Request Accepted',
          message: `${newFriendAdded.username} accepted your friend request`,
          read: false,
          createdAt: new Date().toISOString(),
        };
        dispatch(addNotification(notification));
      }
    }
    
    dispatch({
      type: LOAD_FRIENDS_SUCCESS,
      payload: {
        friends: newFriends,
        requests: requestsRes.data.data,
        sentRequests: sentRes.data.data,
      },
    });
    
    return { success: true };
  } catch (error) {
    dispatch({
      type: LOAD_FRIENDS_FAILURE,
      payload: error.message || 'Failed to load friends',
    });
    return { success: false, message: error.message };
  }
};

// Send friend request
export const sendFriendRequest = (recipientId) => async (dispatch, getState) => {
  // Don't allow friend requests for guest users
  const { auth } = getState();
  if (auth?.isGuest) {
    return { success: false, message: 'Guest users cannot send friend requests' };
  }
  
  try {
    const response = await friendApi.sendFriendRequest(recipientId);
    const request = response.data.data || response.data;
    
    dispatch({
      type: SEND_FRIEND_REQUEST,
      payload: request,
    });
    
    return { success: true, data: request };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message || 'Failed to send friend request' };
  }
};

// Add friend request (from WebSocket notification)
export const addFriendRequest = (request) => ({
  type: ADD_FRIEND_REQUEST,
  payload: request,
});

// Accept friend request
export const acceptFriendRequest = (requestId) => async (dispatch, getState) => {
  try {
    const response = await friendApi.acceptFriendRequest(requestId);
    const friend = response.data.data;
    
    dispatch({
      type: ACCEPT_FRIEND_REQUEST,
      payload: { requestId, friend },
    });
    
    // Reload friends list to get clean state from backend (handles simultaneous requests)
    await dispatch(loadFriends());
    
    // Clear any related notifications
    const { notifications } = getState();
    const relatedNotifications = notifications?.notifications?.notifications?.filter(
      n => n.type === 'FRIEND_REQUEST' && n.userId === friend.id
    ) || [];
    
    relatedNotifications.forEach(notification => {
      dispatch({ type: 'DELETE_NOTIFICATION', payload: notification.id });
    });
    
    return { success: true, data: friend };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message || 'Failed to accept friend request' };
  }
};

// Decline friend request
export const declineFriendRequest = (requestId) => async (dispatch) => {
  try {
    await friendApi.declineFriendRequest(requestId);
    
    dispatch({
      type: DECLINE_FRIEND_REQUEST,
      payload: requestId,
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Cancel friend request
export const cancelFriendRequest = (requestId) => async (dispatch) => {
  try {
    await friendApi.cancelFriendRequest(requestId);
    
    dispatch({
      type: CANCEL_FRIEND_REQUEST,
      payload: requestId,
    });
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.message };
  }
};

// Remove friend
export const removeFriend = (friendId) => async (dispatch) => {
  try {
    await friendApi.removeFriend(friendId);
    
    dispatch({
      type: REMOVE_FRIEND,
      payload: friendId,
    });
    
    // Reload friends list to ensure clean state
    await dispatch(loadFriends());
    
    return { success: true };
  } catch (error) {
    return { success: false, message: error.response?.data?.message || error.message || 'Failed to remove friend' };
  }
};

// Update friend status (from WebSocket)
export const updateFriendStatus = (friendId, status) => ({
  type: UPDATE_FRIEND_STATUS,
  payload: { friendId, status },
});

// Alias for loadFriends that also loads requests
export const loadFriendRequests = loadFriends;
