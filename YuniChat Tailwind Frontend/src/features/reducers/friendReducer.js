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

const initialState = {
  loading: false,
  error: null,
  friends: [],
  requests: [],
  sentRequests: [],
};

export default function friendsReducer(state = initialState, action) {
  switch (action.type) {
    case LOAD_FRIENDS_REQUEST:
      return {
        ...state,
        loading: true,
        error: null,
      };

    case LOAD_FRIENDS_SUCCESS:
      return {
        ...state,
        loading: false,
        friends: action.payload.friends,
        requests: action.payload.requests,
        sentRequests: action.payload.sentRequests || [],
      };

    case LOAD_FRIENDS_FAILURE:
      return {
        ...state,
        loading: false,
        error: action.payload,
      };

    case SEND_FRIEND_REQUEST:
      return {
        ...state,
        sentRequests: [...state.sentRequests, action.payload],
      };

    case ADD_FRIEND_REQUEST:
      return {
        ...state,
        requests: [...state.requests, action.payload],
      };

    case ACCEPT_FRIEND_REQUEST:
      // When accepting a request, remove it from requests AND remove any reverse sent request
      const acceptedFriendId = action.payload.friend.id;
      return {
        ...state,
        friends: [...state.friends, action.payload.friend],
        requests: state.requests.filter(
          (req) => req.id !== action.payload.requestId
        ),
        sentRequests: state.sentRequests.filter(
          (req) => req.recipientId !== acceptedFriendId
        ),
      };

    case DECLINE_FRIEND_REQUEST:
      return {
        ...state,
        requests: state.requests.filter((req) => req.id !== action.payload),
      };

    case CANCEL_FRIEND_REQUEST:
      return {
        ...state,
        sentRequests: state.sentRequests.filter((req) => req.id !== action.payload),
      };

    case REMOVE_FRIEND:
      // When removing a friend, also clear any pending requests/sentRequests
      const removedFriendId = action.payload;
      return {
        ...state,
        friends: state.friends.filter((friend) => friend.id !== removedFriendId),
        requests: state.requests.filter(
          (req) => req.senderId !== removedFriendId
        ),
        sentRequests: state.sentRequests.filter(
          (req) => req.recipientId !== removedFriendId
        ),
      };

    case UPDATE_FRIEND_STATUS:
      return {
        ...state,
        friends: state.friends.map((friend) =>
          friend.id === action.payload.friendId
            ? { ...friend, status: action.payload.status }
            : friend
        ),
      };

    default:
      return state;
  }
}
