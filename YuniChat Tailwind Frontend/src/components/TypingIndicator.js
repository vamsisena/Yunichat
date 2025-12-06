import React from 'react';

const TypingIndicator = ({ username }) => {
  return (
    <div className="flex items-center gap-2 py-2 px-4">
      <span className="text-sm text-gray-500 dark:text-gray-400 italic">
        {username || 'Someone'} is typing
      </span>
      <div className="flex gap-1 items-center">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-1.5 h-1.5 bg-primary-500 rounded-full animate-bounce"
            style={{
              animationDelay: `${i * 0.15}s`,
              animationDuration: '1s',
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default TypingIndicator;
