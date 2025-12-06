import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TrashIcon } from '@heroicons/react/24/outline';
import { clearPrivateMessages, setActiveChatWindow } from '../features/actions/chatActions';
import { getAvatarColor } from '../utils/avatarUtils';
import MentionRenderer from './MentionRenderer';

const Messages = ({ anchorEl, open, onClose }) => {
  const dispatch = useDispatch();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const storeData = useSelector((state) => {
    return {
      privateMessages: state?.chat?.privateMessages || {},
      users: state?.users?.users || [],
    };
  });

  const { privateMessages, users } = storeData;

  if (!open) return null;

  const getUserById = (userId) => {
    return users.find(u => u.id === Number(userId));
  };

  const hasUnread = (userId) => {
    const messages = privateMessages[userId] || [];
    return messages.some(msg => !msg.read && msg.senderId !== msg.recipientId);
  };

  const getConversations = () => {
    return Object.keys(privateMessages)
      .filter(userId => privateMessages[userId]?.length > 0)
      .map(userId => ({
        userId: Number(userId),
        user: getUserById(Number(userId)),
        lastMessage: privateMessages[userId][privateMessages[userId].length - 1],
        hasUnread: hasUnread(Number(userId)),
      }))
      .filter(conv => conv.user != null)
      .sort((a, b) => new Date(b.lastMessage.timestamp) - new Date(a.lastMessage.timestamp));
  };

  const conversations = getConversations();

  const handleOpenConversation = (userId) => {
    dispatch(setActiveChatWindow(userId));
    onClose();
  };

  const handleDeleteClick = (userId, event) => {
    event.stopPropagation();
    setSelectedUserId(userId);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = () => {
    if (selectedUserId) {
      dispatch(clearPrivateMessages(selectedUserId));
    }
    setDeleteDialogOpen(false);
    setSelectedUserId(null);
    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50" onClick={onClose}>
        <div className="absolute top-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl w-80 max-h-96 flex flex-col" onClick={(e) => e.stopPropagation()}>
          <div className="p-4 bg-primary-600 text-white rounded-t-lg">
            <h3 className="text-lg font-semibold">Private Messages</h3>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="p-6 text-center">
                <p className="text-gray-500 dark:text-gray-400 text-sm">No private conversations yet</p>
              </div>
            ) : (
              <div>
                {conversations.map((conv) => (
                  <div
                    key={conv.userId}
                    onClick={() => handleOpenConversation(conv.userId)}
                    className="p-4 border-b border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                  >
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(conv.user?.username)} flex items-center justify-center text-white font-semibold flex-shrink-0`}>
                      {conv.user?.username?.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-gray-900 dark:text-white truncate">{conv.user?.username}</p>
                        {conv.hasUnread && (
                          <span className="w-2 h-2 bg-primary-600 rounded-full flex-shrink-0"></span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 truncate">
                        {conv.lastMessage?.content ? (
                          <MentionRenderer 
                            text={conv.lastMessage.content} 
                            className="truncate"
                            showTooltip={false}
                          />
                        ) : 'New message'}
                      </div>
                    </div>
                    <button
                      onClick={(e) => handleDeleteClick(conv.userId, e)}
                      className="p-2 hover:bg-gray-200 dark:hover:bg-gray-600 rounded flex-shrink-0"
                    >
                      <TrashIcon className="w-4 h-4 text-red-600 dark:text-red-400" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setDeleteDialogOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Delete Conversation?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to delete this conversation? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Messages;
