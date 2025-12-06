/**
 * Call Status Notification
 * Shows brief notifications for call events (rejected, busy, ended, failed)
 */

import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { XMarkIcon } from '@heroicons/react/24/solid';
import { clearCall } from '../features/reducers/callReducer';

const CallStatusNotification = () => {
  const dispatch = useDispatch();
  const [visible, setVisible] = useState(false);
  const { callStatus, error } = useSelector((state) => state.call || {});

  // Show notification for specific statuses
  const shouldShow = ['rejected', 'busy', 'ended', 'failed'].includes(callStatus);

  useEffect(() => {
    if (shouldShow) {
      setVisible(true);

      // Auto-hide after 4 seconds
      const timer = setTimeout(() => {
        setVisible(false);
        // Clear call state after animation
        setTimeout(() => {
          dispatch(clearCall());
        }, 300);
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [callStatus, shouldShow, dispatch]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(() => {
      dispatch(clearCall());
    }, 300);
  };

  if (!shouldShow || !visible) {
    return null;
  }

  const getStatusMessage = () => {
    switch (callStatus) {
      case 'rejected':
        return {
          title: 'Call Rejected',
          message: 'The call was rejected',
          color: 'red',
        };
      case 'busy':
        return {
          title: 'User Busy',
          message: error || 'The user is currently busy',
          color: 'yellow',
        };
      case 'ended':
        return {
          title: 'Call Ended',
          message: error || 'The call has ended',
          color: 'gray',
        };
      case 'failed':
        return {
          title: 'Call Failed',
          message: error || 'Failed to establish connection',
          color: 'red',
        };
      default:
        return {
          title: 'Call Status',
          message: 'Call status updated',
          color: 'gray',
        };
    }
  };

  const status = getStatusMessage();

  const colorClasses = {
    red: 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-700 text-red-800 dark:text-red-300',
    yellow: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-300',
    gray: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-700 text-gray-800 dark:text-gray-300',
  };

  return (
    <div className={`fixed top-4 right-4 z-50 transform transition-all duration-300 ${
      visible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
    }`}>
      <div className={`min-w-[300px] max-w-md p-4 rounded-lg shadow-lg border ${colorClasses[status.color]}`}>
        <div className="flex items-start gap-3">
          <div className="flex-1">
            <h4 className="font-semibold mb-1">{status.title}</h4>
            <p className="text-sm">{status.message}</p>
          </div>
          <button
            onClick={handleClose}
            className="p-1 hover:bg-black/10 dark:hover:bg-white/10 rounded transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CallStatusNotification;
