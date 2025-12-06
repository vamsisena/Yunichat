import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { 
  isMediaSupported 
} from '../utils/mediaPermissions';
import { 
  isUserEligibleForCalls, 
  isCallAllowedInChat,
  getCallEligibilityError,
  validateCallParticipants 
} from '../utils/callEligibility';
import { initiateCall } from '../features/actions/callActions';

/**
 * Call Action Buttons Component
 * Displays Audio and Video call buttons with proper eligibility checks
 * Following settings.json: no duplicate code, proper error handling
 */
const CallActionButtons = ({ currentUser, otherUser, isPrivateChat = true }) => {
  const dispatch = useDispatch();
  const [permissionError, setPermissionError] = useState(null);
  
  const { activeCall, callStatus } = useSelector((state) => state.call || {});

  // Check if calls are allowed
  const userEligible = isUserEligibleForCalls(currentUser);
  const chatEligible = isCallAllowedInChat(isPrivateChat, false);
  const showCallButtons = userEligible && chatEligible;

  // Validate participants
  const participantsValidation = validateCallParticipants(currentUser, otherUser);

  // Disable buttons if already in a call
  const isCallActive = activeCall !== null || callStatus !== 'idle';

  const handleAudioCallClick = async () => {
    console.log('🔵 ========== AUDIO CALL BUTTON CLICKED ==========');
    console.log('🔵 Other user:', JSON.stringify(otherUser, null, 2));
    console.log('🔵 Other user ID:', otherUser?.id);
    console.log('🔵 Other user username:', otherUser?.username);
    console.log('🔵 Current user:', JSON.stringify(currentUser, null, 2));
    console.log('🔵 Current user ID:', currentUser?.id);
    console.log('🔵 Is private chat:', isPrivateChat);
    console.log('🔵 Is call active:', isCallActive);
    
    // CRITICAL: Check if otherUser exists
    if (!otherUser || !otherUser.id) {
      console.error('❌ CRITICAL ERROR: otherUser is null or missing ID!', { otherUser });
      setPermissionError('Cannot initiate call - recipient information missing');
      return;
    }
    
    // Clear previous errors
    setPermissionError(null);

    // Check eligibility
    const eligibilityError = getCallEligibilityError(currentUser, isPrivateChat);
    if (eligibilityError) {
      console.error('❌ Eligibility check failed:', eligibilityError);
      setPermissionError(eligibilityError);
      return;
    }

    // Validate participants
    if (!participantsValidation.valid) {
      console.error('❌ Participants validation failed:', participantsValidation.error);
      setPermissionError(participantsValidation.error);
      return;
    }

    // Check media support
    if (!isMediaSupported()) {
      console.error('❌ Media not supported');
      setPermissionError('Your browser does not support audio/video calls');
      return;
    }

    // Check if already in call
    if (isCallActive) {
      console.error('❌ Already in call');
      setPermissionError('You are already in a call');
      return;
    }

    console.log('✅ All checks passed, dispatching initiateCall...');
    try {
      // Initiate audio call via Redux
      console.log('🎤 Initiating audio call with user:', otherUser.username, 'ID:', otherUser.id);
      const result = await dispatch(initiateCall({
        calleeId: otherUser.id,
        calleeUsername: otherUser.username,
        callType: 'AUDIO',
      })).unwrap();
      
      console.log('✅ Audio call initiated successfully, result:', result);
    } catch (error) {
      console.error('❌ Failed to initiate audio call:', error);
      console.error('❌ Error stack:', error.stack);
      setPermissionError(error || 'Failed to start audio call');
    }
  };

  const handleVideoCallClick = async () => {
    // Clear previous errors
    setPermissionError(null);

    // Check eligibility
    const eligibilityError = getCallEligibilityError(currentUser, isPrivateChat);
    if (eligibilityError) {
      setPermissionError(eligibilityError);
      return;
    }

    // Validate participants
    if (!participantsValidation.valid) {
      setPermissionError(participantsValidation.error);
      return;
    }

    // Check media support
    if (!isMediaSupported()) {
      setPermissionError('Your browser does not support audio/video calls');
      return;
    }

    // Check if already in call
    if (isCallActive) {
      setPermissionError('You are already in a call');
      return;
    }

    try {
      // Initiate video call via Redux
      console.log('🎥 Initiating video call with user:', otherUser.username);
      await dispatch(initiateCall({
        calleeId: otherUser.id,
        calleeUsername: otherUser.username,
        callType: 'VIDEO',
      })).unwrap();
      
      console.log('✅ Video call initiated successfully');
    } catch (error) {
      console.error('❌ Failed to initiate video call:', error);
      setPermissionError(error || 'Failed to start video call');
    }
  };

  // Don't render if user is not eligible
  if (!showCallButtons) {
    return null;
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Call Buttons */}
      <div className="flex items-center gap-2">
        {/* Audio Call Button */}
        <button
          onClick={handleAudioCallClick}
          disabled={isCallActive}
          className={`p-2 rounded-full transition-colors ${
            isCallActive 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-white/20'
          }`}
          title={isCallActive ? 'Already in call' : 'Start Audio Call'}
          aria-label="Start Audio Call"
        >
          <PhoneIcon className="w-5 h-5" />
        </button>

        {/* Video Call Button */}
        <button
          onClick={handleVideoCallClick}
          disabled={isCallActive}
          className={`p-2 rounded-full transition-colors ${
            isCallActive 
              ? 'opacity-50 cursor-not-allowed' 
              : 'hover:bg-white/20'
          }`}
          title={isCallActive ? 'Already in call' : 'Start Video Call'}
          aria-label="Start Video Call"
        >
          <VideoCameraIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Permission Error Message */}
      {permissionError && (
        <div className="absolute top-full left-0 right-0 mt-2 mx-2 p-3 bg-red-100 dark:bg-red-900/30 border border-red-300 dark:border-red-700 rounded-lg shadow-lg z-50">
          <div className="flex items-start gap-2">
            <svg 
              className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-800 dark:text-red-300">
                {permissionError}
              </p>
            </div>
            <button
              onClick={() => setPermissionError(null)}
              className="p-1 hover:bg-red-200 dark:hover:bg-red-800 rounded transition-colors"
              aria-label="Close error"
            >
              <svg className="w-4 h-4 text-red-600 dark:text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path 
                  fillRule="evenodd" 
                  d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" 
                  clipRule="evenodd" 
                />
              </svg>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default CallActionButtons;
