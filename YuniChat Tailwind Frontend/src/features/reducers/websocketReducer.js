import {
  WS_CHAT_CONNECTED,
  WS_CHAT_DISCONNECTED,
  WS_CHAT_SET_CLIENT,
  WS_NOTIFICATION_CONNECTED,
  WS_NOTIFICATION_DISCONNECTED,
  WS_NOTIFICATION_SET_CLIENT,
} from '../actionTypes/websocketTypes';

const initialState = {
  chatConnected: false,
  chatClient: null,
  notificationConnected: false,
  notificationClient: null,
};

const websocketReducer = (state = initialState, action) => {
  switch (action.type) {
    case WS_CHAT_CONNECTED:
      return {
        ...state,
        chatConnected: true,
      };
    case WS_CHAT_DISCONNECTED:
      return {
        ...state,
        chatConnected: false,
      };
    case WS_CHAT_SET_CLIENT:
      return {
        ...state,
        chatClient: action.payload,
      };
    case WS_NOTIFICATION_CONNECTED:
      return {
        ...state,
        notificationConnected: true,
      };
    case WS_NOTIFICATION_DISCONNECTED:
      return {
        ...state,
        notificationConnected: false,
      };
    case WS_NOTIFICATION_SET_CLIENT:
      return {
        ...state,
        notificationClient: action.payload,
      };
    default:
      return state;
  }
};

export default websocketReducer;
