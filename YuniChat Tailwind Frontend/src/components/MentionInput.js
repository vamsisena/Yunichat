import React, { useState, useRef, useEffect } from 'react';
import { useSelector } from 'react-redux';

/**
 * MentionInput - A reusable component for text input with @mention support
 * Features:
 * - Detects @ symbol and shows user dropdown
 * - Filters users based on typed text
 * - Keyboard navigation (Arrow up/down, Enter, Escape)
 * - Returns mentioned userIds along with message text
 */
const MentionInput = ({ 
  value, 
  onChange, 
  onKeyDown,
  placeholder = 'Type a message...',
  disabled = false,
  className = '',
  excludeCurrentUser = true,
  availableUsers = [] // Can be provided externally or uses Redux state
}) => {
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentionStartPos, setMentionStartPos] = useState(-1);
  const [selectedMentionIndex, setSelectedMentionIndex] = useState(0);
  const [cursorPosition, setCursorPosition] = useState(0);
  const inputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Get users from Redux if not provided
  const storeData = useSelector((state) => ({
    users: state?.users?.users || [],
    currentUser: state?.auth?.user || null,
    activeUsers: state?.chat?.activeUsers || []
  }));

  const { users: reduxUsers, currentUser, activeUsers } = storeData;
  
  // Use provided users or fall back to Redux users
  const allUsers = availableUsers.length > 0 ? availableUsers : reduxUsers;
  
  // Filter out current user if needed
  const usersToShow = excludeCurrentUser && currentUser
    ? allUsers.filter(u => u.id !== currentUser.id)
    : allUsers;

  // Filter users based on mention query
  const filteredUsers = usersToShow.filter(user => {
    if (!mentionQuery) return true;
    const username = user.username?.toLowerCase() || '';
    const name = user.name?.toLowerCase() || '';
    const query = mentionQuery.toLowerCase();
    return username.includes(query) || name.includes(query);
  }).slice(0, 10); // Limit to 10 suggestions

  // Detect @ mentions in text
  const detectMention = (text, position) => {
    const beforeCursor = text.substring(0, position);
    const lastAtSymbol = beforeCursor.lastIndexOf('@');
    
    if (lastAtSymbol === -1) {
      return { found: false };
    }

    // Check if there's a space after @ (invalid mention)
    const textAfterAt = beforeCursor.substring(lastAtSymbol + 1);
    if (textAfterAt.includes(' ')) {
      return { found: false };
    }

    return {
      found: true,
      startPos: lastAtSymbol,
      query: textAfterAt
    };
  };

  // Handle text change
  const handleInputChange = (e) => {
    const newValue = e.target.value;
    const newCursorPos = e.target.selectionStart;
    
    onChange(newValue);
    setCursorPosition(newCursorPos);

    // Check for mentions
    const mention = detectMention(newValue, newCursorPos);
    
    if (mention.found) {
      setShowMentionDropdown(true);
      setMentionQuery(mention.query);
      setMentionStartPos(mention.startPos);
      setSelectedMentionIndex(0);
    } else {
      setShowMentionDropdown(false);
      setMentionQuery('');
      setMentionStartPos(-1);
    }
  };

  // Handle mention selection
  const selectMention = (user) => {
    if (mentionStartPos === -1) return;

    const beforeMention = value.substring(0, mentionStartPos);
    const afterMention = value.substring(cursorPosition);
    const newValue = `${beforeMention}@${user.username} ${afterMention}`;
    
    onChange(newValue);
    setShowMentionDropdown(false);
    setMentionQuery('');
    setMentionStartPos(-1);

    // Set cursor position after the mention
    setTimeout(() => {
      const newCursorPos = mentionStartPos + user.username.length + 2; // +2 for @ and space
      inputRef.current?.setSelectionRange(newCursorPos, newCursorPos);
      inputRef.current?.focus();
    }, 0);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (showMentionDropdown && filteredUsers.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev < filteredUsers.length - 1 ? prev + 1 : 0
        );
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedMentionIndex(prev => 
          prev > 0 ? prev - 1 : filteredUsers.length - 1
        );
        return;
      }
      
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        selectMention(filteredUsers[selectedMentionIndex]);
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowMentionDropdown(false);
        return;
      }
    }

    // Pass through to parent handler
    if (onKeyDown) {
      onKeyDown(e);
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target) &&
          inputRef.current && !inputRef.current.contains(event.target)) {
        setShowMentionDropdown(false);
      }
    };

    if (showMentionDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showMentionDropdown]);

  // Get user status indicator
  const isUserOnline = (userId) => {
    return activeUsers.some(u => u.id === userId);
  };

  return (
    <div className="relative w-full">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleInputChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        disabled={disabled}
        className={className}
      />

      {/* Mention Dropdown */}
      {showMentionDropdown && filteredUsers.length > 0 && (
        <div 
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-2 w-full max-w-xs bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl max-h-60 overflow-y-auto z-[9999]"
        >
          <div className="p-2 text-xs text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
            Mention a user
          </div>
          {filteredUsers.map((user, index) => (
            <button
              key={user.id}
              onClick={() => selectMention(user)}
              className={`w-full flex items-center gap-3 px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                index === selectedMentionIndex ? 'bg-gray-100 dark:bg-gray-700' : ''
              }`}
            >
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                {user.avatarUrl ? (
                  <img 
                    src={user.avatarUrl} 
                    alt={user.username}
                    className="w-8 h-8 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-primary-500 flex items-center justify-center text-white text-sm font-semibold">
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                {isUserOnline(user.id) && (
                  <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></div>
                )}
              </div>
              
              {/* User Info */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {user.username}
                </div>
                {user.name && user.name !== user.username && (
                  <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user.name}
                  </div>
                )}
              </div>
              
              {/* Status Badge */}
              {isUserOnline(user.id) && (
                <span className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Online
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MentionInput;
