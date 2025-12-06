import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ChevronDownIcon, ChevronUpIcon, MagnifyingGlassIcon, XMarkIcon, UserPlusIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import { loadUsers, searchUsers, clearSearchResults } from '../features/actions/userActions';
import { loadFriends, sendFriendRequest } from '../features/actions/friendActions';
import { showSnackbar } from '../features/actions/uiActions';
import { getAvatarColor } from '../utils/avatarUtils';
import useAuth from '../hooks/useAuth';
import UserActionPopup from './UserActionPopup';
import UserProfilePopup from './UserProfilePopup';

const UserList = () => {
  const dispatch = useDispatch();
  const { user, isGuest } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [orderBy, setOrderBy] = useState('random');
  const [searchExpanded, setSearchExpanded] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [actionPopupOpen, setActionPopupOpen] = useState(false);
  const [profilePopupOpen, setProfilePopupOpen] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  const storeData = useSelector((state) => {
    return {
      users: state?.users?.users || [],
      friends: state?.friends?.friends || [],
      friendRequests: state?.friends?.requests || [],
      sentRequests: state?.friends?.sentRequests || [],
      searchResults: state?.users?.searchResults || [],
      loading: state?.users?.loading || false,
      searching: state?.users?.searching || false,
      activeUsers: state?.chat?.activeUsers || [],
      _lastUpdate: state?.chat?._lastUpdate,
    };
  });

  const { users, friends, friendRequests, sentRequests, searchResults, loading, searching, activeUsers, _lastUpdate } = storeData;

  useEffect(() => {
    dispatch(loadUsers()).then(() => {
      setHasLoadedOnce(true);
    }).catch(() => {
      setHasLoadedOnce(true);
    });
    
    if (!isGuest) {
      dispatch(loadFriends());
    }
  }, [dispatch, isGuest, user?.id]);

  useEffect(() => {
    const handleOpenUserProfile = (event) => {
      const userId = event.detail?.userId;
      if (!userId) return;

      const userToView = users.find(u => u.id === userId) || activeUsers.find(u => u.id === userId);
      if (userToView) {
        setSelectedUser(userToView);
        setProfilePopupOpen(true);
      }
    };

    window.addEventListener('openUserProfile', handleOpenUserProfile);
    return () => window.removeEventListener('openUserProfile', handleOpenUserProfile);
  }, [users, activeUsers]);

  const handleSearchChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    
    if (query.trim().length >= 2) {
      dispatch(searchUsers(query));
    } else {
      dispatch(clearSearchResults());
    }
  };

  const filterActiveUsers = (usersList) => {
    const activeUserIds = activeUsers.map(u => u.id);
    return usersList.filter(u => activeUserIds.includes(u.id));
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    dispatch(clearSearchResults());
  };

  const handleUserClick = (userId) => {
    const clickedUser = filteredUsers.find(u => u.id === userId);
    setSelectedUser(clickedUser);
    setActionPopupOpen(true);
  };

  const handleViewProfile = (user) => {
    setSelectedUser(user);
    setActionPopupOpen(false);
    // Use setTimeout to ensure action popup closes first before opening profile popup
    setTimeout(() => {
      setProfilePopupOpen(true);
    }, 100);
  };

  const handleSendFriendRequest = async (userId, username) => {
    try {
      const result = await dispatch(sendFriendRequest(userId));
      if (result.success) {
        dispatch(showSnackbar(`Friend request sent to ${username}`, 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to send friend request', 'error'));
      }
    } catch (error) {
      console.error('Error sending friend request:', error);
      dispatch(showSnackbar('Failed to send friend request', 'error'));
    }
  };

  const getStatusColor = (userStatus) => {
    if (!userStatus) return 'bg-gray-400';
    const status = userStatus.toUpperCase();
    if (status === 'ONLINE') return 'bg-green-500';
    if (status === 'AWAY') return 'bg-yellow-500';
    if (status === 'BUSY') return 'bg-red-500';
    return 'bg-gray-400';
  };

  const isFriend = (userId) => {
    return friends.some((f) => f.id === userId);
  };

  const hasPendingRequest = (userId) => {
    const hasIncomingRequest = friendRequests.some((r) => r.senderId === userId || r.recipientId === userId);
    const hasSentRequest = sentRequests.some((r) => r.recipientId === userId);
    return hasIncomingRequest || hasSentRequest;
  };

  const filterAndSortUsers = (usersList) => {
    let filtered = usersList;
    
    if (filterType === 'registered') {
      filtered = filtered.filter(u => !u.isGuest);
    } else if (filterType === 'guest') {
      filtered = filtered.filter(u => u.isGuest);
    }
    
    if (orderBy === 'name') {
      filtered = [...filtered].sort((a, b) => 
        (a.username || '').localeCompare(b.username || '')
      );
    } else if (orderBy === 'recent') {
      filtered = [...filtered].sort((a, b) => 
        new Date(b.lastActive || 0) - new Date(a.lastActive || 0)
      );
    }
    
    return filtered;
  };

  const displayUsers = searchQuery.trim() ? filterActiveUsers(searchResults) : activeUsers;
  const filteredUsers = filterAndSortUsers(displayUsers)
    .filter(u => u.username !== 'admin')
    .filter(u => u.id != null)
    .filter(u => u.id !== user?.id);

  const onlineUsersCount = activeUsers.filter(u => 
    u.status?.toUpperCase() === 'ONLINE' && u.id !== user?.id
  ).length;

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-800">
      {/* Header with Search Toggle */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className={`flex items-center justify-between ${searchExpanded ? 'mb-4' : ''}`}>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Users</h2>
            <span className="bg-green-500 text-white rounded-xl px-2 py-0.5 text-xs font-semibold min-w-[24px] text-center">
              {onlineUsersCount}
            </span>
          </div>
          <button 
            onClick={() => setSearchExpanded(!searchExpanded)}
            className={`p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition-transform duration-300 ${searchExpanded ? 'rotate-180' : 'rotate-0'}`}
          >
            {searchExpanded ? <ChevronUpIcon className="w-5 h-5" /> : <ChevronDownIcon className="w-5 h-5" />}
          </button>
        </div>
        
        {/* Collapsible Search and Filters */}
        {searchExpanded && (
          <div>
            {/* Search Bar */}
            <div className="relative mb-4">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Username"
                value={searchQuery}
                onChange={handleSearchChange}
                className="input-field pl-10 pr-10"
              />
              {searchQuery && (
                <button
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                </button>
              )}
            </div>

            {/* Filters Row */}
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Type</label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="w-full input-field text-sm"
                >
                  <option value="all">All</option>
                  <option value="registered">Registered</option>
                  <option value="guest">Guest</option>
                </select>
              </div>

              <div className="flex-1">
                <label className="block text-xs text-gray-600 dark:text-gray-400 mb-1">Order by</label>
                <select
                  value={orderBy}
                  onChange={(e) => setOrderBy(e.target.value)}
                  className="w-full input-field text-sm"
                >
                  <option value="random">Random</option>
                  <option value="name">Name</option>
                  <option value="recent">Recent</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {(searching || (loading && !hasLoadedOnce)) ? (
          <div className="p-6 text-center flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-primary-200 border-t-primary-500 rounded-full animate-spin" />
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searching ? 'Searching...' : 'Loading users...'}
            </p>
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="p-6 text-center">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {searchQuery ? 'No users found matching your search' : 'No active users at the moment'}
            </p>
          </div>
        ) : (
          filteredUsers.map((listUser) => (
            <div
              key={`${listUser.id}-${listUser.status || 'unknown'}`}
              className="border-b border-gray-200 dark:border-gray-700"
            >
              <button 
                onClick={() => handleUserClick(listUser.id)}
                className="w-full py-3 px-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left flex items-center gap-3"
              >
                {/* Avatar with Status Badge */}
                <div className="relative flex-shrink-0">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-semibold ${
                      listUser.avatarUrl ? '' : getAvatarColor(listUser.gender)
                    }`}
                    style={listUser.avatarUrl ? {
                      backgroundImage: `url(${listUser.avatarUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center'
                    } : {}}
                  >
                    {!listUser.avatarUrl && (listUser.fullName?.charAt(0) || listUser.username?.charAt(0)?.toUpperCase() || '?')}
                  </div>
                  <span className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${getStatusColor(listUser.status)}`} />
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1 mb-0.5">
                    <span className="font-medium text-gray-900 dark:text-white truncate">
                      {listUser.username}
                    </span>
                    {listUser.isGuest === false && (
                      <CheckBadgeIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {listUser.isGuest === true && (
                      <span className="bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs px-2 py-0.5 rounded font-medium">
                        Guest
                      </span>
                    )}
                    {isFriend(listUser.id) && (
                      <span className="bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 text-xs px-2 py-0.5 rounded font-medium">
                        Friend
                      </span>
                    )}
                    {hasPendingRequest(listUser.id) && (
                      <span className="bg-yellow-100 dark:bg-yellow-900 text-yellow-700 dark:text-yellow-300 text-xs px-2 py-0.5 rounded font-medium">
                        Pending
                      </span>
                    )}
                  </div>
                </div>

                {/* Add Friend Button */}
                {!isGuest && listUser.isGuest === false && !isFriend(listUser.id) && !hasPendingRequest(listUser.id) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSendFriendRequest(listUser.id, listUser.username);
                    }}
                    className="p-2 text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900 rounded-full transition-colors flex-shrink-0"
                    title="Add Friend"
                  >
                    <UserPlusIcon className="w-5 h-5" />
                  </button>
                )}
              </button>
            </div>
          ))
        )}
      </div>

      {/* User Action Popup */}
      {selectedUser && (
        <UserActionPopup
          open={actionPopupOpen}
          onClose={() => {
            setActionPopupOpen(false);
            setSelectedUser(null);
          }}
          user={selectedUser}
          onViewProfile={handleViewProfile}
        />
      )}

      {/* User Profile Popup */}
      <UserProfilePopup
        open={profilePopupOpen}
        onClose={() => {
          setProfilePopupOpen(false);
          setSelectedUser(null);
        }}
        user={selectedUser}
      />
    </div>
  );
};

export default UserList;
