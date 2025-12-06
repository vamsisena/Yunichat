import { useEffect, useRef, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { logout } from '../features/actions/authActions';
import { INACTIVITY_TIMEOUT } from '../utils/constants';

const useInactivityTimer = (enabled = true) => {
  const dispatch = useDispatch();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());
  const { isGuest } = useSelector((state) => ({
    isGuest: state?.auth?.isGuest || false,
  }));

  const resetTimer = useCallback(() => {
    if (!enabled) return;

    // Update last activity timestamp
    lastActivityRef.current = Date.now();
    localStorage.setItem('lastActivity', lastActivityRef.current.toString());

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      dispatch(logout());
    }, INACTIVITY_TIMEOUT);
  }, [enabled, dispatch]);

  const clearTimer = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Check if guest user should be logged out based on last activity
    if (isGuest) {
      const lastActivity = localStorage.getItem('lastActivity');
      if (lastActivity) {
        const timeSinceLastActivity = Date.now() - parseInt(lastActivity, 10);
        if (timeSinceLastActivity > INACTIVITY_TIMEOUT) {
          dispatch(logout());
          return;
        }
      } else {
        localStorage.setItem('lastActivity', Date.now().toString());
      }
    }

    // Events to track user activity
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click'];

    // Add event listeners
    events.forEach((event) => {
      window.addEventListener(event, resetTimer);
    });

    // Start timer
    resetTimer();

    // Cleanup
    return () => {
      events.forEach((event) => {
        window.removeEventListener(event, resetTimer);
      });
      clearTimer();
    };
  }, [enabled, resetTimer, clearTimer, isGuest, dispatch]);

  return {
    resetTimer,
    clearTimer,
  };
};

export default useInactivityTimer;
