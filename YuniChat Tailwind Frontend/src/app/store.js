import { createStore, applyMiddleware, compose } from 'redux';
import thunk from 'redux-thunk';
import rootReducer from './rootReducer';
import { TOKEN_KEY, USER_KEY } from '../utils/constants';

// Load initial state from localStorage
const loadState = () => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const user = localStorage.getItem(USER_KEY);
    
    if (token && user) {
      const parsedUser = JSON.parse(user);
      // Use is_guest from database
      const isGuestUser = parsedUser.isGuest === true || parsedUser.isGuest === 'true';
      return {
        auth: {
          loading: false,
          error: null,
          user: parsedUser,
          isAuthenticated: true,
          isGuest: isGuestUser,
        },
      };
    }
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
  }
  return undefined;
};

// Redux DevTools Extension
const composeEnhancers =
  (typeof window !== 'undefined' &&
    window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
  compose;

const store = createStore(
  rootReducer,
  loadState(),
  composeEnhancers(applyMiddleware(thunk))
);

export default store;
