import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChatBubbleLeftIcon, UserMinusIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { loadFriends, loadFriendRequests, removeFriend, acceptFriendRequest, declineFriendRequest } from '../features/actions/friendActions';
import { showSnackbar } from '../features/actions/uiActions';
import { setActiveChatWindow } from '../features/actions/chatActions';
import { getAvatarColor } from '../utils/avatarUtils';
import useAuth from '../hooks/useAuth';

const FriendList = ({ onClose }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [tabValue, setTabValue] = useState(0);
  const [removeDialogOpen, setRemoveDialogOpen] = useState(false);
  const [selectedFriend, setSelectedFriend] = useState(null);

  const storeData = useSelector((state) => ({
    friends: state?.friends?.friends || [],
    friendRequests: state?.friends?.requests || [],
  }));

  const { friends, friendRequests } = storeData;

  useEffect(() => {
    if (!user?.isGuest) {
      dispatch(loadFriends());
      dispatch(loadFriendRequests());
    }
  }, [dispatch, user?.isGuest]);

  const handleChatClick = (friend) => {
    dispatch(setActiveChatWindow(friend.id));
    if (onClose) onClose();
  };

  const handleRemoveClick = (friend) => {
    setSelectedFriend(friend);
    setRemoveDialogOpen(true);
  };

  const handleRemoveConfirm = async () => {
    if (selectedFriend) {
      const result = await dispatch(removeFriend(selectedFriend.id));
      if (result.success) {
        dispatch(showSnackbar('Friend removed', 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to remove friend', 'error'));
      }
    }
    setRemoveDialogOpen(false);
    setSelectedFriend(null);
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await dispatch(acceptFriendRequest(requestId));
    if (result.success) {
      dispatch(showSnackbar('Friend request accepted', 'success'));
    } else {
      dispatch(showSnackbar(result.message || 'Failed to accept request', 'error'));
    }
  };

  const handleDeclineRequest = async (requestId) => {
    const result = await dispatch(declineFriendRequest(requestId));
    if (result.success) {
      dispatch(showSnackbar('Friend request declined', 'success'));
    } else {
      dispatch(showSnackbar(result.message || 'Failed to decline request', 'error'));
    }
  };

  const isOnline = (status) => status === 'ONLINE';
  const pendingRequests = friendRequests.filter((req) => req.recipientId === user?.id);

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Friends</h2>
      </div>

      <div className="flex border-b border-gray-200 dark:border-gray-700">
        <button
          onClick={() => setTabValue(0)}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            tabValue === 0
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          All Friends ({friends.length})
        </button>
        <button
          onClick={() => setTabValue(1)}
          className={`flex-1 py-3 px-4 text-center font-medium ${
            tabValue === 1
              ? 'text-primary-600 border-b-2 border-primary-600'
              : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          Requests ({pendingRequests.length})
        </button>
      </div>

      <div className="flex-1 overflow-auto">
        {tabValue === 0 && (
          <div>
            {friends.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No friends yet</p>
              </div>
            ) : (
              friends.map((friend) => (
                <div key={friend.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      {friend.avatarUrl ? (
                        <img src={friend.avatarUrl} alt={friend.username} className="w-10 h-10 rounded-full" />
                      ) : (
                        <div className={`w-10 h-10 rounded-full ${getAvatarColor(friend.username)} flex items-center justify-center text-white font-semibold`}>
                          {friend.username?.charAt(0).toUpperCase()}
                        </div>
                      )}
                      {isOnline(friend.status) && (
                        <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-800" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{friend.username}</div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">{isOnline(friend.status) ? 'Online' : 'Offline'}</div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleChatClick(friend)}
                      className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full"
                      title="Chat"
                    >
                      <ChatBubbleLeftIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleRemoveClick(friend)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                      title="Remove"
                    >
                      <UserMinusIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {tabValue === 1 && (
          <div>
            {pendingRequests.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">No pending requests</p>
              </div>
            ) : (
              pendingRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full ${getAvatarColor(request.senderUsername)} flex items-center justify-center text-white font-semibold`}>
                      {request.senderUsername?.charAt(0).toUpperCase()}
                    </div>
                    <div className="font-medium text-gray-900 dark:text-white">{request.senderUsername}</div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptRequest(request.id)}
                      className="p-2 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-full"
                      title="Accept"
                    >
                      <CheckIcon className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => handleDeclineRequest(request.id)}
                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full"
                      title="Decline"
                    >
                      <XMarkIcon className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {removeDialogOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setRemoveDialogOpen(false)}>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-sm mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Remove Friend?</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to remove {selectedFriend?.username} from your friends?
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRemoveDialogOpen(false)}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRemoveConfirm}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendList;
