import authApi from '../../api/authApi';
import userApi from '../../api/userApi';
import { TOKEN_KEY, USER_KEY } from '../../utils/constants';
import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  GUEST_LOGIN_REQUEST,
  GUEST_LOGIN_SUCCESS,
  GUEST_LOGIN_FAILURE,
  LOGOUT,
  UPDATE_USER_PROFILE,
} from '../actionTypes/authTypes';

// Login action
export const login = (credentials) => async (dispatch) => {
  console.log('🔐 [authActions] login called with:', credentials);
  dispatch({ type: LOGIN_REQUEST });
  try {
    console.log('📡 [authActions] Calling authApi.login...');
    const response = await authApi.login(credentials);
    console.log('📡 [authActions] authApi.login response:', response);
    const { data } = response.data;
    
    // Save token first
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    
    // Fetch full user profile
    const profileResponse = await userApi.getCurrentUser();
    const profileData = profileResponse.data.data;
    
    // Create complete user object with all fields
    const user = {
      id: profileData.id,
      username: profileData.username,
      email: profileData.email,
      gender: profileData.gender,
      age: profileData.age,
      bio: profileData.bio,
      avatarUrl: profileData.avatarUrl,
      status: profileData.status,
      isGuest: false, // Registered users are NEVER guests
      isVerified: profileData.isVerified || false,
      lastSeen: profileData.lastSeen,
      createdAt: profileData.createdAt
    };
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    
    console.log('✅ [authActions] Login successful, user:', user);
    dispatch({
      type: LOGIN_SUCCESS,
      payload: user,
    });
    
    return { success: true, data };
  } catch (error) {
    console.error('❌ [authActions] Login failed:', error);
    dispatch({
      type: LOGIN_FAILURE,
      payload: error.message || 'Login failed',
    });
    return { success: false, message: error.message };
  }
};

// Register action
export const register = (userData) => async (dispatch) => {
  dispatch({ type: REGISTER_REQUEST });
  try {
    const response = await authApi.register(userData);
    
    dispatch({
      type: REGISTER_SUCCESS,
      payload: null,
    });
    
    return { success: true, message: response.data.message };
  } catch (error) {
    const errorMessage = error.message || error.data?.message || 'Registration failed';
    dispatch({
      type: REGISTER_FAILURE,
      payload: errorMessage,
    });
    return { success: false, message: errorMessage };
  }
};

// Guest login action
export const guestLogin = (guestData) => async (dispatch) => {
  dispatch({ type: GUEST_LOGIN_REQUEST });
  try {
    console.log('Attempting guest login with data:', guestData);
    const response = await authApi.guestLogin(guestData);
    console.log('Guest login API response:', response);
    const { data } = response.data;
    
    // Save token first
    console.log('Saving token:', data.accessToken?.substring(0, 20) + '...');
    localStorage.setItem(TOKEN_KEY, data.accessToken);
    
    // Fetch full user profile
    const profileResponse = await userApi.getCurrentUser();
    const profileData = profileResponse.data.data;
    
    // Create complete user object with all fields
    const user = {
      id: profileData.id,
      username: profileData.username,
      email: profileData.email,
      gender: profileData.gender,
      age: profileData.age,
      bio: profileData.bio,
      avatarUrl: profileData.avatarUrl,
      status: profileData.status || 'ONLINE',
      isGuest: true,
      isVerified: profileData.isVerified || false,
      lastSeen: profileData.lastSeen,
      createdAt: profileData.createdAt
    };
    
    console.log('Created complete user object:', user);
    
    // Save user
    localStorage.setItem(USER_KEY, JSON.stringify(user));
    // Set last activity to prevent immediate logout
    localStorage.setItem('lastActivity', Date.now().toString());
    
    console.log('Token, user, and lastActivity saved to localStorage');
    
    dispatch({
      type: GUEST_LOGIN_SUCCESS,
      payload: user,
    });
    
    console.log('GUEST_LOGIN_SUCCESS dispatched');
    
    return { success: true, data };
  } catch (error) {
    console.error('Guest login error:', error);
    const errorMessage = error.response?.data?.message || error.message || 'Guest login failed';
    dispatch({
      type: GUEST_LOGIN_FAILURE,
      payload: errorMessage,
    });
    return { success: false, message: errorMessage };
  }
};

// Logout action
export const logout = () => async (dispatch) => {
  try {
    console.log('🚪 Logging out user...');
    const userStr = localStorage.getItem(USER_KEY);
    if (userStr) {
      const user = JSON.parse(userStr);
      console.log('🚪 User being logged out:', { id: user.id, username: user.username, isGuest: user.isGuest });
    }
    const response = await authApi.logout();
    console.log('✅ Logout API response:', response);
  } catch (error) {
    console.error('❌ Logout API error:', error);
    console.error('❌ Error details:', error.response || error.message);
  } finally {
    // Clear local storage and session storage
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    sessionStorage.clear(); // Clear all session flags including publicChatJoined
    
    dispatch({ type: LOGOUT });
    console.log('🧹 Local storage cleared, user logged out');
  }
};

// Update user profile
export const updateUserProfile = (profileData) => (dispatch) => {
  dispatch({
    type: UPDATE_USER_PROFILE,
    payload: profileData,
  });
  
  // Update local storage
  const user = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
  const updatedUser = { ...user, ...profileData };
  localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
};
