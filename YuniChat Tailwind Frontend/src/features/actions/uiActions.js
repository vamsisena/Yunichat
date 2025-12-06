import {
  TOGGLE_SIDEBAR,
  SET_MOBILE_VIEW,
  SHOW_SNACKBAR,
  HIDE_SNACKBAR,
  SET_LOADING,
} from '../actionTypes/uiTypes';

// Toggle sidebar
export const toggleSidebar = () => ({
  type: TOGGLE_SIDEBAR,
});

// Set mobile view
export const setMobileView = (isMobile) => ({
  type: SET_MOBILE_VIEW,
  payload: isMobile,
});

// Show snackbar
export const showSnackbar = (message, severity = 'info') => ({
  type: SHOW_SNACKBAR,
  payload: { message, severity },
});

// Hide snackbar
export const hideSnackbar = () => ({
  type: HIDE_SNACKBAR,
});

// Set loading
export const setLoading = (loading) => ({
  type: SET_LOADING,
  payload: loading,
});
