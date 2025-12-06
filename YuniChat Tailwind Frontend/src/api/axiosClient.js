import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY } from '../utils/constants';

// Create axios instance
const axiosClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor - add token and user ID to requests
axiosClient.interceptors.request.use(
  (config) => {
    console.log('📤 [axiosClient] Request:', config.method?.toUpperCase(), config.url);
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    // Add user ID header for endpoints that need it (like logout)
    const userStr = localStorage.getItem('yunichat_user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.id) {
          config.headers['X-User-Id'] = user.id;
        }
      } catch (e) {
        console.error('Failed to parse user from localStorage:', e);
      }
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle errors
axiosClient.interceptors.response.use(
  (response) => {
    console.log('📥 [axiosClient] Response:', response.status, response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ [axiosClient] Error:', error);
    if (error.response) {
      // Handle 401 Unauthorized - but NOT for login/register endpoints
      if (error.response.status === 401) {
        const isAuthEndpoint = error.config?.url?.includes('/auth/login') || 
                              error.config?.url?.includes('/auth/register') ||
                              error.config?.url?.includes('/auth/guest-login');
        
        // Only redirect to home if it's NOT an auth endpoint (meaning token expired on protected route)
        if (!isAuthEndpoint) {
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem('yunichat_user');
          window.location.href = '/';
        }
      }
      
      // Return error response
      return Promise.reject(error.response.data);
    } else if (error.request) {
      // Network error
      return Promise.reject({
        success: false,
        message: 'Network error. Please check your connection.',
      });
    } else {
      return Promise.reject({
        success: false,
        message: error.message || 'An error occurred',
      });
    }
  }
);

export default axiosClient;
