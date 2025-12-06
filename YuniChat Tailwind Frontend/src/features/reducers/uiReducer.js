import {
  TOGGLE_SIDEBAR,
  SET_MOBILE_VIEW,
  SHOW_SNACKBAR,
  HIDE_SNACKBAR,
  SET_LOADING,
} from '../actionTypes/uiTypes';

const initialState = {
  sidebarOpen: true,
  isMobile: window.innerWidth < 960,
  snackbar: {
    open: false,
    message: '',
    severity: 'info', // 'success', 'error', 'warning', 'info'
  },
  loading: false,
};

export default function uiReducer(state = initialState, action) {
  switch (action.type) {
    case TOGGLE_SIDEBAR:
      return {
        ...state,
        sidebarOpen: !state.sidebarOpen,
      };

    case SET_MOBILE_VIEW:
      return {
        ...state,
        isMobile: action.payload,
        sidebarOpen: !action.payload,
      };

    case SHOW_SNACKBAR:
      return {
        ...state,
        snackbar: {
          open: true,
          message: action.payload.message,
          severity: action.payload.severity || 'info',
        },
      };

    case HIDE_SNACKBAR:
      return {
        ...state,
        snackbar: {
          ...state.snackbar,
          open: false,
        },
      };

    case SET_LOADING:
      return {
        ...state,
        loading: action.payload,
      };

    default:
      return state;
  }
}
