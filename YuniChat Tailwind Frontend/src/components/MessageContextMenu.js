import React, { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, DocumentDuplicateIcon } from '@heroicons/react/24/outline';

const MessageContextMenu = ({
  anchorEl,
  open,
  onClose,
  message,
  currentUserId,
  onEdit,
  onDelete,
  onCopy,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editedContent, setEditedContent] = useState('');

  useEffect(() => {
    if (message?.content) {
      setEditedContent(message.content);
    }
  }, [message]);

  if (!open || !message) return null;

  const isOwnMessage = message?.senderId === currentUserId;
  const canEdit = isOwnMessage && !message?.isDeleted && message?.type === 'TEXT';
  const canDelete = isOwnMessage && !message?.isDeleted;

  const handleEdit = () => {
    setEditedContent(message?.content || '');
    setEditDialogOpen(true);
    onClose();
  };

  const handleDelete = () => {
    setDeleteDialogOpen(true);
    onClose();
  };

  const handleCopy = () => {
    if (message?.content) {
      onCopy(message.content);
    }
    onClose();
  };

  const handleEditConfirm = () => {
    if (message && editedContent.trim() && editedContent !== message?.content) {
      onEdit(message.id, editedContent.trim());
    }
    setEditDialogOpen(false);
  };

  const handleDeleteConfirm = () => {
    if (message) {
      onDelete(message.id);
    }
    setDeleteDialogOpen(false);
  };

  const position = anchorEl ? {
    top: anchorEl.getBoundingClientRect().top,
    left: anchorEl.getBoundingClientRect().left,
  } : { top: 0, left: 0 };

  return (
    <>
      {/* Context Menu */}
      <div className="fixed inset-0 z-[1350]" onClick={onClose}>
        <div
          className="absolute bg-white dark:bg-gray-800 rounded-lg shadow-xl py-2 min-w-[150px]"
          style={{ top: position.top, left: position.left }}
          onClick={(e) => e.stopPropagation()}
        >
          {canEdit && (
            <button
              onClick={handleEdit}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-200"
            >
              <PencilIcon className="w-4 h-4" />
              Edit
            </button>
          )}
          {canDelete && (
            <button
              onClick={handleDelete}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-red-600 dark:text-red-400"
            >
              <TrashIcon className="w-4 h-4" />
              Delete
            </button>
          )}
          {message?.content && (
            <button
              onClick={handleCopy}
              className="w-full flex items-center gap-2 px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 text-left text-gray-700 dark:text-gray-200"
            >
              <DocumentDuplicateIcon className="w-4 h-4" />
              Copy
            </button>
          )}
        </div>
      </div>

      {/* Edit Dialog */}
      {editDialogOpen && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/50" onClick={() => setEditDialogOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Edit Message</h3>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              rows={4}
              autoFocus
            />
            <div className="flex justify-end gap-2 mt-4">
              <button
                onClick={() => setEditDialogOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleEditConfirm}
                disabled={!editedContent.trim() || editedContent === message?.content}
                className="px-4 py-2 bg-primary-600 text-white hover:bg-primary-700 rounded disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deleteDialogOpen && (
        <div className="fixed inset-0 z-[1400] flex items-center justify-center bg-black/50" onClick={() => setDeleteDialogOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Delete Message?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              This action cannot be undone. Are you sure you want to delete this message?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeleteDialogOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
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

export default MessageContextMenu;
