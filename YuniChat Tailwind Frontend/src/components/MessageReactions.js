import React, { useState } from 'react';
import { FaceSmileIcon } from '@heroicons/react/24/outline';

const QUICK_REACTIONS = ['👍', '❤️', '😂'];

const MessageReactions = ({ 
  messageId, 
  reactions = [], 
  currentUserId, 
  onAddReaction, 
  onRemoveReaction 
}) => {
  const [showPicker, setShowPicker] = useState(false);

  const handleReactionClick = (emoji) => {
    const existingReaction = reactions.find(
      r => r.emoji === emoji && r.userId === currentUserId
    );

    if (existingReaction) {
      onRemoveReaction?.(messageId, emoji);
    } else {
      onAddReaction?.(messageId, emoji);
    }
  };

  const handleQuickReaction = (emoji) => {
    handleReactionClick(emoji);
    setShowPicker(false);
  };

  // Group reactions by emoji
  const reactionCounts = reactions.reduce((acc, reaction) => {
    if (!acc[reaction.emoji]) {
      acc[reaction.emoji] = {
        count: 0,
        userReacted: false,
      };
    }
    acc[reaction.emoji].count++;
    if (reaction.userId === currentUserId) {
      acc[reaction.emoji].userReacted = true;
    }
    return acc;
  }, {});

  const hasReactions = Object.keys(reactionCounts).length > 0;

  return (
    <div className="relative flex items-center gap-1.5 flex-wrap mt-1.5 ml-1">
      {/* Display existing reactions */}
      {Object.entries(reactionCounts).map(([emoji, data]) => (
        <button
          key={emoji}
          onClick={() => handleReactionClick(emoji)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs border transition-all hover:shadow-sm ${
            data.userReacted
              ? 'bg-blue-50 border-blue-300 text-blue-700 dark:bg-blue-900 dark:border-blue-700 dark:text-blue-300'
              : 'bg-gray-50 border-gray-300 text-gray-700 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
          }`}
        >
          <span className="text-sm">{emoji}</span>
          <span className="font-semibold text-xs">{data.count}</span>
        </button>
      ))}

      {/* Add reaction button - always visible like Teams */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className={`flex items-center gap-1 px-2 py-1 rounded-full border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all ${
            hasReactions ? 'bg-transparent' : 'bg-gray-50 dark:bg-gray-800'
          }`}
          title="Add reaction"
        >
          <FaceSmileIcon className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </button>

        {/* Reaction picker - Only 3 quick reactions */}
        {showPicker && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={() => setShowPicker(false)}
            />
            <div className="absolute bottom-full left-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 p-3 z-50">
              <div className="flex gap-1.5">
                {QUICK_REACTIONS.map((emoji) => (
                  <button
                    key={emoji}
                    onClick={() => handleQuickReaction(emoji)}
                    className="text-sm p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-all transform hover:scale-110"
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MessageReactions;
