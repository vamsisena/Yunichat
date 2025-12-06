/**
 * Outgoing Call Modal
 * Shows UI when making an outgoing call with ringing status
 */

import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { XMarkIcon, PhoneIcon, VideoCameraIcon } from '@heroicons/react/24/solid';
import { endCall } from '../features/actions/callActions';
import { getAvatarBgColor } from '../utils/avatarUtils';
import audioManager from '../utils/audioManager';

const OutgoingCallModal = () => {
  const dispatch = useDispatch();
  const audioRef = useRef(null);
  
  const { activeCall, callStatus } = useSelector((state) => state.call || {});

  const peerUsername = activeCall?.peerUsername;
  const callType = activeCall?.callType;
  const peerId = activeCall?.peerId;
  const isVideoCall = callType === 'VIDEO';

  const handleCancelCall = () => {
    console.log('📞 Canceling call...');
    dispatch(endCall({ peerId }));
  };

  useEffect(() => {
    console.log('📞 OutgoingCallModal useEffect - callStatus:', callStatus, 'hasAudioRef:', !!audioRef.current);
    
    // Register and play outgoing ringtone
    if (audioRef.current && callStatus === 'calling') {
      console.log('🔔 Registering and playing outgoing ringtone');
      audioManager.register('outgoing-ringtone', audioRef.current);
      audioRef.current.loop = true;
      audioRef.current.play()
        .then(() => console.log('✅ Outgoing ringtone playing'))
        .catch((error) => {
          console.error('❌ Failed to play outgoing ringtone:', error);
        });
    } else {
      console.log('⚠️ Not playing ringtone - audioRef:', !!audioRef.current, 'status:', callStatus);
    }

    // Auto-cancel after 45 seconds (no answer)
    const timeoutId = setTimeout(() => {
      if (callStatus === 'calling') {
        console.log('⏱️ Call timeout - no answer');
        handleCancelCall();
      }
    }, 45000);

    // Cleanup: Stop ringtone and clear timeout when component unmounts or status changes
    return () => {
      console.log('🔇 Stopping outgoing ringtone - status changed from calling to:', callStatus);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
      }
      audioManager.unregister('outgoing-ringtone');
      clearTimeout(timeoutId);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [callStatus]);

  const avatarBgClass = getAvatarBgColor(peerId);
  const connectionState = activeCall?.connectionState;

  // Only show for outgoing calls (status: calling) AND before connection is established
  // Once connected, ActiveCallWindow takes over
  if (!activeCall || callStatus !== 'calling' || connectionState === 'connected') {
    return null;
  }

  return (
    <>
      {/* Ringtone Audio */}
      <audio ref={audioRef} src="/sounds/outgoing-ringtone.mp3" />

      {/* Modal Overlay */}
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4">
          {/* Close Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={handleCancelCall}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
              aria-label="Cancel Call"
            >
              <XMarkIcon className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            </button>
          </div>

          {/* Avatar */}
          <div className="flex flex-col items-center gap-4">
            <div className={`w-32 h-32 rounded-full ${avatarBgClass} flex items-center justify-center text-white text-4xl font-bold`}>
              {peerUsername?.[0]?.toUpperCase() || '?'}
            </div>

            {/* Username */}
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-white">
              {peerUsername || 'Unknown User'}
            </h2>

            {/* Call Type Icon */}
            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
              {isVideoCall ? (
                <>
                  <VideoCameraIcon className="w-6 h-6" />
                  <span className="text-lg">Video Call</span>
                </>
              ) : (
                <>
                  <PhoneIcon className="w-6 h-6" />
                  <span className="text-lg">Audio Call</span>
                </>
              )}
            </div>

            {/* Status */}
            <div className="flex flex-col items-center gap-2 my-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <p className="text-lg text-gray-700 dark:text-gray-300">
                  Calling...
                </p>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Waiting for response
              </p>
            </div>

            {/* Cancel Button */}
            <button
              onClick={handleCancelCall}
              className="mt-6 px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-full font-semibold transition-colors flex items-center gap-2 shadow-lg"
            >
              <XMarkIcon className="w-5 h-5" />
              Cancel Call
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default OutgoingCallModal;
