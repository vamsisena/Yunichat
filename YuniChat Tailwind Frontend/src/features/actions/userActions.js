import userApi from '../../api/userApi';
import {
  LOAD_USERS_REQUEST,
  LOAD_USERS_SUCCESS,
  LOAD_USERS_FAILURE,
  UPDATE_USER_STATUS,
  SEARCH_USERS_REQUEST,
  SEARCH_USERS_SUCCESS,
  SEARCH_USERS_FAILURE,
  CLEAR_SEARCH_RESULTS,
} from '../actionTypes/userTypes';

// Load all users
export const loadUsers = (page = 0, size = 20) => async (dispatch) => {
  dispatch({ type: LOAD_USERS_REQUEST });
  try {
    // Backend doesn't have /users endpoint, use search with empty query
    const response = await userApi.searchUsers('');
    const users = response.data.data;
    
    dispatch({
      type: LOAD_USERS_SUCCESS,
      payload: users,
    });
    
    return { success: true, data: users };
  } catch (error) {
    console.error('Error loading users:', error);
    dispatch({
      type: LOAD_USERS_FAILURE,
      payload: error.message || 'Failed to load users',
    });
    return { success: false, message: error.message };
  }
};

// Update user status (from WebSocket)
export const updateUserStatus = (userId, status) => ({
  type: UPDATE_USER_STATUS,
  payload: { userId, status },
});

// Update current user's status
export const updateMyStatus = (status) => async (dispatch, getState) => {
  try {
    console.log('\n==================== STATUS UPDATE STARTED ====================');
    console.log('🔄 [STATUS] User initiated status change to:', status);
    console.log('🔄 [STATUS] Timestamp:', new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }));
    
    const response = await userApi.updateStatus(status);
    console.log('✅ [STATUS] Backend API response:', response.data);
    
    if (response.data.success) {
      const state = getState();
      const { websocket, auth, users, chat } = state;
      const chatWsClient = websocket?.chatClient;
      const currentUserId = auth?.user?.id;
      const currentUsername = auth?.user?.username;
      
      console.log('👤 [STATUS] Current user:', { id: currentUserId, username: currentUsername });
      console.log('🔌 [STATUS] WebSocket status:', { 
        connected: chatWsClient?.connected, 
        active: chatWsClient?.active 
      });
      
      // Update local user status immediately in Redux users list
      dispatch(updateUserStatus(currentUserId, status));
      console.log('✅ [STATUS] Redux users list updated');
      
      // Update auth user object
      dispatch({ type: 'UPDATE_AUTH_USER_STATUS', payload: { status } });
      console.log('✅ [STATUS] Auth user object updated');
      
      // Update activeUsers array in chat state
      dispatch({ type: 'UPDATE_USER_STATUS_IN_ACTIVE', payload: { userId: currentUserId, status } });
      console.log('✅ [STATUS] ActiveUsers array updated');
      
      // Update localStorage
      const storedUser = JSON.parse(localStorage.getItem('yunichat_user') || '{}');
      storedUser.status = status;
      localStorage.setItem('yunichat_user', JSON.stringify(storedUser));
      console.log('✅ [STATUS] LocalStorage updated');
      
      // Broadcast status change via WebSocket for real-time updates to other users
      if (chatWsClient && chatWsClient.connected && chatWsClient.active) {
        try {
          const statusMessage = {
            userId: currentUserId,
            status: status,
          };
          console.log('📡 [STATUS] Broadcasting via WebSocket to /app/user.status:', statusMessage);
          chatWsClient.publish({
            destination: '/app/user.status',
            body: JSON.stringify(statusMessage),
          });
          console.log('✅ [STATUS] Broadcast message sent successfully');
        } catch (error) {
          console.error('❌ [STATUS] Failed to broadcast via WebSocket:', error.message);
          console.error('❌ [STATUS] WebSocket state:', { 
            connected: chatWsClient?.connected, 
            active: chatWsClient?.active 
          });
        }
      } else {
        console.warn('⚠️ [STATUS] WebSocket not ready for broadcast');
        console.warn('⚠️ [STATUS] State:', { 
          hasClient: !!chatWsClient, 
          connected: chatWsClient?.connected, 
          active: chatWsClient?.active 
        });
      }
      
      console.log('✅✅✅ [STATUS] Update completed successfully');
      console.log('==================== STATUS UPDATE FINISHED ====================\n');
      
      return { success: true };
    }
    
    console.error('❌ Status update failed:', response.data.message);
    return { success: false, message: response.data.message };
  } catch (error) {
    console.error('❌ Status update error:', error);
    return { success: false, message: error.message || 'Failed to update status' };
  }
};

// Search users
export const searchUsers = (query) => async (dispatch) => {
  dispatch({ type: SEARCH_USERS_REQUEST });
  try {
    const response = await userApi.searchUsers(query);
    const users = response.data.data;
    
    dispatch({
      type: SEARCH_USERS_SUCCESS,
      payload: users,
    });
    
    return { success: true, data: users };
  } catch (error) {
    dispatch({
      type: SEARCH_USERS_FAILURE,
      payload: error.message || 'Failed to search users',
    });
    return { success: false, message: error.message };
  }
};

// Clear search results
export const clearSearchResults = () => ({
  type: CLEAR_SEARCH_RESULTS,
});
