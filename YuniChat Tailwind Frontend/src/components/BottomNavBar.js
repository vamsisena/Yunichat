import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { toggleChatMinimized } from '../features/actions/chatActions';
import { getAvatarColorHex } from '../utils/avatarUtils';

const BottomNavBar = () => {
  const dispatch = useDispatch();

  const storeData = useSelector((state) => {
    return {
      activeChatUserId: state?.chat?.activeChatUserId || null,
      users: state?.users?.users || [],
      privateMessages: state?.chat?.privateMessages || {},
      chatMinimized: state?.chat?.chatMinimized || false,
    };
  });

  const { activeChatUserId, users, privateMessages, chatMinimized } = storeData;

  // Get user details by ID
  const getUserById = (userId) => {
    return users.find(u => u.id === userId);
  };

  // Check if user has unread messages
  const hasUnread = (userId) => {
    const messages = privateMessages[userId] || [];
    return messages.some(msg => !msg.read && msg.senderId !== msg.recipientId);
  };

  // Click on bottom icon toggles minimize/maximize
  const handleUserClick = () => {
    if (chatMinimized) {
      dispatch(toggleChatMinimized(false));
    } else {
      dispatch(toggleChatMinimized(true));
    }
  };

  // BottomNavBar disabled - SingleChatWindow handles minimized state with profile pictures
  return null;
};

export default BottomNavBar;
