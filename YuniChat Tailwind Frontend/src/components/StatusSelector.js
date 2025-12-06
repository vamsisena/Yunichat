import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { updateMyStatus } from '../features/actions/userActions';
import { showSnackbar } from '../features/actions/uiActions';
import useAuth from '../hooks/useAuth';

const STATUS_OPTIONS = [
  { value: 'ONLINE', label: 'Online', color: 'bg-green-500' },
  { value: 'AWAY', label: 'Away', color: 'bg-yellow-500' },
  { value: 'BUSY', label: 'Busy', color: 'bg-red-500' },
  { value: 'OFFLINE', label: 'Offline', color: 'bg-gray-500' },
];

const StatusSelector = ({ open, onClose, anchorEl }) => {
  const dispatch = useDispatch();
  const { user } = useAuth();
  const [updating, setUpdating] = useState(false);

  if (!open) return null;

  const handleStatusChange = async (status) => {
    setUpdating(true);
    try {
      const result = await dispatch(updateMyStatus(status));
      if (result.success) {
        dispatch(showSnackbar(`Status updated to ${status}`, 'success'));
      } else {
        dispatch(showSnackbar(result.message || 'Failed to update status', 'error'));
      }
    } catch (error) {
      dispatch(showSnackbar('Failed to update status', 'error'));
    } finally {
      setUpdating(false);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50" onClick={onClose}>
      <div 
        className="absolute top-16 right-4 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-2 w-48"
        onClick={(e) => e.stopPropagation()}
      >
        {STATUS_OPTIONS.map((status) => (
          <button
            key={status.value}
            onClick={() => handleStatusChange(status.value)}
            disabled={updating || user?.status === status.value}
            className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className={`w-3 h-3 rounded-full ${status.color}`} />
            <span className="text-gray-700 dark:text-gray-200">{status.label}</span>
            {user?.status === status.value && (
              <span className="ml-auto text-primary-600 text-sm">✓</span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};

export default StatusSelector;
