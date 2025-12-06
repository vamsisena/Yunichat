import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, MagnifyingGlassIcon, UserPlusIcon, UserGroupIcon, UsersIcon, BellIcon } from '@heroicons/react/24/outline';
import { searchUsers } from '../features/actions/userActions';
import { sendFriendRequest, loadFriends, loadFriendRequests, acceptFriendRequest, declineFriendRequest } from '../features/actions/friendActions';
import { showSnackbar } from '../features/actions/uiActions';
import { getAvatarColor } from '../utils/avatarUtils';
import useAuth from '../hooks/useAuth';
import FriendList from './FriendList';

const AddFriendDialog = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { user: currentUser } = useAuth();
  const [activeTab, setActiveTab] = useState(0); // 0: My Friends, 1: Find Friends, 2: Requests
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  const { friendRequests } = useSelector((state) => ({
    friendRequests: state?.friends?.requests || [],
  }));

  const pendingRequests = friendRequests.filter((req) => req.recipientId === currentUser?.id);

  useEffect(() => {
    if (open) {
      dispatch(loadFriends());
      dispatch(loadFriendRequests());
    }
  }, [dispatch, open]);

  if (!open) return null;

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setSearching(true);
    try {
      const result = await dispatch(searchUsers(searchQuery.trim()));
      if (result.success) {
        // Filter out current user from search results
        const filteredResults = (result.data || []).filter(user => user.id !== currentUser?.id);
        setSearchResults(filteredResults);
        
        // Show message if only current user was found
        if (result.data?.length > 0 && filteredResults.length === 0) {
          dispatch(showSnackbar('You cannot add yourself as a friend', 'info'));
        }
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setSearching(false);
    }
  };

  const handleSendRequest = async (userId) => {
    const result = await dispatch(sendFriendRequest(userId));
    if (result.success) {
      dispatch(showSnackbar('Friend request sent', 'success'));
      setSentRequests(new Set([...sentRequests, userId]));
    } else {
      dispatch(showSnackbar(result.message || 'Failed to send request', 'error'));
    }
  };

  const handleAcceptRequest = async (requestId) => {
    const result = await dispatch(acceptFriendRequest(requestId));
    if (result.success) {
      dispatch(showSnackbar('Friend request accepted', 'success'));
      dispatch(loadFriends());
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

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Friends</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab(0)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 0
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UserGroupIcon className="w-5 h-5" />
            My Friends
          </button>
          <button
            onClick={() => setActiveTab(1)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 1
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <UsersIcon className="w-5 h-5" />
            Find Friends
          </button>
          <button
            onClick={() => setActiveTab(2)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors relative ${
              activeTab === 2
                ? 'text-primary-600 dark:text-primary-400 border-b-2 border-primary-600 dark:border-primary-400'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <BellIcon className="w-5 h-5" />
            Requests
            {pendingRequests.length > 0 && (
              <span className="absolute top-2 right-8 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {pendingRequests.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {/* Tab 0: My Friends */}
          {activeTab === 0 && (
            <div className="h-full overflow-hidden">
              <FriendList onClose={onClose} />
            </div>
          )}

          {/* Tab 1: Find Friends */}
          {activeTab === 1 && (
            <div className="p-4">
              {/* Search Input */}
              <div className="mb-4">
                <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Search by username or email..."
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
            />
                  <button
                    onClick={handleSearch}
                    disabled={searching || !searchQuery.trim()}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <MagnifyingGlassIcon className="w-5 h-5" />
                    {searching ? 'Searching...' : 'Search'}
                  </button>
                </div>
              </div>

              {/* Search Results */}
              <div>
          {searchResults.length === 0 ? (
            <div className="p-8 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                {searching ? 'Searching...' : searchQuery ? 'No users found' : 'Search for users to add as friends'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200 dark:divide-gray-700">
              {searchResults.map((user) => (
                <div key={user.id} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-700">
                  <div className="flex items-center gap-3">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.username} className="w-10 h-10 rounded-full" />
                    ) : (
                      <div className={`w-10 h-10 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white font-semibold`}>
                        {user.username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-gray-900 dark:text-white">{user.username}</div>
                      {user.email && <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleSendRequest(user.id)}
                    disabled={sentRequests.has(user.id)}
                    className="p-2 text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
                    title={sentRequests.has(user.id) ? 'Request sent' : 'Send request'}
                  >
                    <UserPlusIcon className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          )}
              </div>
            </div>
          )}

          {/* Tab 2: Requests */}
          {activeTab === 2 && (
            <div className="p-4">
              <h4 className="text-base font-semibold text-gray-900 dark:text-white mb-4">Pending Friend Requests</h4>
              {pendingRequests.length === 0 ? (
                <div className="py-12 text-center text-gray-500 dark:text-gray-400">
                  <BellIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No pending requests</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingRequests.map((request) => (
                    <div key={request.id} className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          {request.sender?.avatarUrl ? (
                            <img src={request.sender.avatarUrl} alt={request.sender.username} className="w-10 h-10 rounded-full" />
                          ) : (
                            <div className={`w-10 h-10 rounded-full ${getAvatarColor(request.sender?.username || '')} flex items-center justify-center text-white font-semibold`}>
                              {request.sender?.username?.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-medium text-gray-900 dark:text-white">{request.sender?.username}</div>
                            {request.sender?.email && <div className="text-sm text-gray-500 dark:text-gray-400">{request.sender.email}</div>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleAcceptRequest(request.id)}
                            className="px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Accept
                          </button>
                          <button
                            onClick={() => handleDeclineRequest(request.id)}
                            className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white text-sm rounded-lg transition-colors"
                          >
                            Decline
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddFriendDialog;
