import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { MagnifyingGlassIcon, UserPlusIcon } from '@heroicons/react/24/outline';
import { searchUsers } from '../features/actions/userActions';
import { sendFriendRequest } from '../features/actions/friendActions';
import { showSnackbar } from '../features/actions/uiActions';
import { getAvatarColor } from '../utils/avatarUtils';

const FriendSearch = ({ onClose }) => {
  const dispatch = useDispatch();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sentRequests, setSentRequests] = useState(new Set());

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setSearching(true);
    try {
      const result = await dispatch(searchUsers(searchQuery.trim()));
      if (result.success) {
        setSearchResults(result.data || []);
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

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-xl">
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Find Friends</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            placeholder="Search by username or email..."
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
          <button
            onClick={handleSearch}
            disabled={searching || !searchQuery.trim()}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <MagnifyingGlassIcon className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-auto">
        {searchResults.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-500 dark:text-gray-400">
              {searching ? 'Searching...' : 'Search for users to add as friends'}
            </p>
          </div>
        ) : (
          searchResults.map((user) => (
            <div key={user.id} className="flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
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
                  <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
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
          ))
        )}
      </div>
    </div>
  );
};

export default FriendSearch;
