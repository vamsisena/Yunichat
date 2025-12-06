import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, ChatBubbleLeftIcon, UserPlusIcon, UserMinusIcon, CheckIcon, ClockIcon } from '@heroicons/react/24/outline';
import { getAvatarColor } from '../utils/avatarUtils';
import { sendFriendRequest, acceptFriendRequest, declineFriendRequest, removeFriend } from '../features/actions/friendActions';
import { showSnackbar } from '../features/actions/uiActions';
import useAuth from '../hooks/useAuth';

const UserProfileSidebar = ({ user, open, onClose, onStartChat }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useAuth();
  const [loading, setLoading] = useState(false);

  const storeData = useSelector((state) => ({
    friends: state?.friends?.friends || [],
    friendRequests: state?.friends?.requests || [],
    sentRequests: state?.friends?.sentRequests || [],
  }));

  const { friends, friendRequests, sentRequests } = storeData;

  if (!open || !user) return null;

  const isOnline = user.status === 'ONLINE';
  const isFriend = friends.some(f => f.id === user.id || f.friendId === user.id);
  const incomingRequest = friendRequests.find(r => r.senderId === user.id);
  const sentRequest = sentRequests.find(r => r.recipientId === user.id);
  const hasPendingRequest = !!incomingRequest || !!sentRequest;

  const handleAddFriend = async () => {
    setLoading(true);
    try {
      const result = await dispatch(sendFriendRequest(user.id));
      if (result.success) {
        dispatch(showSnackbar('Friend request sent', 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to send friend request', 'error'));
      }
    } catch (error) {
      dispatch(showSnackbar('Failed to send friend request', 'error'));
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    if (!incomingRequest) return;
    setLoading(true);
    try {
      const result = await dispatch(acceptFriendRequest(incomingRequest.id));
      if (result.success) {
        dispatch(showSnackbar('Friend request accepted', 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to accept request', 'error'));
      }
    } catch (error) {
      dispatch(showSnackbar('Failed to accept request', 'error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeclineRequest = async () => {
    if (!incomingRequest) return;
    setLoading(true);
    try {
      const result = await dispatch(declineFriendRequest(incomingRequest.id));
      if (result.success) {
        dispatch(showSnackbar('Friend request declined', 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to decline request', 'error'));
      }
    } catch (error) {
      dispatch(showSnackbar('Failed to decline request', 'error'));
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFriend = async () => {
    setLoading(true);
    try {
      const result = await dispatch(removeFriend(user.id));
      if (result.success) {
        dispatch(showSnackbar('Friend removed', 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to remove friend', 'error'));
      }
    } catch (error) {
      dispatch(showSnackbar('Failed to remove friend', 'error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/50" onClick={onClose} />
      <div className="fixed right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 shadow-xl z-50 transform transition-transform duration-300">
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Profile</h2>
            <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <XMarkIcon className="w-6 h-6 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* User Info */}
          <div className="flex-1 overflow-auto">
            <div className="p-6 flex flex-col items-center">
              <div className="relative mb-4">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.username} className="w-24 h-24 rounded-full" />
                ) : (
                  <div className={`w-24 h-24 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white text-3xl font-semibold`}>
                    {user.username?.charAt(0).toUpperCase()}
                  </div>
                )}
                {isOnline && (
                  <span className="absolute bottom-1 right-1 w-5 h-5 bg-green-500 rounded-full border-4 border-white dark:border-gray-800" />
                )}
              </div>

              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{user.username}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">{isOnline ? 'Online' : 'Offline'}</p>

              {/* Action Buttons */}
              <div className="flex flex-col gap-2 mb-6 w-full">
                <button
                  onClick={() => onStartChat(user.id)}
                  className="flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <ChatBubbleLeftIcon className="w-5 h-5" />
                  Chat
                </button>
                
                {incomingRequest ? (
                  <div className="flex gap-2">
                    <button
                      onClick={handleAcceptRequest}
                      disabled={loading}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      <CheckIcon className="w-5 h-5" />
                      Accept
                    </button>
                    <button
                      onClick={handleDeclineRequest}
                      disabled={loading}
                      className="flex-1 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      Decline
                    </button>
                  </div>
                ) : isFriend ? (
                  <button
                    onClick={handleRemoveFriend}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-red-600 border border-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserMinusIcon className="w-5 h-5" />
                    Remove Friend
                  </button>
                ) : sentRequest ? (
                  <button
                    disabled
                    className="flex items-center justify-center gap-2 px-4 py-2 text-gray-500 border border-gray-300 dark:border-gray-600 rounded-lg cursor-not-allowed"
                  >
                    <ClockIcon className="w-5 h-5" />
                    Request Pending
                  </button>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    disabled={loading}
                    className="flex items-center justify-center gap-2 px-4 py-2 text-primary-600 border border-primary-600 rounded-lg hover:bg-primary-50 dark:hover:bg-primary-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                    Add Friend
                  </button>
                )}
              </div>

              {/* User Details */}
              <div className="w-full space-y-4">
                {user.email && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                    <p className="text-gray-900 dark:text-white">{user.email}</p>
                  </div>
                )}
                {user.bio && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Bio</label>
                    <p className="text-gray-900 dark:text-white">{user.bio}</p>
                  </div>
                )}
                {user.age && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Age</label>
                    <p className="text-gray-900 dark:text-white">{user.age}</p>
                  </div>
                )}
                {user.gender && (
                  <div>
                    <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Gender</label>
                    <p className="text-gray-900 dark:text-white">{user.gender}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfileSidebar;
