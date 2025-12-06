import axiosClient from './axiosClient';

const authApi = {
  // Register new user
  register: (userData) => {
    return axiosClient.post('/auth/register', userData);
  },

  // Login with username and password
  login: (credentials) => {
    console.log('📡 [authApi] Calling POST /auth/login with:', credentials);
    return axiosClient.post('/auth/login', credentials);
  },

  // Guest login
  guestLogin: (guestData) => {
    return axiosClient.post('/auth/guest-login', guestData);
  },

  // Logout
  logout: () => {
    return axiosClient.post('/auth/logout');
  },

  // Refresh token
  refreshToken: (refreshToken) => {
    return axiosClient.post('/auth/refresh-token', { refreshToken });
  },

  // Verify token
  verifyToken: () => {
    return axiosClient.get('/auth/verify');
  },

  // Change password
  changePassword: (passwordData) => {
    return axiosClient.post('/auth/change-password', passwordData);
  },

  // Verify OTP
  verifyOtp: (otpData) => {
    return axiosClient.post('/auth/verify-otp', otpData);
  },

  // Resend OTP
  resendOtp: (emailData) => {
    return axiosClient.post('/auth/resend-otp', emailData);
  },

  // Forgot Password - Request OTP for password reset
  forgotPassword: (emailData) => {
    return axiosClient.post('/auth/forgot-password', emailData);
  },

  // Reset Password - Reset password with OTP
  resetPassword: (resetData) => {
    return axiosClient.post('/auth/reset-password', resetData);
  },

  // Update status
  updateStatus: (status) => {
    return axiosClient.post('/auth/update-status', { status });
  },
};

export default authApi;
