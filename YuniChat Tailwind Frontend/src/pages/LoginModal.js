import React, { useState, useEffect } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { login } from '../features/actions/authActions';
import { validatePassword } from '../utils/validators';
import useAuth from '../hooks/useAuth';

const LoginModal = ({ open, onClose, onSwitchToRegister }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [shouldNavigate, setShouldNavigate] = useState(false);

  // Navigate to chat after successful authentication
  useEffect(() => {
    if (isAuthenticated && shouldNavigate) {
      handleClose();
      navigate('/chat');
      setShouldNavigate(false);
    }
  }, [isAuthenticated, shouldNavigate, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
    setErrorMessage('');
  };

  const validate = () => {
    const newErrors = {};
    
    if (!formData.usernameOrEmail || formData.usernameOrEmail.trim().length < 3) {
      newErrors.usernameOrEmail = 'Username or email is required (min 3 characters)';
    }
    
    if (!validatePassword(formData.password)) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('🔐 Login form submitted');
    console.log('Form data:', formData);
    
    if (!validate()) {
      console.log('❌ Validation failed');
      return;
    }
    
    console.log('✅ Validation passed, attempting login...');
    setLoading(true);
    setErrorMessage('');
    
    try {
      console.log('📡 Dispatching login action');
      const result = await dispatch(login(formData));
      console.log('📡 Login result:', result);
      
      setLoading(false);
    
      if (result.success) {
        console.log('✅ Login successful, waiting for Redux state update');
        // Set flag to trigger navigation in useEffect after Redux state updates
        setShouldNavigate(true);
      } else {
        console.log('❌ Login failed:', result.message);
        const backendMessage = result.message || '';
      
        if (backendMessage.toLowerCase().includes('invalid credentials') || 
            backendMessage.toLowerCase().includes('unauthorized')) {
          const usernameValue = formData.usernameOrEmail.trim();
          const passwordValue = formData.password;
          
          if (usernameValue.length < 3) {
            setErrorMessage('Please enter valid username');
          } else if (passwordValue.length < 6) {
            setErrorMessage('Please enter a valid password');
          } else {
            setErrorMessage('Invalid username/password');
          }
        } else if (backendMessage.toLowerCase().includes('verify your email')) {
          setErrorMessage('Please verify your email first. Check your inbox for OTP.');
        } else {
          setErrorMessage(backendMessage || 'Login failed. Please try again.');
        }
      }
    } catch (error) {
      console.error('💥 Exception during login:', error);
      setLoading(false);
      setErrorMessage('Network error. Please check your connection.');
    }
  };

  const handleClose = () => {
    setFormData({ usernameOrEmail: '', password: '' });
    setErrors({});
    setErrorMessage('');
    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <XMarkIcon className="h-6 w-6 text-gray-500 dark:text-gray-400" />
        </button>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Login to YuniChat</h2>

        {errorMessage && (
          <div className="mb-4 p-3 bg-red-100 dark:bg-red-900/30 border border-red-400 dark:border-red-800 text-red-700 dark:text-red-400 rounded-lg text-sm">
            {errorMessage}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Username or Email
            </label>
            <input
              type="text"
              name="usernameOrEmail"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              autoFocus
              disabled={loading}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck="false"
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.usernameOrEmail ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter username or email"
            />
            {errors.usernameOrEmail && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.usernameOrEmail}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              disabled={loading}
              className={`w-full px-4 py-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent ${
                errors.password ? 'border-red-500' : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.password}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
          >
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : 'Login'}
          </button>
        </form>

        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Don't have an account?{' '}
            <button
              onClick={onSwitchToRegister}
              disabled={loading}
              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
            >
              Register here
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginModal;
