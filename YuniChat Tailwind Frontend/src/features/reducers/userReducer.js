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

const initialState = {
  loading: false,
  error: null,
  users: [],
  searchResults: [],
  searching: false,
};

export default function usersReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_USERS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case LOAD_USERS_SUCCESS:
      return {
        ...state,
        loading: false,
        users: action.payload,
      };

    case LOAD_USERS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case UPDATE_USER_STATUS:
      return {
        ...state,
        users: state.users.map((u) =>
          u.id === action.payload.userId
            ? { ...u, status: action.payload.status }
            : u
        ),
      };

    case SEARCH_USERS_REQUEST:
      return {
        ...state,
        searching: true,
        error: null,
      };

    case SEARCH_USERS_SUCCESS:
      return {
        ...state,
        searching: false,
        searchResults: action.payload,
      };

    case SEARCH_USERS_FAILURE:
      return {
        ...state,
        searching: false,
        error: action.payload,
      };

    case CLEAR_SEARCH_RESULTS:
      return {
        ...state,
        searchResults: [],
      };

    default:
      return state;
  }
}
