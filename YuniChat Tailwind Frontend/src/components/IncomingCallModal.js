/**
 * Incoming Call Modal
 * Shows UI when receiving an incoming call with accept/reject buttons
 */

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { PhoneIcon, XMarkIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { acceptCall, rejectCall } from '../features/actions/callActions';
import { getAvatarBgColor } from '../utils/avatarUtils';
import audioManager from '../utils/audioManager';
import { showIncomingCallNotification } from '../utils/browserNotifications';

const IncomingCallModal = () => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  const [notification, setNotification] = useState(null);
  
  const { incomingCall, callStatus } = useSelector((state) => state.call || {});

  const callerId = incomingCall?.callerId;
  const callerUsername = incomingCall?.callerUsername;
  const callType = incomingCall?.callType;
  const sdp = incomingCall?.sdp;
  const isVideoCall = callType === 'VIDEO';

  useEffect(() => {
    // CRITICAL FIX: Only run if we have valid caller info
    if (!callerId || !callerUsername || !callType) {
      console.warn('⚠️ IncomingCallModal mounted but missing data:', { callerId, callerUsername, callType });
      return;
    }
    
    console.log('📞 IncomingCallModal mounted - incoming call from:', callerUsername, 'type:', callType, 'callerId:', callerId);
    
    // Register and play incoming ringtone
    if (audioRef.current) {
      audioManager.register('incoming-ringtone', audioRef.current);
      audioRef.current.loop = true;
      audioRef.current.play().catch((error) => {
        console.error('Failed to play ringtone:', error);
      });
    }

    // Show browser notification if tab is not focused
    const notif = showIncomingCallNotification(
      callerUsername,
      callType,
      () => {
        // Focus the window when notification is clicked
        window.focus();
      }
    );
    setNotification(notif);

    // Auto-reject after 30 seconds
    const timeoutId = setTimeout(() => {
      console.log('⏱️ Call timeout - auto-rejecting');
      handleReject();
    }, 30000);

    // Cleanup: Stop ringtone, close notification, and clear timeout when component unmounts
    return () => {
      console.log('📞 IncomingCallModal unmounting');
      audioManager.unregister('incoming-ringtone');
      if (notification) {
        notification.close();
      }
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callerId, callerUsername, callType]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleAccept = async () => {

    console.log('📞 Accepting call...');
    
    // Stop ringtone and close notification
    audioManager.stopAndCleanup('incoming-ringtone');
    if (notification) {
      notification.close();
    }

    try {
      await dispatch(acceptCall({
        callerId,
        callerUsername,
        callType,
        sdp,
      })).unwrap();
    } catch (error) {
      console.error('Failed to accept call:', error);
    }
  };

  const handleReject = () => {
    console.log('❌ Rejecting call from user', callerId);
    
    // Validate we have caller info before rejecting
    if (!callerId) {
      console.error('❌ Cannot reject call - callerId is undefined!');
      return;
    }
    
    // Stop ringtone and close notification
    audioManager.stopAndCleanup('incoming-ringtone');
    if (notification) {
      notification.close();
    }

    dispatch(rejectCall({ callerId }));
  };

  const avatarBgClass = getAvatarBgColor(callerId);

  // Only show when there's an incoming call (status: ringing)
  if (!incomingCall || callStatus !== 'ringing') {
    return null;
  }

  return (
    <>
      {/* Ringtone Audio */}
      <audio ref={audioRef} src="/sounds/incoming-ringtone.mp3" />

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-32 h-32 rounded-full ${avatarBgClass} flex items-center justify-center text-white text-4xl font-bold animate-pulse`}>
              {callerUsername?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Username */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {callerUsername || 'Unknown User'}
            </h2>

            {/* Call Type */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {isVideoCall ? (
                <>
                  <VideoCameraIcon className="w-6 h-6" />
                  <span className="text-lg">Incoming Video Call</span>
                </>
              ) : (
                <>
                  <PhoneIcon className="w-6 h-6" />
                  <span className="text-lg">Incoming Audio Call</span>
                </>
              )}
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 my-4">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <p className="text-lg text-gray-700 dark:text-gray-300">
                Ringing...
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-4 mt-6">
              {/* Reject Button */}
              <button
                onClick={handleReject}
                className="p-5 bg-red-500 hover:bg-red-600 rounded-full transition-colors shadow-lg group"
                aria-label="Reject Call"
              >
                <XMarkIcon className="w-8 h-8 text-white" />
              </button>

              {/* Accept Button */}
              <button
                onClick={handleAccept}
                className="p-5 bg-green-500 hover:bg-green-600 rounded-full transition-colors shadow-lg group"
                aria-label="Accept Call"
              >
                <PhoneIcon className="w-8 h-8 text-white" />
              </button>
            </div>

            {/* Button Labels */}
            <div className="flex items-center gap-16 mt-2">
              <span className="text-sm text-gray-600 dark:text-gray-400">Reject</span>
              <span className="text-sm text-gray-600 dark:text-gray-400">Accept</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomingCallModal;
