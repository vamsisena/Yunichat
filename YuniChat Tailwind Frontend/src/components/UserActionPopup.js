import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, ChatBubbleLeftIcon, UserIcon, UserPlusIcon, CheckIcon, UserMinusIcon, NoSymbolIcon } from '@heroicons/react/24/outline';
import { setActiveChatWindow } from '../features/actions/chatActions';
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '../features/actions/friendActions';
import { showSnackbar } from '../features/actions/uiActions';
import useAuth from '../hooks/useAuth';
import userApi from '../api/userApi';

const UserActionPopup = ({ open, onClose, user, onViewProfile }) => {
  const dispatch = useDispatch();
  const { user: currentUser, isGuest } = useAuth();
  const [isIgnored, setIsIgnored] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const storeData = useSelector((state) => ({
    friends: state?.friends?.friends || [],
    friendRequests: state?.friends?.requests || [],
    sentRequests: state?.friends?.sentRequests || [],
  }));

  const { friends, friendRequests, sentRequests } = storeData;

  const isFriend = friends.some(f => f.id === user?.id || f.friendId === user?.id);
  const incomingRequest = friendRequests.find(r => r.senderId === user?.id);
  const sentRequest = sentRequests.find(r => r.recipientId === user?.id);

  useEffect(() => {
    const checkIgnoreStatus = async () => {
      if (open && user?.id && !isGuest && currentUser?.id !== user?.id) {
        setCheckingStatus(true);
        try {
          const response = await userApi.checkIgnoreStatus(user.id);
          setIsIgnored(response.data?.data || false);
        } catch (error) {
          console.error('Failed to check ignore status:', error);
          setIsIgnored(false);
        } finally {
          setCheckingStatus(false);
        }
      }
    };
    checkIgnoreStatus();
  }, [open, user?.id, isGuest, currentUser?.id]);

  if (!open || !user) return null;

  const handleStartChat = () => {
    dispatch(setActiveChatWindow(user.id));
    onClose();
  };

  const handleViewProfile = () => {
    onViewProfile(user);
  };

  const handleSendRequest = async () => {
    const result = await dispatch(sendFriendRequest(user.id));
    if (result.success) {
      dispatch(showSnackbar('Friend request sent', 'success'));
    } else {
      dispatch(showSnackbar(result.message || 'Failed to send friend request', 'error'));
    }
  };

  const handleAcceptRequest = async () => {
    if (incomingRequest) {
      const result = await dispatch(acceptFriendRequest(incomingRequest.id));
      if (result.success) {
        dispatch(showSnackbar('Friend request accepted', 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to accept request', 'error'));
      }
    }
  };

  const handleDeclineRequest = async () => {
    if (incomingRequest) {
      const result = await dispatch(declineFriendRequest(incomingRequest.id));
      if (result.success) {
        dispatch(showSnackbar('Friend request declined', 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to decline request', 'error'));
      }
    }
  };

  const handleRemoveFriend = async () => {
    const result = await dispatch(removeFriend(user.id));
    if (result.success) {
      dispatch(showSnackbar('Friend removed', 'success'));
    } else {
      dispatch(showSnackbar(result.message || 'Failed to remove friend', 'error'));
    }
  };

  const handleIgnore = async () => {
    try {
      await userApi.ignoreUser(user.id);
      dispatch(showSnackbar(`Successfully ignored ${user.username}`, 'success'));
      setIsIgnored(true);
    } catch (error) {
      console.error('Failed to ignore user:', error);
      dispatch(showSnackbar('Failed to ignore user', 'error'));
    }
  };

  const handleUnignore = async () => {
    try {
      await userApi.unignoreUser(user.id);
      dispatch(showSnackbar(`Successfully unignored ${user.username}`, 'success'));
      setIsIgnored(false);
    } catch (error) {
      console.error('Failed to unignore user:', error);
      dispatch(showSnackbar('Failed to unignore user', 'error'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{user.username}</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <XMarkIcon className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-2">
          {/* Start Chat */}
          <button
            onClick={handleStartChat}
            className="flex items-center gap-2 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ChatBubbleLeftIcon className="w-5 h-5 text-primary-500" />
            <span className="text-gray-700 dark:text-gray-300">Start Chat</span>
          </button>

          {/* View Profile */}
          <button
            onClick={handleViewProfile}
            className="flex items-center gap-2 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <UserIcon className="w-5 h-5 text-primary-500" />
            <span className="text-gray-700 dark:text-gray-300">View Profile</span>
          </button>

          {/* Friend Actions - Only show for non-guests and not for current user */}
          {!isGuest && currentUser?.id !== user?.id && (
            <>
              {/* Incoming Friend Request */}
              {incomingRequest ? (
                <>
                  <button
                    onClick={handleAcceptRequest}
                    className="flex items-center gap-2 w-full p-3 text-left hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors text-green-600 dark:text-green-400"
                  >
                    <CheckIcon className="w-5 h-5" />
                    <span>Accept Request</span>
                  </button>
                  <button
                    onClick={handleDeclineRequest}
                    className="flex items-center gap-2 w-full p-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                  >
                    <XMarkIcon className="w-5 h-5" />
                    <span>Decline Request</span>
                  </button>
                </>
              ) : sentRequest ? (
                /* Sent Friend Request (Pending) */
                <button
                  disabled
                  className="flex items-center gap-2 w-full p-3 rounded-lg opacity-50 cursor-not-allowed text-gray-500 dark:text-gray-400"
                >
                  <UserPlusIcon className="w-5 h-5" />
                  <span>Request Sent</span>
                </button>
              ) : isFriend ? (
                /* Already Friends - Show Remove Option */
                <button
                  onClick={handleRemoveFriend}
                  className="flex items-center gap-2 w-full p-3 text-left hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors text-red-600 dark:text-red-400"
                >
                  <UserMinusIcon className="w-5 h-5" />
                  <span>Remove Friend</span>
                </button>
              ) : (
                /* Not Friends - Show Add Friend */
                <button
                  onClick={handleSendRequest}
                  className="flex items-center gap-2 w-full p-3 text-left hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <UserPlusIcon className="w-5 h-5 text-primary-500" />
                  <span className="text-gray-700 dark:text-gray-300">Add Friend</span>
                </button>
              )}

              {/* Ignore/Unignore */}
              {checkingStatus ? (
                <button
                  disabled
                  className="flex items-center gap-2 w-full p-3 rounded-lg opacity-50 cursor-wait text-gray-500 dark:text-gray-400"
                >
                  <NoSymbolIcon className="w-5 h-5" />
                  <span>Checking...</span>
                </button>
              ) : isIgnored ? (
                <button
                  onClick={handleUnignore}
                  className="flex items-center gap-2 w-full p-3 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors text-yellow-600 dark:text-yellow-400"
                >
                  <NoSymbolIcon className="w-5 h-5" />
                  <span>Unignore</span>
                </button>
              ) : (
                <button
                  onClick={handleIgnore}
                  className="flex items-center gap-2 w-full p-3 text-left hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded-lg transition-colors text-yellow-600 dark:text-yellow-400"
                >
                  <NoSymbolIcon className="w-5 h-5" />
                  <span>Ignore</span>
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserActionPopup;
