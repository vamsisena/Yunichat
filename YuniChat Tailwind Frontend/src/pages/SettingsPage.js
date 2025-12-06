import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useThemeMode } from '../App';
import { Cog6ToothIcon, MoonIcon, SunIcon, BellIcon, ShieldCheckIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SettingsPage = () => {
  const { isDarkMode, toggleTheme } = useThemeMode();
  const navigate = useNavigate();

  const handleClose = () => {
    navigate('/chat');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500" onClick={(e) => e.stopPropagation()} style={{scrollbarWidth: 'thin'}}>
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Cog6ToothIcon className="w-6 h-6 text-primary-600 dark:text-primary-400" />
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
            </div>
            <button
              onClick={handleClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>
        </div>

        <div className="p-4">

          {/* Theme Setting */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              {isDarkMode ? <MoonIcon className="w-6 h-6" /> : <SunIcon className="w-6 h-6" />}
              Appearance
            </h2>
            <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-white">Dark Mode</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Switch between light and dark theme
                </p>
              </div>
              <button
                onClick={toggleTheme}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isDarkMode ? 'bg-primary-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isDarkMode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>
          </div>

          {/* Notifications Setting */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <BellIcon className="w-6 h-6" />
              Notifications
            </h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Push Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Receive desktop notifications for new messages
                  </p>
                </div>
                <button
                  onClick={() => {
                    if ('Notification' in window) {
                      Notification.requestPermission();
                    }
                  }}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                >
                  Enable
                </button>
              </div>
              <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">Sound Notifications</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Play sound when receiving messages
                  </p>
                </div>
                <button
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors bg-gray-300`}
                  disabled
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform translate-x-1`} />
                </button>
              </div>
            </div>
          </div>

          {/* Privacy Setting */}
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <ShieldCheckIcon className="w-6 h-6" />
              Privacy & Security
            </h2>
            <div className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white mb-2">Read Receipts</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Let others know when you've read their messages
                </p>
                <button
                  className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                  disabled
                >
                  Manage (Coming Soon)
                </button>
              </div>
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                <p className="font-medium text-gray-900 dark:text-white mb-2">Blocked Users</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  View and manage blocked users
                </p>
                <button
                  className="text-primary-600 dark:text-primary-400 hover:underline text-sm"
                  disabled
                >
                  Manage (Coming Soon)
                </button>
              </div>
            </div>
          </div>

          {/* About Section */}
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200 mb-4">About</h2>
            <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
              <p>
                <span className="font-medium">Version:</span> 1.0.0
              </p>
              <p>
                <span className="font-medium">Build:</span> {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
