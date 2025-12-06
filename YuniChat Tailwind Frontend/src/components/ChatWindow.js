import React, { useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import useAuth from '../hooks/useAuth';
import { getAvatarColor } from '../utils/avatarUtils';
import UserActionPopup from './UserActionPopup';
import UserProfilePopup from './UserProfilePopup';
import VoiceMessagePlayer from './VoiceMessagePlayer';
import MentionRenderer from './MentionRenderer';

const ChatWindow = () => {
  const { user } = useAuth();
  const messagesEndRef = useRef(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [profileUser, setProfileUser] = useState(null);

  // Get public chat messages from Redux
  const storeData = useSelector((state) => {
    return {
      messages: state?.chat?.messages?.public || [],
    };
  });

  const { messages } = storeData;

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Format time to IST
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let ts = timestamp;
      if (typeof ts === 'string' && ts.includes('T')) {
        ts = ts.substring(0, 23) + 'Z';
      }
      
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      
      const istTimeString = date.toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      
      const timePart = istTimeString.split(',').pop().trim();
      return timePart.toLowerCase();
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  // Format date for separators
  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    
    try {
      let ts = timestamp;
      if (typeof ts === 'string' && ts.includes('T')) {
        ts = ts.substring(0, 23) + 'Z';
      }
      
      const date = new Date(ts);
      if (isNaN(date.getTime())) return '';
      
      const nowIST = new Date(new Date().toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const todayIST = new Date(nowIST.getFullYear(), nowIST.getMonth(), nowIST.getDate());
      
      const msgIST = new Date(date.toLocaleString('en-US', { timeZone: 'Asia/Kolkata' }));
      const msgDateIST = new Date(msgIST.getFullYear(), msgIST.getMonth(), msgIST.getDate());
      
      const diffTime = todayIST.getTime() - msgDateIST.getTime();
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays === 0) return 'Today';
      if (diffDays === 1) return 'Yesterday';
      if (diffDays > 0 && diffDays <= 7) {
        return date.toLocaleDateString('en-IN', { 
          weekday: 'long',
          timeZone: 'Asia/Kolkata' 
        });
      }
      
      return date.toLocaleDateString('en-IN', { 
        day: 'numeric', 
        month: 'short', 
        year: 'numeric',
        timeZone: 'Asia/Kolkata' 
      });
    } catch (error) {
      console.error('Error formatting date:', error);
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

  return (
    <div className="h-full overflow-y-auto px-4 pb-2 pt-4 flex flex-col gap-2 scrollbar-thin">
      {messages.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No messages yet. Start the conversation!
          </p>
        </div>
      ) : (
        groupMessagesByDate(messages).map((item, index) => {
          // Date separator
          if (item.type === 'date-separator') {
            return (
              <div key={`date-${index}`} className="flex items-center my-4 gap-4">
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
                <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-4 py-1 rounded-full font-medium">
                  {item.date}
                </span>
                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-700" />
              </div>
            );
          }

          // Message
          const msg = item.data;
          const isOwn = msg.senderId === user?.id;
          const isSystem = msg.type === 'SYSTEM';

          // System messages
          if (isSystem) {
            return (
              <div key={msg.id || index} className="text-center my-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  <MentionRenderer text={msg.content} />
                </span>
              </div>
            );
          }

          // Regular messages
          return (
            <div
              key={msg.id || index}
              className={`flex gap-2 ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              {!isOwn && (
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer flex-shrink-0 ${
                    msg.sender?.avatarUrl ? '' : getAvatarColor(msg.sender?.gender)
                  }`}
                  style={msg.sender?.avatarUrl ? {
                    backgroundImage: `url(${msg.sender.avatarUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center'
                  } : {}}
                  onClick={() => setSelectedUser(msg.sender || { id: msg.senderId, username: msg.senderName })}
                >
                  {!msg.sender?.avatarUrl && (msg.senderName?.charAt(0)?.toUpperCase() || '?')}
                </div>
              )}
              <div className={`max-w-[70%] rounded-lg p-3 ${
                isOwn 
                  ? 'bg-primary-500 text-white' 
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white'
              }`}>
                {!isOwn && (
                  <p 
                    className="text-sm font-semibold text-primary-600 dark:text-primary-400 mb-1 cursor-pointer hover:underline"
                    onClick={() => setSelectedUser(msg.sender || { id: msg.senderId, username: msg.senderName })}
                  >
                    {msg.senderName || msg.sender?.username || 'Unknown'}
                  </p>
                )}

                {/* Voice Message */}
                {msg.voiceUrl && msg.voiceUrl.trim() && (
                  <div className={msg.content ? 'mb-2' : ''}>
                    <VoiceMessagePlayer 
                      voiceUrl={msg.voiceUrl} 
                      duration={msg.voiceDuration}
                    />
                  </div>
                )}

                {/* File Attachment */}
                {msg.fileUrl && msg.fileUrl.trim() && (
                  <div className={(msg.content && msg.content.trim() && !msg.content.startsWith('Sent a file:')) ? 'mb-2' : ''}>
                    {(() => {
                      const fileNameFromContent = msg.content?.match(/Sent a file: (.+)$/)?.[1];
                      const actualFileName = msg.fileName || fileNameFromContent;
                      
                      // Images
                      if (actualFileName?.match(/\.(jpg|jpeg|png|gif|webp|bmp|svg)$/i)) {
                        return (
                          <img
                            src={msg.fileUrl}
                            alt={msg.fileName || 'Image'}
                            className="max-w-full max-h-[300px] rounded cursor-pointer block"
                            onClick={() => window.open(msg.fileUrl, '_blank')}
                            onError={(e) => {
                              console.error('❌ Image load error:', msg.fileUrl);
                              e.target.style.display = 'none';
                            }}
                          />
                        );
                      }
                      
                      // Videos
                      if (actualFileName?.match(/\.(mp4|webm|ogg|mov|avi)$/i)) {
                        return (
                          <video 
                            controls 
                            className="max-w-full max-h-[300px] rounded block"
                          >
                            <source src={msg.fileUrl} />
                            Your browser does not support video playback.
                          </video>
                        );
                      }
                      
                      // Audio
                      if (actualFileName?.match(/\.(mp3|wav|ogg|m4a|aac)$/i)) {
                        return (
                          <audio 
                            controls 
                            className="max-w-full rounded block"
                          >
                            <source src={msg.fileUrl} />
                            Your browser does not support audio playback.
                          </audio>
                        );
                      }
                      
                      // Other files
                      return (
                        <a
                          href={msg.fileUrl}
                          download
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`inline-flex items-center gap-1 underline hover:no-underline ${
                            isOwn ? 'text-white' : 'text-primary-600 dark:text-primary-400'
                          }`}
                        >
                          📎 {msg.fileName || 'Download File'}
                        </a>
                      );
                    })()}
                  </div>
                )}

                {/* Message Text */}
                {msg.content && msg.content.trim() && !msg.content.startsWith('Sent a file:') && (
                  <div className="text-sm break-words">
                    <MentionRenderer text={msg.content} />
                  </div>
                )}

                <div className="flex items-center gap-1 mt-1 justify-end">
                  <span className="text-[0.65rem] opacity-70">
                    {formatTime(msg.timestamp || msg.createdAt)}
                  </span>
                </div>
              </div>
            </div>
          );
        })
      )}
      <div ref={messagesEndRef} />

      {/* User Action Popup */}
      {selectedUser && (
        <UserActionPopup
          open={!!selectedUser}
          user={selectedUser}
          onClose={() => setSelectedUser(null)}
          onViewProfile={(user) => {
            setProfileUser(user);
            setSelectedUser(null);
          }}
        />
      )}
      
      {/* User Profile Popup */}
      {profileUser && (
        <UserProfilePopup
          open={!!profileUser}
          user={profileUser}
          onClose={() => setProfileUser(null)}
        />
      )}
    </div>
  );
};

export default ChatWindow;
