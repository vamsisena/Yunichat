import { combineReducers } from 'redux';
import authReducer from '../features/reducers/authReducer';
import chatReducer from '../features/reducers/chatReducer';
import usersReducer from '../features/reducers/userReducer';
import friendsReducer from '../features/reducers/friendReducer';
import notificationsReducer from '../features/reducers/notificationReducer';
import uiReducer from '../features/reducers/uiReducer';
import websocketReducer from '../features/reducers/websocketReducer';
import callReducer from '../features/reducers/callReducer';

const rootReducer = combineReducers({
  auth: authReducer,
  chat: chatReducer,
  users: usersReducer,
  friends: friendsReducer,
  notifications: notificationsReducer,
  ui: uiReducer,
  websocket: websocketReducer,
  call: callReducer,
});

export default rootReducer;
