import React, { useEffect, useState, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, clearPublicMessagesAction } from '../features/actions/chatActions';
import useAuth from '../hooks/useAuth';
import ChatWindow from './ChatWindow';
import MessageInput from './MessageInput';
import chatApi from '../api/chatApi';
import { initializeMessageCleanup } from '../utils/messageStorage';

const PublicChat = () => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [typingStatus, setTypingStatus] = useState({});
  const subscriptionRef = useRef(false);
  const hasJoinedRef = useRef(false);
  const cleanupIntervalRef = useRef(null);
  
  // Initialize message cleanup timer
  useEffect(() => {
    cleanupIntervalRef.current = initializeMessageCleanup(() => {
      dispatch(clearPublicMessagesAction());
    });
    
    return () => {
      if (cleanupIntervalRef.current) {
        clearInterval(cleanupIntervalRef.current);
      }
    };
  }, [dispatch]);

  const storeData = useSelector((state) => {
    return {
      chatWsClient: state?.websocket?.chatClient || null,
      chatWsConnected: state?.websocket?.chatConnected || false,
      sidebarOpen: state?.ui?.sidebarOpen || false,
    };
  });

  const { chatWsClient, chatWsConnected, sidebarOpen } = storeData;
  const userId = user?.id;
  const username = user?.username;

  // Load existing messages and setup subscriptions
  useEffect(() => {
    if (!chatWsConnected || !chatWsClient || !userId || !username) {
      return;
    }

    // CRITICAL: Check if client is actually connected AND active before subscribing
    if (!chatWsClient.connected || !chatWsClient.active) {
      console.warn('⚠️ PublicChat: Client exists but not connected/active yet. Waiting...');
      return;
    }

    if (subscriptionRef.current) {
      return;
    }

    // Load existing messages from API
    const loadMessages = async () => {
      try {
        const response = await chatApi.getRoomMessages('public', { page: 0, size: 50 });
        
        if (response?.data?.content) {
          response.data.content.forEach((msg) => {
            const normalizedMessage = {
              ...msg,
              id: msg.id || Date.now(),
              senderId: msg.senderId,
              senderName: msg.senderUsername || msg.senderName || msg.sender?.username,
              sender: {
                id: msg.senderId,
                username: msg.senderUsername || msg.senderName || msg.sender?.username,
                gender: msg.sender?.gender,
                avatarUrl: msg.sender?.avatarUrl || msg.avatarUrl,
              },
              content: msg.content,
              type: msg.type || 'TEXT',
              timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
              fileUrl: msg.fileUrl,
              fileName: msg.fileName,
              voiceUrl: msg.voiceUrl,
              voiceDuration: msg.voiceDuration,
              chatKey: 'public',
            };
            dispatch(addMessage(normalizedMessage));
          });
        }
        
        // Initialize message cleanup (30-minute expiry)
        initializeMessageCleanup(dispatch);
      } catch (error) {
        console.error('❌ Error loading messages:', error);
      }
    };

    loadMessages();
    
    // Check if this is a fresh session or just a page refresh
    const hasJoinedSession = sessionStorage.getItem('publicChatJoined');
    
    // Subscribe to public room messages
    console.log('🎧 PublicChat: Setting up subscription to /topic/room/public');
    subscriptionRef.current = true;
    const messageSubscription = chatWsClient.subscribe('/topic/room/public', (message) => {
      try {
        console.log('📨 PublicChat: RECEIVED MESSAGE from /topic/room/public');
        const messageData = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;
        console.log('📦 PublicChat: Parsed message data:', messageData);
        
        // Normalize message structure
        const normalizedMessage = {
          ...messageData,
          id: messageData.id || Date.now(),
          senderId: messageData.senderId,
          senderName: messageData.senderUsername || messageData.senderName || messageData.sender?.username,
          sender: {
            id: messageData.senderId,
            username: messageData.senderUsername || messageData.senderName || messageData.sender?.username,
            gender: messageData.sender?.gender,
            avatarUrl: messageData.sender?.avatarUrl || messageData.avatarUrl,
          },
          content: messageData.content,
          type: messageData.type || 'TEXT',
          timestamp: messageData.timestamp || messageData.createdAt || new Date().toISOString(),
          fileUrl: messageData.fileUrl,
          fileName: messageData.fileName,
          voiceUrl: messageData.voiceUrl,
          voiceDuration: messageData.voiceDuration,
          mentionedUserIds: messageData.mentionedUserIds || [],
          chatKey: 'public',
        };
        
        console.log('📩 Public message received:', { 
          content: normalizedMessage.content,
          mentionedUserIds: normalizedMessage.mentionedUserIds,
          senderId: normalizedMessage.senderId
        });
        
        console.log('✨ Normalized message:', normalizedMessage);
        dispatch(addMessage(normalizedMessage));
        console.log('✅ PublicChat: Message dispatched to Redux');
      } catch (error) {
        console.error('❌ PublicChat: Error parsing message:', error, 'Raw message:', message);
      }
    });
    console.log('✅ Subscription to /topic/room/public created');
    
    // Subscribe to room events (join/leave messages)
    const eventsSubscription = chatWsClient.subscribe('/topic/room/public/events', (message) => {
      try {
        const eventData = typeof message.body === 'string' ? JSON.parse(message.body) : message.body;
        console.log('🔔 Room event received:', eventData);
        
        if (eventData.type === 'JOIN') {
          const username = eventData.username || eventData.senderUsername || 'Someone';
          dispatch(addMessage({
            id: `join_${eventData.userId}_${Date.now()}`,
            content: `${username} joined the chat 👋`,
            type: 'SYSTEM',
            timestamp: eventData.timestamp || new Date().toISOString(),
            chatKey: 'public',
          }));
          console.log('✅ JOIN message dispatched:', username);
        } else if (eventData.type === 'LEAVE') {
          const username = eventData.username || eventData.senderUsername || 'Someone';
          dispatch(addMessage({
            id: `leave_${eventData.userId}_${Date.now()}`,
            content: `${username} left the chat 👋`,
            type: 'SYSTEM',
            timestamp: eventData.timestamp || new Date().toISOString(),
            chatKey: 'public',
          }));
          console.log('✅ LEAVE message dispatched:', username);
        } else {
          const eventText = typeof eventData === 'string' ? eventData : eventData.content || JSON.stringify(eventData);
          dispatch(addMessage({
            id: Date.now(),
            content: eventText,
            type: 'SYSTEM',
            timestamp: new Date().toISOString(),
            chatKey: 'public',
          }));
        }
      } catch (error) {
        console.error('Error parsing event:', error);
      }
    });
    
    // Send join notification ONLY if not already joined
    setTimeout(() => {
      if (chatWsClient && chatWsClient.connected && chatWsClient.active && username && !hasJoinedSession) {
        console.log('👋 [JOIN] User:', username);
        
        // Show local join message
        dispatch(addMessage({
          id: `join_${userId}_${Date.now()}`,
          content: `You joined the chat 👋`,
          type: 'SYSTEM',
          timestamp: new Date().toISOString(),
          chatKey: 'public',
        }));
        
        // Send join event to backend
        try {
          chatWsClient.publish({
            destination: '/app/chat.join',
            body: JSON.stringify({
              roomId: 'public',
              username: username,
              userId: userId,
              timestamp: new Date().toISOString(),
            })
          });
          console.log('✅ [JOIN] Broadcast sent');
          sessionStorage.setItem('publicChatJoined', 'true');
        } catch (error) {
          console.error('❌ [JOIN] Failed to send broadcast:', error.message);
        }
        
        hasJoinedRef.current = true;
      }
    }, 500);
    
    // Cleanup subscriptions on unmount
    return () => {
      console.log('🧹 PublicChat: Cleaning up subscriptions');
      subscriptionRef.current = null;
      messageSubscription?.unsubscribe();
      eventsSubscription?.unsubscribe();
      
      if (chatWsClient && chatWsClient.connected && hasJoinedRef.current) {
        try {
          chatWsClient.publish({
            destination: '/app/chat.leave',
            body: JSON.stringify({ roomId: 'public', userId: userId })
          });
          console.log('👋 Sent leave notification');
        } catch (error) {
          console.log('⚠️ Could not send leave notification');
        }
        hasJoinedRef.current = false;
      }
    };
  }, [chatWsConnected, chatWsClient, userId, username, dispatch]);

  const handleSendMessage = async (messageText, attachment, mentionedUserIds = []) => {
    console.log('💬 handleSendMessage called:', { 
      messageText, 
      hasAttachment: !!attachment,
      mentionedUserIds,
      wsConnected: chatWsConnected,
    });
    
    if (!messageText?.trim() && !attachment) {
      console.warn('⚠️ Empty message with no attachment');
      return;
    }
    
    const message = {
      roomId: 'public',
      content: messageText?.trim() || '',
      type: attachment?.voiceUrl ? 'VOICE' : (attachment?.fileUrl ? 'FILE' : 'TEXT'),
      senderId: user?.id,
      senderUsername: user?.username,
      sender: {
        id: user?.id,
        username: user?.username,
        gender: user?.gender,
        avatarUrl: user?.avatarUrl
      },
      timestamp: new Date().toISOString(),
      fileUrl: attachment?.fileUrl || null,
      fileName: attachment?.fileName || null,
      voiceUrl: attachment?.voiceUrl || null,
      voiceDuration: attachment?.voiceDuration || null,
      mentionedUserIds: mentionedUserIds || [], // Include mentioned user IDs
    };

    if (chatWsConnected && chatWsClient && chatWsClient.connected) {
      try {
        console.log('📤 SENDING message via WebSocket');
        chatWsClient.publish({
          destination: '/app/chat.sendMessage',
          body: JSON.stringify(message)
        });
        console.log('✅ Message published successfully');
        return;
      } catch (error) {
        console.error('❌ WebSocket send failed:', error);
        dispatch(addMessage({ 
          ...message, 
          id: Date.now(), 
          status: 'ERROR',
          chatKey: 'public',
          error: 'Failed to send message.' 
        }));
      }
    } else {
      console.warn('⚠️ WebSocket not connected');
      dispatch(addMessage({ 
        ...message, 
        id: Date.now(), 
        status: 'ERROR',
        chatKey: 'public',
        error: 'WebSocket not connected.' 
      }));
    }
  };

  const handleTyping = (isTyping) => {
    if (chatWsConnected && chatWsClient && chatWsClient.connected) {
      const destination = isTyping ? '/app/chat.typing' : '/app/chat.stopTyping';
      chatWsClient.publish({
        destination,
        body: JSON.stringify({
          userId: user?.id,
          username: user?.username,
          roomId: 'public',
          isTyping,
        })
      });
    }
  };

  const getTypingUsers = () => {
    return Object.entries(typingStatus)
      .filter(([userId, isTyping]) => isTyping && userId !== String(user?.id))
      .map(() => 'Someone');
  };

  const typingUsers = getTypingUsers();

  return (
    <div className={`h-full flex flex-col transition-all duration-300 relative ${sidebarOpen ? 'ml-0' : 'sm:-ml-35'}`}>
      {/* Chat Header */}
      <div className="flex-shrink-0 p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Public Chat</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          {chatWsConnected ? '🟢 Connected' : '🔴 Connecting...'}
        </p>
        {typingUsers.length > 0 && (
          <p className="text-sm text-primary-500 dark:text-primary-400">
            {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
          </p>
        )}
      </div>

      {/* Chat Messages - Scrollable container */}
      <div className="flex-1 overflow-hidden">
        <ChatWindow />
      </div>

      {/* Message Input - Fixed above bottom bar */}
      <div className="flex-shrink-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 z-10">
        <MessageInput
          onSendMessage={handleSendMessage}
          onTyping={handleTyping}
          disabled={false}
          allowAttachments={true}
        />
      </div>
    </div>
  );
};

export default PublicChat;
