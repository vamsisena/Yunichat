import React from 'react';
import { useSelector } from 'react-redux';

/**
 * MentionRenderer - A reusable component to render text with highlighted mentions
 * Features:
 * - Detects @username patterns in text
 * - Highlights mentions with styling
 * - Shows user info on hover
 * - Clickable mentions (optional)
 */
const MentionRenderer = ({ 
  text, 
  className = '',
  onMentionClick = null, // Optional callback when mention is clicked
  mentionClassName = 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 font-semibold px-1 rounded cursor-pointer hover:bg-primary-200 dark:hover:bg-primary-800',
  showTooltip = true
}) => {
  const users = useSelector((state) => state?.users?.users || []);
  
  // Regex to match @username patterns
  // Matches @username where username can contain letters, numbers, underscores, dots, hyphens
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;

  // Find user by username
  const findUserByUsername = (username) => {
    return users.find(u => u.username?.toLowerCase() === username.toLowerCase());
  };

  // Parse text and split into parts (text and mentions)
  const parseText = (inputText) => {
    if (!inputText) return [];
    
    const parts = [];
    let lastIndex = 0;
    let match;

    // Reset regex index
    mentionRegex.lastIndex = 0;

    while ((match = mentionRegex.exec(inputText)) !== null) {
      const mentionText = match[0]; // Full match including @
      const username = match[1]; // Username without @
      const startIndex = match.index;

      // Add text before mention
      if (startIndex > lastIndex) {
        parts.push({
          type: 'text',
          content: inputText.substring(lastIndex, startIndex)
        });
      }

      // Add mention
      parts.push({
        type: 'mention',
        content: mentionText,
        username: username,
        user: findUserByUsername(username)
      });

      lastIndex = startIndex + mentionText.length;
    }

    // Add remaining text
    if (lastIndex < inputText.length) {
      parts.push({
        type: 'text',
        content: inputText.substring(lastIndex)
      });
    }

    return parts;
  };

  const parts = parseText(text);

  // Handle mention click
  const handleMentionClick = (user, username) => {
    if (onMentionClick) {
      onMentionClick({ user, username });
    }
  };

  // Render individual mention
  const renderMention = (part, index) => {
    const { content, username, user } = part;
    
    const mentionElement = (
      <span
        key={index}
        className={mentionClassName}
        onClick={() => user && handleMentionClick(user, username)}
        data-username={username}
        data-user-id={user?.id}
        title={user ? `${user.username}${user.name ? ` (${user.name})` : ''}` : username}
      >
        {content}
      </span>
    );

    // Optionally wrap with tooltip
    if (showTooltip && user) {
      return (
        <span key={index} className="relative inline-block group">
          {mentionElement}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 dark:bg-gray-700 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50">
            <div className="font-semibold">{user.username}</div>
            {user.name && user.name !== user.username && (
              <div className="text-gray-300">{user.name}</div>
            )}
            {user.email && (
              <div className="text-gray-400 text-[10px]">{user.email}</div>
            )}
          </div>
        </span>
      );
    }

    return mentionElement;
  };

  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (part.type === 'mention') {
          return renderMention(part, index);
        }
        return <span key={index}>{part.content}</span>;
      })}
    </span>
  );
};

/**
 * Helper function to extract mentioned user IDs from text
 * Usage: const mentionedUserIds = extractMentionedUserIds(messageText, allUsers);
 */
export const extractMentionedUserIds = (text, users) => {
  if (!text || !users) return [];
  
  const mentionRegex = /@([a-zA-Z0-9_.]+)/g;
  const mentionedUserIds = [];
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    const username = match[1];
    const user = users.find(u => u.username?.toLowerCase() === username.toLowerCase());
    if (user && !mentionedUserIds.includes(user.id)) {
      mentionedUserIds.push(user.id);
    }
  }

  return mentionedUserIds;
};

/**
 * Helper function to check if a message contains mentions of a specific user
 * Usage: const isMentioned = isUserMentioned(messageText, currentUser, allUsers);
 */
export const isUserMentioned = (text, user, allUsers) => {
  if (!text || !user) return false;
  const mentionedIds = extractMentionedUserIds(text, allUsers);
  return mentionedIds.includes(user.id);
};

export default MentionRenderer;
