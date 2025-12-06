import { useEffect, useRef, useState, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { TOKEN_KEY } from '../utils/constants';

const useWebSocket = (url, onConnect, onError) => {
  const [connected, setConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const stompClientRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    // Don't connect if no URL provided (waiting for user info)
    if (!url) {
      console.log('🚫 WebSocket connect skipped: No URL provided (waiting for user)');
      return;
    }
    
    if (!mountedRef.current || stompClientRef.current?.connected) {
      console.log('🚫 WebSocket connect skipped:', { mounted: mountedRef.current, alreadyConnected: stompClientRef.current?.connected });
      return;
    }

    console.log('🔄 Starting WebSocket connection process...');
    setConnecting(true);
    const token = localStorage.getItem(TOKEN_KEY);
    console.log('🔑 Token found:', token ? 'YES (length: ' + token.length + ')' : 'NO');

    // Extract query parameters from URL for STOMP headers (SockJS doesn't preserve query params)
    let userId, username;
    try {
      const urlObj = new URL(url, window.location.origin);
      userId = urlObj.searchParams.get('userId');
      username = urlObj.searchParams.get('username');
      console.log('📋 Extracted from URL - userId:', userId, 'username:', username);
    } catch (e) {
      console.warn('⚠️ Could not parse URL for user params:', e);
    }

    // Build connect headers with user info
    const connectHeaders = {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(userId ? { userId: userId } : {}),
      ...(username ? { username: username } : {}),
    };
    console.log('📤 Connect headers:', Object.keys(connectHeaders));

    try {
      // Remove query params from URL for SockJS (use base URL only)
      const baseUrl = url.split('?')[0];
      console.log('🔗 Base URL for SockJS:', baseUrl);
      
      const stompClient = new Client({
        webSocketFactory: () => {
          console.log('🏭 Creating SockJS connection to:', baseUrl);
          const socket = new SockJS(baseUrl);
          console.log('✅ SockJS instance created');
          return socket;
        },
        connectHeaders: connectHeaders,
        debug: (str) => {
          if (process.env.NODE_ENV === 'development') {
            console.log('STOMP:', str);
          }
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 10000,
        heartbeatOutgoing: 10000,
        onConnect: () => {
          if (!mountedRef.current) return;
          console.log('✅✅✅ WebSocket CONNECTED successfully:', url);
          console.log('📊 Connection details:', { url, hasToken: !!token, mounted: mountedRef.current });
          setConnected(true);
          setConnecting(false);
          reconnectAttemptsRef.current = 0;
          
          if (onConnect) {
            console.log('🎯 Calling onConnect callback...');
            onConnect(stompClient);
            console.log('✅ onConnect callback completed');
          }
        },
        onStompError: (frame) => {
          if (!mountedRef.current) return;
          console.error('❌❌❌ WebSocket STOMP ERROR:', frame);
          console.error('📊 Error details:', { command: frame.command, headers: frame.headers, body: frame.body });
          setConnected(false);
          setConnecting(false);
          
          if (onError) {
            onError(frame);
          }
        },
        onWebSocketError: (error) => {
          if (!mountedRef.current) return;
          console.error('❌❌❌ WebSocket CONNECTION ERROR:', error);
          console.error('📊 Error type:', error?.type, 'Message:', error?.message);
          setConnected(false);
          setConnecting(false);
          
          if (onError) {
            onError(error);
          }
        },
        onDisconnect: () => {
          if (!mountedRef.current) return;
          console.log('🔌 WebSocket disconnected:', url);
          setConnected(false);
          setConnecting(false);
        },
      });

      stompClient.activate();
      stompClientRef.current = stompClient;
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setConnected(false);
      setConnecting(false);
      
      if (onError) {
        onError(error);
      }
    }
  }, [url, onConnect, onError]);

  const disconnect = useCallback(() => {
    mountedRef.current = false;
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (stompClientRef.current?.connected) {
      stompClientRef.current.deactivate();
      console.log('🔌 WebSocket manually disconnected:', url);
    }

    stompClientRef.current = null;
    setConnected(false);
    setConnecting(false);
  }, [url]);
  
  useEffect(() => {
    mountedRef.current = true;
    
    // Only connect if URL is provided (user info available)
    if (url) {
      console.log('🔄 useWebSocket: Attempting to connect to', url);
      connect();
    } else {
      console.log('⏳ useWebSocket: Waiting for URL (user info not ready)');
    }
    
    return () => {
      mountedRef.current = false;
      disconnect();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [url]); // Only reconnect when URL changes

  const sendMessage = useCallback((destination, body, headers = {}) => {
    if (stompClientRef.current?.connected) {
      stompClientRef.current.publish({
        destination,
        body: JSON.stringify(body),
        headers,
      });
      return true;
    } else {
      console.error('WebSocket not connected. Cannot send message.');
      return false;
    }
  }, []);

  const subscribe = useCallback((destination, callback, headers = {}) => {
    if (stompClientRef.current?.connected) {
      return stompClientRef.current.subscribe(destination, (message) => {
        try {
          const body = JSON.parse(message.body);
          callback(body);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
          callback(message.body);
        }
      }, headers);
    } else {
      console.error('WebSocket not connected. Cannot subscribe.');
      return null;
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    connected,
    connecting,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    stompClient: stompClientRef.current,
  };
};

export default useWebSocket;
