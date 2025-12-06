import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, UserPlusIcon, UserMinusIcon, CalendarIcon, MapPinIcon, GlobeAltIcon, LanguageIcon } from '@heroicons/react/24/outline';
import { getAvatarColor } from '../utils/avatarUtils';
import { sendFriendRequest, removeFriend, loadFriends } from '../features/actions/friendActions';
import { showSnackbar } from '../features/actions/uiActions';
import useAuth from '../hooks/useAuth';
import userApi from '../api/userApi';

const UserProfilePopup = ({ open, onClose, user }) => {
  const dispatch = useDispatch();
  const { user: currentUser, isGuest } = useAuth();
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isIgnored, setIsIgnored] = useState(false);

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
    const fetchUserProfile = async () => {
      if (open && user?.id) {
        setLoading(true);
        try {
          const response = await userApi.getUserById(user.id);
          setUserProfile(response.data.data);
        } catch (error) {
          console.error('Failed to fetch user profile:', error);
          setUserProfile(user);
        } finally {
          setLoading(false);
        }
      }
    };
    fetchUserProfile();
  }, [open, user]);

  useEffect(() => {
    const checkIgnoreStatus = async () => {
      if (open && user?.id && !isGuest && currentUser?.id !== user?.id) {
        try {
          const response = await userApi.checkIgnoreStatus(user.id);
          setIsIgnored(response.data?.data || false);
        } catch (error) {
          console.error('Failed to check ignore status:', error);
          setIsIgnored(false);
        }
      }
    };
    checkIgnoreStatus();
  }, [open, user?.id, isGuest, currentUser?.id]);

  useEffect(() => {
    if (open && !isGuest) {
      dispatch(loadFriends());
    }
  }, [open, isGuest, dispatch]);

  if (!open || !user) return null;

  const displayUser = userProfile || user;

  const handleAddFriend = async () => {
    const result = await dispatch(sendFriendRequest(user.id));
    if (result.success) {
      dispatch(showSnackbar('Friend request sent', 'success'));
    } else {
      dispatch(showSnackbar(result.message || 'Failed to send friend request', 'error'));
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

  const formatDate = (dateString) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-sm max-h-[85vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-3 rounded-t-xl">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white">User Profile</h3>
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500"></div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
            {/* Avatar */}
            <div
              className={`w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-semibold ${
                displayUser.avatarUrl ? '' : getAvatarColor(displayUser.gender)
              }`}
              style={displayUser.avatarUrl ? {
                backgroundImage: `url(${displayUser.avatarUrl})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              } : {}}
            >
              {!displayUser.avatarUrl && (displayUser.fullName?.charAt(0) || displayUser.username?.charAt(0)?.toUpperCase() || '?')}
            </div>

            {/* User Info */}
            <div className="text-center w-full">
              <h4 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">{displayUser.username}</h4>
              {displayUser.fullName && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{displayUser.fullName}</p>
              )}
              <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                displayUser.status === 'online' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                displayUser.status === 'away' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                displayUser.status === 'busy' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
              }`}>
                {displayUser.status ? displayUser.status.charAt(0).toUpperCase() + displayUser.status.slice(1) : 'Offline'}
              </span>
            </div>

            {/* Bio */}
            {displayUser.bio && (
              <div className="w-full p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <p className="text-gray-700 dark:text-gray-300 text-xs">{displayUser.bio}</p>
              </div>
            )}

            {/* Details */}
            <div className="w-full space-y-2">
              {displayUser.email && (
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">Email</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs break-all">{displayUser.email}</span>
                </div>
              )}
              {displayUser.age && (
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">Age</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{displayUser.age}</span>
                </div>
              )}
              {displayUser.gender && (
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">Gender</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs capitalize">{displayUser.gender}</span>
                </div>
              )}
              {displayUser.country && (
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <MapPinIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">Country</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{displayUser.country}</span>
                </div>
              )}
              {displayUser.languages && displayUser.languages.length > 0 && (
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <LanguageIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">Languages</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{displayUser.languages.join(', ')}</span>
                </div>
              )}
              {displayUser.createdAt && (
                <div className="flex items-center gap-2 py-1.5 border-b border-gray-200 dark:border-gray-700">
                  <CalendarIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">Member Since</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{formatDate(displayUser.createdAt)}</span>
                </div>
              )}
              {displayUser.lastSeen && (
                <div className="flex items-center gap-2 py-1.5">
                  <GlobeAltIcon className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[80px]">Last Seen</span>
                  <span className="font-medium text-gray-900 dark:text-white text-xs">{formatDate(displayUser.lastSeen)}</span>
                </div>
              )}
            </div>

            {/* Friend Actions - Only show for non-guests and not for current user */}
            {!isGuest && currentUser?.id !== user?.id && !isIgnored && (
              <div className="w-full pt-3 border-t border-gray-200 dark:border-gray-700">
                {isFriend ? (
                  <button
                    onClick={handleRemoveFriend}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white text-sm rounded-lg transition-colors"
                  >
                    <UserMinusIcon className="w-4 h-4" />
                    <span>Remove Friend</span>
                  </button>
                ) : sentRequest ? (
                  <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-600 dark:text-gray-400 text-sm rounded-lg cursor-not-allowed"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Request Sent</span>
                  </button>
                ) : (
                  <button
                    onClick={handleAddFriend}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white text-sm rounded-lg transition-colors"
                  >
                    <UserPlusIcon className="w-4 h-4" />
                    <span>Add Friend</span>
                  </button>
                )}
              </div>
            )}

            {isIgnored && !isGuest && currentUser?.id !== user?.id && (
              <div className="w-full p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                <p className="text-yellow-800 dark:text-yellow-400 text-xs text-center">You have ignored this user</p>
              </div>
            )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default UserProfilePopup;
