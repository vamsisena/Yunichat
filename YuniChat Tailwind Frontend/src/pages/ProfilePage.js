import React, { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { PencilIcon, CheckIcon, XMarkIcon, CameraIcon } from '@heroicons/react/24/outline';
import useAuth from '../hooks/useAuth';
import { updateUserProfile } from '../features/actions/authActions';
import userApi from '../api/userApi';
import fileApi from '../api/fileApi';
import { validateEmail } from '../utils/validators';
import { showSnackbar } from '../features/actions/uiActions';
import { getAvatarColor } from '../utils/avatarUtils';

const ProfilePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user, isGuest } = useAuth();
  
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    bio: '',
    age: '',
    gender: '',
  });
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (user) {
      setFormData({
        email: user.email || '',
        bio: user.bio || '',
        age: user.age || '',
        gender: user.gender || '',
      });
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: '' }));
  };

  const validate = () => {
    const newErrors = {};
    
    if (formData.email && !validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }
    
    if (formData.age && (formData.age < 13 || formData.age > 120)) {
      newErrors.age = 'Age must be between 13 and 120';
    }

    if (formData.bio && formData.bio.length > 500) {
      newErrors.bio = 'Bio must be less than 500 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    
    setLoading(true);
    
    try {
      const updateData = {};
      if (formData.email !== user.email) updateData.email = formData.email;
      if (formData.bio !== user.bio) updateData.bio = formData.bio;
      if (formData.age !== user.age) updateData.age = formData.age;
      if (formData.gender !== user.gender) updateData.gender = formData.gender;

      if (Object.keys(updateData).length > 0) {
        const response = await userApi.updateProfile(updateData);
        
        if (response.data.success) {
          dispatch(updateUserProfile(updateData));
          dispatch(showSnackbar('Profile updated successfully', 'success'));
          setEditing(false);
        }
      } else {
        setEditing(false);
      }
    } catch (error) {
      dispatch(showSnackbar(error.response?.data?.message || error.message || 'Failed to update profile', 'error'));
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      email: user.email || '',
      bio: user.bio || '',
      age: user.age || '',
      gender: user.gender || '',
    });
    setErrors({});
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
      const uploadResponse = await fileApi.uploadFile(file, 'AVATAR');
      console.log('Upload response:', uploadResponse);
      
      // Extract URL from various possible response structures
      const avatarUrl = uploadResponse?.data?.downloadUrl || 
                       uploadResponse?.data?.url || 
                       uploadResponse?.data?.data?.downloadUrl ||
                       uploadResponse?.data?.data?.url ||
                       uploadResponse?.data?.data ||
                       uploadResponse?.data;
      
      if (!avatarUrl || typeof avatarUrl !== 'string') {
        console.error('Invalid avatar URL:', avatarUrl);
        throw new Error('Invalid response from upload');
      }

      console.log('Avatar URL:', avatarUrl);
      await userApi.updateProfile({ avatarUrl });
      dispatch(updateUserProfile({ avatarUrl }));
      dispatch(showSnackbar('Avatar updated successfully', 'success'));
    } catch (error) {
      console.error('Avatar upload error:', error);
      dispatch(showSnackbar(error.response?.data?.message || 'Failed to upload avatar', 'error'));
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleClose = () => {
    navigate('/chat');
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[75vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent hover:scrollbar-thumb-gray-500 dark:hover:scrollbar-thumb-gray-500" onClick={(e) => e.stopPropagation()} style={{scrollbarWidth: 'thin'}}>
        {/* Header with Close Button */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 p-4 rounded-t-xl z-10">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">Profile</h1>
            <div className="flex items-center gap-2">
              {!isGuest && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-primary-600 text-white text-sm rounded-lg hover:bg-primary-700 transition-colors"
                >
                  <PencilIcon className="w-4 h-4" />
                  Edit
                </button>
              )}
              <button
                onClick={handleClose}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        <div className="p-4">

          {/* Guest Warning */}
          {isGuest && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-yellow-800 dark:text-yellow-400 text-sm">
                You are logged in as a guest. Guest accounts are temporary and will be deleted after 24 hours of inactivity.
              </p>
            </div>
          )}

          {/* User Type Badge */}
          <div className="flex justify-center mb-4">
            <span className={`px-4 py-1 rounded-full text-sm font-semibold ${
              isGuest 
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' 
                : 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
            }`}>
              {isGuest ? 'Guest' : 'Registered'}
            </span>
          </div>

          {/* Avatar */}
          <div className="flex justify-center mb-4">
            <div className="relative">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.username} 
                  className="w-32 h-32 rounded-full object-cover"
                />
              ) : (
                <div className={`w-32 h-32 rounded-full ${getAvatarColor(user?.gender)} flex items-center justify-center text-white text-5xl font-semibold`}>
                  {user?.fullName?.charAt(0) || user?.username?.charAt(0)?.toUpperCase() || '?'}
                </div>
              )}
              {!isGuest && (
                <label className="absolute bottom-0 right-0 bg-primary-600 hover:bg-primary-700 text-white p-2 rounded-full cursor-pointer transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarUpload}
                    className="hidden"
                    disabled={uploadingAvatar}
                  />
                  {uploadingAvatar ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <CameraIcon className="w-5 h-5" />
                  )}
                </label>
              )}
            </div>
          </div>

          <hr className="my-4 border-gray-200 dark:border-gray-700" />

          {/* Profile Fields */}
          <div className="space-y-4">
            {/* Username - Read Only */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Username
              </label>
              <p className="text-gray-900 dark:text-white font-medium">
                {user?.username || 'Not available'}
              </p>
            </div>

            {/* Email */}
            {!isGuest && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Email
                </label>
                {editing ? (
                  <>
                    <input
                      type="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      disabled={loading}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.email}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {user?.email || 'Not set'}
                  </p>
                )}
              </div>
            )}

            {/* Age */}
            {!isGuest && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Age
                </label>
                {editing ? (
                  <>
                    <input
                      type="number"
                      name="age"
                      value={formData.age}
                      onChange={handleChange}
                      disabled={loading}
                      min="13"
                      max="120"
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                    {errors.age && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.age}</p>
                    )}
                  </>
                ) : (
                  <p className="text-gray-900 dark:text-white">
                    {user?.age || 'Not set'}
                  </p>
                )}
              </div>
            )}

            {/* Gender */}
            {!isGuest && (
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Gender
                </label>
                {editing ? (
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    disabled={loading}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Select gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                ) : (
                  <p className="text-gray-900 dark:text-white capitalize">
                    {user?.gender || 'Not set'}
                  </p>
                )}
              </div>
            )}

            {/* Bio */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Bio
              </label>
              {editing ? (
                <>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    disabled={loading}
                    rows={4}
                    maxLength={500}
                    placeholder="Tell us about yourself..."
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  />
                  <div className="mt-1 flex justify-between items-center">
                    {errors.bio && (
                      <p className="text-sm text-red-600 dark:text-red-400">{errors.bio}</p>
                    )}
                    <p className="text-sm text-gray-500 dark:text-gray-400 ml-auto">
                      {formData.bio.length}/500
                    </p>
                  </div>
                </>
              ) : (
                <p className="text-gray-900 dark:text-white whitespace-pre-wrap">
                  {user?.bio || 'No bio yet'}
                </p>
              )}
            </div>

            {/* Account Status */}
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Account Status
              </label>
              <p className="text-gray-900 dark:text-white capitalize">
                {user?.status?.toLowerCase() || 'Online'}
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          {editing && (
            <div className="flex gap-4 mt-4">
              <button
                onClick={handleSave}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <CheckIcon className="w-5 h-5" />
                    <span>Save Changes</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <XMarkIcon className="w-5 h-5" />
                <span>Cancel</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
