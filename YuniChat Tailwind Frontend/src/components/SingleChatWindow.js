import React, { useEffect, useState, useRef } from 'react';
import { XMarkIcon, MinusIcon, ArrowsPointingOutIcon, PencilIcon, TrashIcon, CheckIcon } from '@heroicons/react/24/solid';
import { useDispatch, useSelector } from 'react-redux';
import { addMessage, setActiveChatWindow, toggleChatMinimized, markMessagesAsRead, updateMessage, updateMessageStatus } from '../features/actions/chatActions';
import useAuth from '../hooks/useAuth';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import MessageReactions from './MessageReactions';
import MentionRenderer from './MentionRenderer';
import CallActionButtons from './CallActionButtons';
import chatApi from '../api/chatApi';
import { getAvatarColor } from '../utils/avatarUtils';

const SingleChatWindow = () => {
  const dispatch = useDispatch();
  const { user, isGuest } = useAuth();
  const messagesEndRef = useRef(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [messageReactions, setMessageReactions] = useState({});
  const [editingMessageId, setEditingMessageId] = useState(null);
  const [editedContent, setEditedContent] = useState('');
  const [hoveredMessageId, setHoveredMessageId] = useState(null);
  const readReceiptSubscriptionRef = useRef(null);
  const reactionSubscriptionRef = useRef(null);
  const readReceiptsSentRef = useRef(new Set());

  const storeData = useSelector((state) => {
    return {
      activeChatUserId: state?.chat?.activeChatUserId || null,
      chatMinimized: state?.chat?.chatMinimized || false,
      users: state?.users?.users || [],
      activeUsers: state?.chat?.activeUsers || [],
      privateMessages: state?.chat?.privateMessages || {},
      chatWsClient: state?.websocket?.chatClient || null,
      chatWsConnected: state?.websocket?.chatConnected || false,
      typingIndicators: state?.chat?.typingIndicators || {},
    };
  });

  const { activeChatUserId, chatMinimized, users, activeUsers, privateMessages, chatWsClient, chatWsConnected, typingIndicators } = storeData;

  const activeUser = activeChatUserId ? activeUsers.find(u => u.id === activeChatUserId) || users.find(u => u.id === activeChatUserId) : null;
  const messages = activeChatUserId ? (privateMessages[activeChatUserId] || []) : [];
  const otherUserTyping = typingIndicators?.[activeChatUserId]?.isTyping || false;

  // Send read receipt for a specific message
  const sendReadReceipt = (message) => {
    if (chatWsClient && chatWsConnected && chatWsClient.connected && message.senderId !== user?.id) {
      try {
        chatWsClient.publish({
          destination: '/app/chat.markAsRead',
          body: JSON.stringify({
            messageId: message.id,
            readerId: user?.id,
            senderId: message.senderId,
            readAt: new Date().toISOString()
          }),
          headers: { 'content-type': 'application/json' }
        });
      } catch (error) {
        console.error('Error sending read receipt:', error);
      }
    }
  };

  // Load existing private messages when chat opens
  useEffect(() => {
    const loadPrivateMessages = async () => {
      if (activeChatUserId && user?.id) {
        try {
          const response = await chatApi.getPrivateMessages(activeChatUserId);
          const existingMessages = response.data?.data || response.data || [];
          const existingIds = new Set(messages.map(m => m.id));
          
          existingMessages.forEach(msg => {
            if (!existingIds.has(msg.id)) {
              const normalizedMessage = {
                id: msg.id,
                senderId: msg.senderId,
                recipientId: msg.recipientId,
                senderName: msg.senderUsername || msg.senderName,
                content: msg.content,
                type: msg.type || 'TEXT',
                timestamp: msg.timestamp || msg.createdAt,
                fileUrl: msg.fileUrl,
                fileName: msg.fileName,
                voiceUrl: msg.voiceUrl,
                voiceDuration: msg.voiceDuration,
                chatKey: activeChatUserId.toString(),
                isRead: msg.isRead || msg.read || false, // Preserve read status from backend
                read: msg.isRead || msg.read || false,
                readAt: msg.readAt
              };
              dispatch(addMessage(normalizedMessage));
              
              // Send read receipt for unread messages from other user
              if (!chatMinimized && msg.senderId === activeChatUserId && !msg.isRead && !msg.read) {
                sendReadReceipt(normalizedMessage);
              }
            }
          });
        } catch (error) {
          console.error('Error loading private messages:', error);
        }
      }
    };

    if (messages.length === 0) {
      loadPrivateMessages();
    }
  }, [activeChatUserId, user?.id, dispatch]);

  // Mark messages as read when chat window opens and send read receipts
  useEffect(() => {
    if (activeChatUserId && !chatMinimized && chatWsClient && chatWsConnected && user?.id) {
      // Mark as read in local state
      dispatch(markMessagesAsRead(activeChatUserId));
      
      // Get messages for this conversation from privateMessages
      const conversationMessages = privateMessages[activeChatUserId] || [];
      
      // Send read receipts to backend for unread messages from the other user
      const unreadMessages = conversationMessages.filter(msg => 
        msg.senderId === activeChatUserId && 
        msg.recipientId === user.id && 
        !msg.isRead && 
        !msg.read &&
        !readReceiptsSentRef.current.has(msg.id) // Don't send duplicates
      );
      
      console.log('📧 Sending read receipts for', unreadMessages.length, 'messages');
      
      unreadMessages.forEach(msg => {
        if (chatWsClient.connected) {
          try {
            chatWsClient.publish({
              destination: '/app/chat.markAsRead',
              body: JSON.stringify({
                messageId: msg.id,
                readerId: user.id,
                senderId: msg.senderId,
                readAt: new Date().toISOString()
              }),
              headers: { 'content-type': 'application/json' }
            });
            readReceiptsSentRef.current.add(msg.id); // Track sent receipts
            console.log('✓ Sent read receipt for message:', msg.id);
          } catch (error) {
            console.error('Error sending read receipt:', error);
          }
        }
      });
    }
    
    // Clear tracking when switching chats
    return () => {
      if (activeChatUserId) {
        readReceiptsSentRef.current = new Set();
      }
    };
  }, [activeChatUserId, chatMinimized, chatWsClient, chatWsConnected, dispatch, user?.id]);

  // Subscribe to read receipts
  useEffect(() => {
    if (!chatWsClient || !chatWsConnected || !user?.id) return;
    
    // Check if client is actually connected and active
    if (!chatWsClient.connected || !chatWsClient.active) {
      console.warn('STOMP client not ready for subscription');
      return;
    }

    let subscription = null;
    
    try {
      subscription = chatWsClient.subscribe(`/user/${user.id}/queue/read-receipt`, (message) => {
        try {
          const readMessage = JSON.parse(message.body);
          console.log('✓✓ Read receipt received:', readMessage);
          
          if (readMessage.messageId) {
            // Update message status in privateMessages
            dispatch({
              type: 'UPDATE_PRIVATE_MESSAGE_STATUS',
              payload: {
                messageId: readMessage.messageId,
                isRead: true,
                readAt: readMessage.readAt
              }
            });
          }
        } catch (error) {
          console.error('Error parsing read receipt:', error);
        }
      });
      
      readReceiptSubscriptionRef.current = subscription;
    } catch (error) {
      console.error('Error subscribing to read receipts:', error);
    }

    // Subscribe to message reactions
    try {
      const reactionSub = chatWsClient.subscribe(
        `/user/queue/message-reaction`,
        (message) => {
          try {
            const reaction = JSON.parse(message.body);
            console.log('😀 Received reaction:', reaction);
            
            setMessageReactions(prev => {
              const updated = {
                ...prev,
                [reaction.messageId]: [
                  ...(prev[reaction.messageId] || []),
                  reaction
                ]
              };
              console.log('Updated messageReactions state:', updated);
              return updated;
            });
          } catch (error) {
            console.error('❌ Error processing reaction:', error);
          }
        }
      );
      reactionSubscriptionRef.current = reactionSub;

      // Subscribe to reaction removals
      chatWsClient.subscribe(
        `/user/queue/message-reaction-remove`,
        (message) => {
          try {
            const data = JSON.parse(message.body);
            console.log('🗑️ Reaction removed:', data);
            
            setMessageReactions(prev => ({
              ...prev,
              [data.messageId]: (prev[data.messageId] || []).filter(
                r => !(r.userId === data.userId && r.emoji === data.emoji)
              )
            }));
          } catch (error) {
            console.error('❌ Error processing reaction removal:', error);
          }
        }
      );
    } catch (error) {
      console.error('❌ Error setting up reaction subscriptions:', error);
    }

    return () => {
      if (readReceiptSubscriptionRef.current) {
        try {
          readReceiptSubscriptionRef.current.unsubscribe();
        } catch (error) {
          console.error('Error unsubscribing from read receipts:', error);
        }
        readReceiptSubscriptionRef.current = null;
      }
      if (reactionSubscriptionRef.current) {
        try {
          reactionSubscriptionRef.current.unsubscribe();
        } catch (error) {
          console.error('❌ Error unsubscribing from reactions:', error);
        }
        reactionSubscriptionRef.current = null;
      }
    };
  }, [chatWsClient, chatWsConnected, user?.id, dispatch]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, otherUserTyping]);

  // Handle typing indicator
  const handleTypingChange = (typing) => {
    if (!chatWsClient || !chatWsConnected || !user?.id || !activeChatUserId) return;

    try {
      chatWsClient.publish({
        destination: '/app/chat.privateTyping',
        body: JSON.stringify({
          userId: user.id,
          username: user.username,
          recipientId: activeChatUserId,
          isTyping: typing,
        }),
        headers: { 'content-type': 'application/json' },
      });
    } catch (error) {
      console.error('Error publishing typing indicator:', error);
    }
  };

  const handleClose = () => {
    dispatch(setActiveChatWindow(null));
    dispatch(toggleChatMinimized(false));
    setIsFullscreen(false);
  };

  const handleMinimize = () => {
    dispatch(toggleChatMinimized(true));
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  // Message edit/delete handlers
  const handleStartEdit = (message) => {
    setEditingMessageId(message.id);
    setEditedContent(message.content);
    setHoveredMessageId(null);
  };

  const handleCancelEdit = () => {
    setEditingMessageId(null);
    setEditedContent('');
  };

  const handleSaveEdit = async (messageId) => {
    if (!editedContent.trim()) {
      handleCancelEdit();
      return;
    }

    try {
      if (chatWsClient && chatWsConnected && chatWsClient.connected) {
        const editPayload = {
          messageId,
          content: editedContent.trim(),
        };
        console.log('📝 Editing message:', editPayload);
        chatWsClient.publish({
          destination: '/app/chat.editMessage',
          body: JSON.stringify(editPayload),
          headers: {
            'content-type': 'application/json',
          },
        });
        
        // Update local state immediately
        dispatch(updateMessage({
          id: messageId,
          content: editedContent.trim(),
          chatKey: activeChatUserId.toString(),
        }));
        handleCancelEdit();
      } else {
        await chatApi.editMessage(messageId, editedContent.trim());
        dispatch(updateMessage({
          id: messageId,
          content: editedContent.trim(),
          chatKey: activeChatUserId.toString(),
        }));
        handleCancelEdit();
      }
    } catch (error) {
      console.error('❌ Error editing message:', error);
      alert('Failed to edit message. Please try again.');
    }
  };

  const handleDeleteMessage = async (messageId) => {
    try {
      if (chatWsClient && chatWsConnected && chatWsClient.connected) {
        const deletePayload = { messageId };
        console.log('🗑️ Deleting message:', deletePayload);
        chatWsClient.publish({
          destination: '/app/chat.deleteMessage',
          body: JSON.stringify(deletePayload),
          headers: {
            'content-type': 'application/json',
          },
        });
        
        // Update local state immediately
        dispatch(updateMessage({
          id: messageId,
          isDeleted: true,
          chatKey: activeChatUserId.toString(),
        }));
      } else {
        await chatApi.deleteMessage(messageId);
        dispatch(updateMessage({
          id: messageId,
          isDeleted: true,
          chatKey: activeChatUserId.toString(),
        }));
      }
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      alert('Failed to delete message. Please try again.');
    }
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let ts = timestamp;
      // Handle ISO format with nanoseconds from backend (e.g., 2025-11-20T14:20:09.981490375)
      if (typeof ts === 'string' && ts.includes('T')) {
        // Remove extra precision (nanoseconds) if present, keep milliseconds
        ts = ts.substring(0, 23) + 'Z';
      }
      
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      
      // Use toLocaleString to convert to IST
      const istTimeString = date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      // Extract just the time part (remove date if present)
      const timePart = istTimeString.split(',').pop().trim();
      return timePart.toLowerCase();
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    try {
      const date = new Date(timestamp);
      const today = new Date();
      if (date.toDateString() === today.toDateString()) return 'Today';
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch (error) {
      return '';
    }
  };

  // Group messages by date
  const groupMessagesByDate = (messages) => {
    const groups = [];
    let currentDate = null;
    
    messages.forEach((msg) => {
      const msgDate = formatDate(msg.timestamp || msg.createdAt);
      if (msgDate !== currentDate) {
        groups.push({ type: 'date-separator', date: msgDate });
        currentDate = msgDate;
      }
      groups.push({ type: 'message', data: msg });
    });
    
    return groups;
  };

  if (!activeChatUserId || !activeUser) return null;

  const messageGroups = groupMessagesByDate(messages);
  const avatarColor = getAvatarColor(activeUser.username);

  // Minimized state
  if (chatMinimized) {
    return (
      <div
        className="fixed bottom-20 right-4 z-40 cursor-pointer"
        onClick={() => dispatch(toggleChatMinimized(false))}
      >
        <div className="relative">
          {activeUser.avatarUrl ? (
            <img 
              src={activeUser.avatarUrl} 
              alt={activeUser.username}
              className="w-14 h-14 rounded-full object-cover shadow-lg hover:scale-110 transition-transform"
            />
          ) : (
            <div 
              className={`w-14 h-14 rounded-full flex items-center justify-center text-white font-semibold shadow-lg hover:scale-110 transition-transform ${getAvatarColor(activeUser.gender)}`}
            >
              {activeUser.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Full chat window
  return (
    <div 
      className={`fixed ${isFullscreen ? 'inset-16' : 'bottom-2 right-2 w-80 h-[480px]'} bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col z-40 transition-all duration-300 overflow-hidden`}
    >
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-primary-500 to-primary-600 text-white rounded-t-lg relative">
        <div className="flex items-center gap-2.5">
          {activeUser.avatarUrl ? (
            <img 
              src={activeUser.avatarUrl} 
              alt={activeUser.username}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div 
              className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-white ${getAvatarColor(activeUser.gender)}`}
            >
              {activeUser.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h3 className="font-semibold text-sm">{activeUser.username}</h3>
            <p className="text-xs opacity-90">{activeUser.status || 'Online'}</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {/* Call Action Buttons - Only for registered users in private chat */}
          <CallActionButtons 
            currentUser={user}
            otherUser={activeUser}
            isPrivateChat={true}
          />
          
          <button 
            onClick={(e) => { e.stopPropagation(); toggleFullscreen(); }}
            className="p-1.5 hover:bg-white/30 rounded transition-colors"
            title={isFullscreen ? 'Exit fullscreen' : 'Fullscreen'}
          >
            <ArrowsPointingOutIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleMinimize(); }} 
            className="p-1.5 hover:bg-white/30 rounded transition-colors"
          >
            <MinusIcon className="w-5 h-5" />
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); handleClose(); }} 
            className="p-1.5 hover:bg-white/30 rounded transition-colors"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-transparent hover:scrollbar-thumb-gray-400 dark:hover:scrollbar-thumb-gray-600 scrollbar-track-transparent">
        {messageGroups.map((group, idx) => {
          if (group.type === 'date-separator') {
            return (
              <div key={`date-${idx}`} className="flex justify-center my-3">
                <span className="px-3 py-1 bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-400 rounded-full">
                  {group.date}
                </span>
              </div>
            );
          }

          const msg = group.data;
          const isOwnMessage = msg.senderId === user?.id;
          const isEditing = editingMessageId === msg.id;
          const isHovered = hoveredMessageId === msg.id;
          const hasTextContent = msg.content && msg.content.trim() && !msg.content.startsWith('Sent a file:');
          const hasMultimedia = msg.voiceUrl || msg.fileUrl;

          return (
            <div 
              key={msg.id} 
              className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} group relative`}
            >
              <div className={`max-w-[75%] ${isOwnMessage ? 'order-2' : 'order-1'} relative`}>
                <div 
                  onMouseEnter={() => setHoveredMessageId(msg.id)}
                  onMouseLeave={() => setHoveredMessageId(null)}
                  className={`rounded-lg p-2.5 ${
                  isOwnMessage 
                    ? 'bg-primary-500 text-white' 
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
                }`}>
                  {/* Voice Message */}
                  {msg.type === 'VOICE' && msg.voiceUrl && !msg.isDeleted && (
                    <VoiceMessagePlayer voiceUrl={msg.voiceUrl} duration={msg.voiceDuration} />
                  )}
                  
                  {/* File Attachment */}
                  {msg.type === 'FILE' && msg.fileUrl && !msg.isDeleted && (
                    <div className="mb-1">
                      {msg.fileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i) ? (
                        <img 
                          src={msg.fileUrl} 
                          alt={msg.fileName} 
                          className="rounded max-w-full max-h-60 cursor-pointer"
                          onClick={() => window.open(msg.fileUrl, '_blank')}
                        />
                      ) : msg.fileName?.match(/\.(mp4|webm|ogg|mov|avi)$/i) ? (
                        <video controls className="rounded max-w-full max-h-60">
                          <source src={msg.fileUrl} />
                        </video>
                      ) : msg.fileName?.match(/\.(mp3|wav|ogg|m4a|aac)$/i) ? (
                        <audio controls className="max-w-full">
                          <source src={msg.fileUrl} />
                        </audio>
                      ) : (
                        <a 
                          href={msg.fileUrl} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={`flex items-center gap-2 underline ${isOwnMessage ? 'text-white' : 'text-primary-500'}`}
                        >
                          📎 {msg.fileName || 'Download File'}
                        </a>
                      )}
                    </div>
                  )}

                  {/* Message Text */}
                  {hasTextContent && !msg.isDeleted && (
                    <>
                      {isEditing ? (
                        <div className="space-y-1">
                          <input
                            type="text"
                            value={editedContent}
                            onChange={(e) => setEditedContent(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveEdit(msg.id);
                              if (e.key === 'Escape') handleCancelEdit();
                            }}
                            className="w-full px-2 py-1 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-300 dark:border-gray-600 rounded"
                            autoFocus
                          />
                          <div className="flex items-center justify-end gap-1.5">
                            <span className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                              {formatTime(msg.timestamp || msg.createdAt)}
                            </span>
                            <button 
                              onClick={() => handleSaveEdit(msg.id)} 
                              className="p-1 bg-green-500 hover:bg-green-600 rounded text-white"
                              title="Save"
                            >
                              <CheckIcon className="w-3.5 h-3.5" />
                            </button>
                            <button 
                              onClick={handleCancelEdit} 
                              className="p-1 bg-red-500 hover:bg-red-600 rounded text-white"
                              title="Cancel"
                            >
                              <XMarkIcon className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="text-sm whitespace-pre-wrap break-words">
                          <MentionRenderer text={msg.content} />
                        </div>
                      )}
                    </>
                  )}

                  {msg.isDeleted && (
                    <p className="text-sm italic opacity-60">This message was deleted</p>
                  )}

                  {/* Timestamp and Read Receipt */}
                  {!isEditing && (
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`text-xs ${isOwnMessage ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'}`}>
                        {formatTime(msg.timestamp || msg.createdAt)}
                      </span>
                      {isOwnMessage && (
                        <span className={`text-xs font-bold ${msg.isRead ? 'text-blue-400' : 'text-white/60'}`}>
                          {msg.isRead ? '✓✓' : '✓'}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Edit/Delete buttons - on hover inside message bubble */}
                  {isOwnMessage && isHovered && !msg.isDeleted && !isEditing && (
                    <div className="absolute -top-7 right-1 flex gap-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-0.5 z-50">
                      {hasTextContent && !hasMultimedia && (
                        <button
                          onClick={(e) => { e.stopPropagation(); handleStartEdit(msg); }}
                          className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-primary-500 hover:text-white rounded transition-all"
                          title="Edit"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteMessage(msg.id); }}
                        className="p-1.5 text-gray-700 dark:text-gray-300 hover:bg-red-500 hover:text-white rounded transition-all"
                        title="Delete"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Message Reactions - below message bubble like Teams */}
                {!msg.isDeleted && (
                  <MessageReactions
                    messageId={msg.id}
                    reactions={messageReactions[msg.id] || []}
                    currentUserId={user?.id}
                    onAddReaction={(msgId, emoji) => {
                      if (chatWsClient && chatWsConnected) {
                        const payload = { messageId: msgId, emoji: emoji, userId: user?.id };
                        console.log('➕ Adding reaction:', payload);
                        chatWsClient.publish({
                          destination: '/app/chat.addReaction',
                          body: JSON.stringify(payload),
                          headers: { 'content-type': 'application/json' }
                        });
                      } else {
                        console.warn('⚠️ Cannot add reaction - WebSocket not connected');
                      }
                    }}
                    onRemoveReaction={(msgId, emoji) => {
                      if (chatWsClient && chatWsConnected) {
                        const payload = { messageId: msgId, emoji: emoji, userId: user?.id };
                        console.log('➖ Removing reaction:', payload);
                        chatWsClient.publish({
                          destination: '/app/chat.removeReaction',
                          body: JSON.stringify(payload),
                          headers: { 'content-type': 'application/json' }
                        });
                      } else {
                        console.warn('⚠️ Cannot remove reaction - WebSocket not connected');
                      }
                    }}
                  />
                )}
              </div>
            </div>
          );
        })}

        {otherUserTyping && <TypingIndicator username={activeUser.username} />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pb-2">
        <MessageInput
          onSendMessage={async (text, file, mentionedUserIds = []) => {
            if ((text?.trim() || file) && activeChatUserId && chatWsClient?.connected) {
              const messagePayload = {
                roomId: `private_${Math.min(user.id, activeChatUserId)}_${Math.max(user.id, activeChatUserId)}`,
                recipientId: activeChatUserId,
                content: text?.trim() || '',
                type: file?.type || (file ? 'FILE' : 'TEXT'),
                mentionedUserIds: mentionedUserIds || [],
                fileUrl: file?.fileUrl || null,
                fileName: file?.fileName || null,
                voiceUrl: file?.voiceUrl || null,
                voiceDuration: file?.voiceDuration || null,
              };
              
              chatWsClient.publish({
                destination: '/app/chat.sendPrivateMessage',
                body: JSON.stringify(messagePayload),
                headers: {
                  'content-type': 'application/json'
                }
              });
            }
          }}
          onTyping={handleTypingChange}
          disabled={!chatWsConnected || !chatWsClient?.connected}
          allowAttachments={!isGuest && !!activeChatUserId}
        />
        {(!chatWsConnected || !chatWsClient?.connected) && (
          <p className="text-xs text-red-600 dark:text-red-400 px-2 py-1">
            WebSocket not connected. Waiting...
          </p>
        )}
      </div>
    </div>
  );
};

export default SingleChatWindow;
