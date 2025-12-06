import {
  LOGIN_REQUEST,
  LOGIN_SUCCESS,
  LOGIN_FAILURE,
  LOGOUT,
  REGISTER_REQUEST,
  REGISTER_SUCCESS,
  REGISTER_FAILURE,
  GUEST_LOGIN_REQUEST,
  GUEST_LOGIN_SUCCESS,
  GUEST_LOGIN_FAILURE,
  UPDATE_USER_PROFILE,
} from '../actionTypes/authTypes';

const initialState = {
  loading: false,
  error: null,
  user: null,
  isAuthenticated: false,
  isGuest: false,
};

export default function authReducer(state = initialState, action) {
  switch (action.type) {
    case LOGIN_REQUEST:
    case REGISTER_REQUEST:
    case GUEST_LOGIN_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case LOGIN_SUCCESS:
      return {
        ...state,
        loading: false,
        user: action.payload,
        isAuthenticated: true,
        isGuest: false,
      };

    case REGISTER_SUCCESS:
      // Registration complete - do NOT authenticate user yet
      // User must verify email first, then login
      return {
        ...state,
        loading: false,
        error: null,
      };

    case GUEST_LOGIN_SUCCESS:
      // Clear any cached data on fresh login
      console.log('🔄 authReducer: Clearing cached data on login');
      return {
        ...state,
        loading: false,
        user: action.payload,
        isAuthenticated: true,
        isGuest: true,
      };

    case LOGIN_FAILURE:
    case REGISTER_FAILURE:
    case GUEST_LOGIN_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case UPDATE_USER_PROFILE:
      return {
        ...state,
        user: {
          ...state.user,
          ...action.payload,
        },
      };

    case 'UPDATE_AUTH_USER_STATUS':
      return {
        ...state,
        user: {
          ...state.user,
          status: action.payload.status,
        },
      };

    case LOGOUT:
      return {
        ...initialState,
      };

    default:
      return state;
  }
}
