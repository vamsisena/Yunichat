import React from 'react';
import { CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { getAvatarColor } from '../utils/avatarUtils';

const FriendRequest = ({ request, onAccept, onDecline }) => {
  return (
    <div className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg">
      <div className="flex items-center gap-3">
        {request.senderAvatarUrl ? (
          <img src={request.senderAvatarUrl} alt={request.senderUsername} className="w-10 h-10 rounded-full" />
        ) : (
          <div className={`w-10 h-10 rounded-full ${getAvatarColor(request.senderUsername)} flex items-center justify-center text-white font-semibold`}>
            {request.senderUsername?.charAt(0).toUpperCase()}
          </div>
        )}
        <div>
          <div className="font-medium text-gray-900 dark:text-white">{request.senderUsername}</div>
          <div className="text-sm text-gray-500 dark:text-gray-400">wants to be your friend</div>
        </div>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => onAccept(request.id)}
          className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
          title="Accept"
        >
          <CheckIcon className="w-5 h-5" />
        </button>
        <button
          onClick={() => onDecline(request.id)}
          className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
          title="Decline"
        >
          <XMarkIcon className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default FriendRequest;
