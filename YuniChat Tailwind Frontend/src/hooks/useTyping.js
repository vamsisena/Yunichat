import { useRef, useCallback } from 'react';

const useTyping = (sendTypingCallback, timeout = 3000) => {
  const typingTimeoutRef = useRef(null);
  const isTypingRef = useRef(false);

  const startTyping = useCallback(() => {
    console.log('🔵 [useTyping] startTyping called, current state:', isTypingRef.current);
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      console.log('🔵 [useTyping] Sending typing=true callback');
      sendTypingCallback(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout to stop typing
    typingTimeoutRef.current = setTimeout(() => {
      console.log('⏰ [useTyping] Timeout expired, stopping typing');
      if (isTypingRef.current) {
        isTypingRef.current = false;
        console.log('🔵 [useTyping] Sending typing=false callback');
        sendTypingCallback(false);
      }
    }, timeout);
  }, [sendTypingCallback, timeout]);

  const stopTyping = useCallback(() => {
    console.log('🔴 [useTyping] stopTyping called');
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    if (isTypingRef.current) {
      isTypingRef.current = false;
      console.log('🔴 [useTyping] Sending typing=false callback');
      sendTypingCallback(false);
    }
  }, [sendTypingCallback]);

  return {
    startTyping,
    stopTyping,
  };
};

export default useTyping;
