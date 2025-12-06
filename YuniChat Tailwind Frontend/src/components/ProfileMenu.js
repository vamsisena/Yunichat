import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../features/actions/authActions';
import { updateMyStatus } from '../features/actions/userActions';
import { UserCircleIcon, Cog6ToothIcon, ArrowRightOnRectangleIcon, CheckBadgeIcon } from '@heroicons/react/24/outline';
import useAuth from '../hooks/useAuth';

const ProfileMenu = ({ anchorEl, open, onClose }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  const [statusMenuOpen, setStatusMenuOpen] = useState(false);

  if (!open) return null;

  const currentStatus = user?.status || 'ONLINE';
  const displayName = user?.fullName || user?.username || 'User';

  const statusOptions = [
    { value: 'ONLINE', label: 'Online', color: 'bg-green-500' },
    { value: 'AWAY', label: 'Away', color: 'bg-yellow-500' },
    { value: 'BUSY', label: 'Busy', color: 'bg-red-500' },
  ];

  const getStatusColor = (status) => {
    const option = statusOptions.find(s => s.value === status);
    return option?.color || 'bg-gray-500';
  };

  const handleStatusChange = async (status, e) => {
    e.stopPropagation();
    console.log('🎯 User clicked status change to:', status);
    const result = await dispatch(updateMyStatus(status));
    if (result?.success) {
      console.log('✅ Status changed successfully to:', status);
    } else {
      console.error('❌ Status change failed:', result?.message);
    }
    setStatusMenuOpen(false);
  };

  const handleLogout = async (e) => {
    e.stopPropagation();
    console.log('🚪 ProfileMenu: Logout clicked');
    
    try {
      await dispatch(logout());
      console.log('✅ ProfileMenu: Logout successful, navigating to home');
      onClose();
      navigate('/');
    } catch (error) {
      console.error('❌ ProfileMenu: Logout error:', error);
      onClose();
      navigate('/');
    }
  };

  const handleProfile = (e) => {
    e.stopPropagation();
    console.log('📋 ProfileMenu: Profile clicked');
    onClose();
    navigate('/profile');
  };

  const handleSettings = (e) => {
    e.stopPropagation();
    console.log('⚙️ ProfileMenu: Settings clicked');
    onClose();
    navigate('/settings');
  };

  const toggleStatusMenu = (e) => {
    e.stopPropagation();
    setStatusMenuOpen(!statusMenuOpen);
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute top-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 w-56"
        onClick={(e) => e.stopPropagation()}
      >
        {/* User Info Header */}
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700 mb-1">
          <div className="flex items-center gap-1 font-medium text-gray-900 dark:text-white">
            <span className="truncate">{user?.username || displayName}</span>
            {!isGuest && (
              <CheckBadgeIcon className="w-4 h-4 text-primary-500 flex-shrink-0" />
            )}
          </div>
          {user?.fullName && user.fullName !== user.username && (
            <div className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.fullName}</div>
          )}
        </div>

        <button 
          onClick={handleProfile}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-gray-700 dark:text-gray-200"
        >
          <UserCircleIcon className="w-5 h-5" />
          Profile
        </button>
        <button 
          onClick={handleSettings}
          className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 text-gray-700 dark:text-gray-200"
        >
          <Cog6ToothIcon className="w-5 h-5" />
          Settings
        </button>
        
        <hr className="my-1 border-gray-200 dark:border-gray-700" />
        
        {/* Status Selection */}
        <div className="px-2 py-1">
          <div className="text-xs font-semibold text-gray-500 dark:text-gray-400 px-2 py-1">Status</div>
          {statusOptions.map((status) => (
            <button
              key={status.value}
              onClick={(e) => handleStatusChange(status.value, e)}
              className={`w-full text-left px-3 py-1.5 rounded flex items-center gap-2 text-sm ${
                status.value === currentStatus
                  ? 'bg-gray-100 dark:bg-gray-700 font-semibold'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
              } text-gray-700 dark:text-gray-200`}
            >
              <span className={`w-3 h-3 rounded-full ${status.color}`} />
              {status.label}
            </button>
          ))}
        </div>
        
        <hr className="my-1 border-gray-200 dark:border-gray-700" />
        <button 
          onClick={handleLogout}
          className="w-full text-left px-4 py-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded flex items-center gap-2 text-red-600 dark:text-red-400"
        >
          <ArrowRightOnRectangleIcon className="w-5 h-5" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ProfileMenu;
