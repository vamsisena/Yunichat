import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { XMarkIcon, PencilIcon, CheckIcon, CameraIcon, SunIcon, MoonIcon } from '@heroicons/react/24/outline';
import { getAvatarColor } from '../utils/avatarUtils';
import useAuth from '../hooks/useAuth';
import { useThemeMode } from '../App';
import { updateUserProfile } from '../features/actions/authActions';
import { showSnackbar } from '../features/actions/uiActions';
import userApi from '../api/userApi';
import fileApi from '../api/fileApi';

const ProfilePopup = ({ open, onClose }) => {
  const dispatch = useDispatch();
  const { user, isGuest } = useAuth();
  const { isDarkMode, toggleTheme } = useThemeMode();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    age: '',
    gender: '',
    bio: '',
  });

  useEffect(() => {
    if (user && !editing) {
      setFormData({
        username: user.username || '',
        age: user.age || '',
        gender: user.gender || '',
        bio: user.bio || '',
      });
    }
  }, [user, editing]);

  useEffect(() => {
    if (!open) {
      setEditing(false);
    } else if (open && user) {
      const refreshProfile = async () => {
        try {
          const response = await userApi.getCurrentUser();
          if (response.data.success) {
            dispatch(updateUserProfile(response.data.data));
          }
        } catch (error) {
          console.error('Failed to refresh profile:', error);
        }
      };
      refreshProfile();
    }
  }, [open, dispatch, user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const validate = () => {
    if (formData.username && formData.username.trim()) {
      if (formData.username.trim().length < 3 || formData.username.trim().length > 50) {
        dispatch(showSnackbar('Username must be between 3 and 50 characters', 'error'));
        return false;
      }
    }
    if (formData.age !== null && formData.age !== undefined && formData.age !== '') {
      const age = parseInt(formData.age, 10);
      if (isNaN(age) || age < 13 || age > 120) {
        dispatch(showSnackbar('Age must be between 13 and 120', 'error'));
        return false;
      }
    }
    if (formData.bio && formData.bio.length > 500) {
      dispatch(showSnackbar('Bio must not exceed 500 characters', 'error'));
      return false;
    }
    if (formData.gender && formData.gender.trim()) {
      const gender = formData.gender.toLowerCase().trim();
      if (gender !== 'male' && gender !== 'female' && gender !== 'other') {
        dispatch(showSnackbar('Please select a valid gender', 'error'));
        return false;
      }
    }
    return true;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      const updateData = {};
      if (formData.username && formData.username.trim()) {
        updateData.username = formData.username.trim();
      }
      if (formData.age !== null && formData.age !== undefined && formData.age !== '') {
        updateData.age = parseInt(formData.age, 10);
      }
      if (formData.gender && formData.gender.trim()) {
        updateData.gender = formData.gender.trim().toLowerCase();
      }
      if (formData.bio !== null && formData.bio !== undefined) {
        updateData.bio = formData.bio.trim();
      }

      const response = await userApi.updateProfile(updateData);
      if (response.data.success) {
        dispatch(updateUserProfile(response.data.data));
        dispatch(showSnackbar('Profile updated successfully', 'success'));
        setEditing(false);
      } else {
        dispatch(showSnackbar('Failed to update profile', 'error'));
      }
    } catch (error) {
      const errorMessage = error?.message || error.response?.data?.message || 'Failed to update profile';
      dispatch(showSnackbar(errorMessage, 'error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      username: user.username || '',
      age: user.age || '',
      gender: user.gender || '',
      bio: user.bio || '',
    });
    setEditing(false);
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      dispatch(showSnackbar('File size must be less than 5MB', 'error'));
      return;
    }

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', 'avatar');

      const uploadResponse = await fileApi.uploadFile(formData);
      if (uploadResponse.data.success) {
        const avatarUrl = uploadResponse.data.data.url;
        const updateResponse = await userApi.updateProfile({ avatarUrl });
        if (updateResponse.data.success) {
          dispatch(updateUserProfile(updateResponse.data.data));
          dispatch(showSnackbar('Avatar updated successfully', 'success'));
        }
      }
    } catch (error) {
      dispatch(showSnackbar('Failed to upload avatar', 'error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!open || !user) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Profile</h2>
          <div className="flex items-center gap-2">
            <button onClick={toggleTheme} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded" title="Toggle Theme">
              {isDarkMode ? <SunIcon className="w-5 h-5" /> : <MoonIcon className="w-5 h-5" />}
            </button>
            <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
              <XMarkIcon className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Avatar */}
        <div className="flex flex-col items-center mb-6">
          <div className="relative mb-4">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.username} className="w-24 h-24 rounded-full" />
            ) : (
              <div className={`w-24 h-24 rounded-full ${getAvatarColor(user.username)} flex items-center justify-center text-white text-3xl font-semibold`}>
                {user.username?.charAt(0).toUpperCase()}
              </div>
            )}
            {!isGuest && (
              <label className="absolute bottom-0 right-0 bg-primary-600 text-white p-2 rounded-full cursor-pointer hover:bg-primary-700">
                {uploadingAvatar ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CameraIcon className="w-4 h-4" />
                )}
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" disabled={uploadingAvatar} />
              </label>
            )}
          </div>

          {/* Edit/Save Buttons */}
          {!isGuest && (
            <div className="flex gap-2">
              {!editing ? (
                <button onClick={() => setEditing(true)} className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                  <PencilIcon className="w-4 h-4" />
                  Edit Profile
                </button>
              ) : (
                <>
                  <button onClick={handleSave} disabled={loading} className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50">
                    {loading ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <CheckIcon className="w-4 h-4" />}
                    Save
                  </button>
                  <button onClick={handleCancel} disabled={loading} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-white rounded-lg hover:bg-gray-400 dark:hover:bg-gray-500">
                    Cancel
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* Form Fields */}
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Username</label>
            {editing ? (
              <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            ) : (
              <p className="text-gray-900 dark:text-white">{user.username}</p>
            )}
          </div>

          {user.email && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <p className="text-gray-900 dark:text-white">{user.email}</p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Age</label>
            {editing ? (
              <input type="number" name="age" value={formData.age} onChange={handleChange} min="13" max="120" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
            ) : (
              <p className="text-gray-900 dark:text-white">{user.age || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Gender</label>
            {editing ? (
              <select name="gender" value={formData.gender} onChange={handleChange} className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            ) : (
              <p className="text-gray-900 dark:text-white capitalize">{user.gender || 'Not set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Bio</label>
            {editing ? (
              <>
                <textarea name="bio" value={formData.bio} onChange={handleChange} rows="3" maxLength="500" className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
                <p className="text-xs text-gray-500 mt-1">{formData.bio?.length || 0}/500 characters</p>
              </>
            ) : (
              <p className="text-gray-900 dark:text-white">{user.bio || 'No bio set'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Account Type</label>
            <p className="text-gray-900 dark:text-white">{user.isGuest ? 'Guest' : 'Registered'}</p>
          </div>

          {user.status && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <p className="text-gray-900 dark:text-white capitalize">{user.status}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePopup;
