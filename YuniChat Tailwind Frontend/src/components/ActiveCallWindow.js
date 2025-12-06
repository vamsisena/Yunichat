/**
 * Active Call Window
 * Shows video/audio streams during an active call with controls
 */

import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { 
  PhoneXMarkIcon, 
  MicrophoneIcon, 
  VideoCameraIcon,
  SpeakerWaveIcon,
  VideoCameraSlashIcon,
  SpeakerXMarkIcon,
  MinusIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/solid';
import { endCall } from '../features/actions/callActions';
import { getAvatarBgColor } from '../utils/avatarUtils';
import { getWebRTCManager } from '../features/actions/callActions';
import callSounds from '../utils/callSounds';

const ActiveCallWindow = () => {
  const dispatch = useDispatch();
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isSpeakerOff, setIsSpeakerOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);
  
  const { activeCall, callStatus } = useSelector((state) => state.call || {});

  const peerUsername = activeCall?.peerUsername;
  const peerAvatarUrl = activeCall?.peerAvatarUrl;
  const peerGender = activeCall?.peerGender;
  const callType = activeCall?.callType;
  const localStream = activeCall?.localStream;
  const remoteStream = activeCall?.remoteStream;
  const peerId = activeCall?.peerId;
  const connectionState = activeCall?.connectionState;
  const isVideoCall = callType === 'VIDEO';

  // Setup local video stream
  useEffect(() => {
    const videoElement = localVideoRef.current;
    if (localStream && videoElement) {
      videoElement.srcObject = localStream;
    }

    return () => {
      // Cleanup on unmount
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [localStream]);

  // Setup remote video stream
  useEffect(() => {
    const videoElement = remoteVideoRef.current;
    if (remoteStream && videoElement) {
      videoElement.srcObject = remoteStream;
    }

    return () => {
      // Cleanup on unmount
      if (videoElement) {
        videoElement.srcObject = null;
      }
    };
  }, [remoteStream]);

  // Reset call duration when call status changes to idle/ended
  useEffect(() => {
    if (callStatus === 'idle' || callStatus === 'ended' || !activeCall) {
      setCallDuration(0);
      console.log('🔄 Call duration reset to 0');
    }
  }, [callStatus, activeCall]);

  // Call duration timer and connected sound
  useEffect(() => {
    if (connectionState === 'connected') {
      // Play connected sound once
      callSounds.playConnected();
      
      const interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      return () => {
        clearInterval(interval);
        callSounds.stopAll();
      };
    }
  }, [connectionState]);

  // Only show when call is actually connected
  // OutgoingCallModal handles the 'calling' state (waiting for answer)
  // IncomingCallModal handles the 'ringing' state (receiving call)
  if (!activeCall || connectionState !== 'connected') {
    return null;
  }

  const handleEndCall = () => {
    console.log('📞 Ending call...');
    dispatch(endCall({ peerId }));
  };

  const handleToggleMute = () => {
    const webrtcManager = getWebRTCManager();
    if (webrtcManager?.localStream) {
      const audioTrack = webrtcManager.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log('🔇 Microphone', audioTrack.enabled ? 'unmuted' : 'muted');
      }
    } else {
      console.warn('⚠️ No local stream available for muting');
    }
  };

  const handleToggleVideo = () => {
    const webrtcManager = getWebRTCManager();
    if (webrtcManager?.localStream && isVideoCall) {
      const videoTrack = webrtcManager.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const handleToggleSpeaker = () => {
    const videoElement = remoteVideoRef.current;
    if (videoElement && videoElement.srcObject) {
      videoElement.muted = !videoElement.muted;
      setIsSpeakerOff(videoElement.muted);
      console.log('🔊 Speaker', videoElement.muted ? 'muted' : 'unmuted');
    } else {
      // Silently ignore if no remote stream yet (connection still establishing)
      // Don't show warning to avoid console noise
      if (connectionState !== 'connected') {
        return; // Still connecting, ignore speaker toggle
      }
      console.warn('⚠️ No remote stream available for speaker control');
    }
  };

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const avatarBgClass = getAvatarBgColor(peerAvatarUrl, peerGender);

  const handleToggleMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  // Minimized floating window
  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 bg-gray-800 rounded-lg shadow-2xl z-50 w-72 border border-gray-700">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {peerAvatarUrl ? (
              <img 
                src={peerAvatarUrl} 
                alt={peerUsername} 
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = 'none';
                  e.target.nextSibling.style.display = 'flex';
                }}
              />
            ) : null}
            <div className={`w-10 h-10 rounded-full ${avatarBgClass} flex items-center justify-center text-white font-bold ${peerAvatarUrl ? 'hidden' : ''}`}>
              {peerUsername?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <h3 className="text-white font-semibold text-sm">{peerUsername || 'Unknown User'}</h3>
              <p className="text-gray-400 text-xs">{formatDuration(callDuration)}</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleToggleMinimize}
              className="p-2 rounded-full bg-gray-700 hover:bg-gray-600 transition-colors"
              title="Expand"
            >
              <ArrowsPointingOutIcon className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={handleEndCall}
              className="p-2 rounded-full bg-red-500 hover:bg-red-600 transition-colors"
              title="End Call"
            >
              <PhoneXMarkIcon className="w-4 h-4 text-white" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 bg-gray-900 flex flex-col z-50 rounded-lg shadow-2xl overflow-hidden" style={{ width: '480px', height: '640px' }}>
      {/* Header */}
      <div className="bg-gray-800 p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          {peerAvatarUrl ? (
            <img 
              src={peerAvatarUrl} 
              alt={peerUsername} 
              className="w-10 h-10 rounded-full object-cover"
              onError={(e) => {
                console.warn('⚠️ Failed to load peer avatar:', peerAvatarUrl);
                e.target.onerror = null;
                e.target.style.display = 'none';
                e.target.nextSibling.style.display = 'flex';
              }}
            />
          ) : null}
          <div className={`w-10 h-10 rounded-full ${avatarBgClass} flex items-center justify-center text-white font-bold text-lg ${peerAvatarUrl ? 'hidden' : ''}`}>
            {peerUsername?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <h3 className="text-white font-semibold text-sm">{peerUsername || 'Unknown User'}</h3>
            <p className="text-gray-400 text-xs">{formatDuration(callDuration)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleToggleMinimize}
            className="p-1.5 rounded hover:bg-gray-700 transition-colors"
            title="Minimize"
          >
            <MinusIcon className="w-4 h-4 text-gray-400" />
          </button>
          <div className={`w-2 h-2 rounded-full ${connectionState === 'connected' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`}></div>
          <span className="text-gray-400 text-xs capitalize">{connectionState || 'connecting'}</span>
        </div>
      </div>

      {/* Video/Audio Display */}
      <div className="flex-1 relative bg-black">
        {isVideoCall ? (
          <>
            {/* Remote Video (Large) */}
            <div className="w-full h-full flex items-center justify-center">
              {remoteStream ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <div className="flex flex-col items-center gap-4">
                  {peerAvatarUrl ? (
                    <img 
                      src={peerAvatarUrl} 
                      alt={peerUsername} 
                      className="w-32 h-32 rounded-full object-cover"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.style.display = 'none';
                        e.target.nextSibling.style.display = 'flex';
                      }}
                    />
                  ) : null}
                  <div className={`w-32 h-32 rounded-full ${avatarBgClass} flex items-center justify-center text-white text-4xl font-bold ${peerAvatarUrl ? 'hidden' : ''}`}>
                    {peerUsername?.[0]?.toUpperCase() || '?'}
                  </div>
                  <p className="text-gray-400">Waiting for video...</p>
                </div>
              )}
            </div>

            {/* Local Video (Small, Picture-in-Picture) */}
            {localStream && !isVideoOff && (
              <div className="absolute top-4 right-4 w-32 h-24 sm:w-48 sm:h-36 bg-gray-800 rounded-lg overflow-hidden shadow-xl border-2 border-gray-700 transition-all">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-1 left-1 sm:bottom-2 sm:left-2 text-xs text-white bg-black/60 px-2 py-1 rounded backdrop-blur-sm">You</div>
              </div>
            )}
          </>
        ) : (
          // Audio Call - Show Avatar
          <div className="w-full h-full flex items-center justify-center p-4">
            <div className="flex flex-col items-center gap-4">
              {peerAvatarUrl ? (
                <img 
                  src={peerAvatarUrl} 
                  alt={peerUsername} 
                  className="w-40 h-40 rounded-full object-cover shadow-2xl"
                  onError={(e) => {
                    console.warn('⚠️ Failed to load peer avatar:', peerAvatarUrl);
                    e.target.onerror = null;
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                  }}
                />
              ) : null}
              <div className={`w-40 h-40 rounded-full ${avatarBgClass} flex items-center justify-center text-white text-5xl font-bold shadow-2xl ${peerAvatarUrl ? 'hidden' : ''}`}>
                {peerUsername?.[0]?.toUpperCase() || '?'}
              </div>
              <h2 className="text-white text-xl font-semibold text-center">{peerUsername || 'Unknown User'}</h2>
              <p className="text-gray-400 text-lg font-mono">{formatDuration(callDuration)}</p>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <p className="text-gray-400 text-sm">Audio Call in Progress</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 p-3 flex items-center justify-center gap-4 shadow-lg">
        {/* Mute/Unmute */}
        <button
          onClick={handleToggleMute}
          className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
            isMuted ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
          aria-label={isMuted ? 'Unmute' : 'Mute'}
        >
          <MicrophoneIcon className={`w-5 h-5 text-white ${isMuted ? 'opacity-50' : ''}`} />
        </button>

        {/* Toggle Video (only for video calls) */}
        {isVideoCall && (
          <button
            onClick={handleToggleVideo}
            className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
              isVideoOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
            }`}
            title={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
            aria-label={isVideoOff ? 'Turn On Video' : 'Turn Off Video'}
          >
            {isVideoOff ? (
              <VideoCameraSlashIcon className="w-5 h-5 text-white" />
            ) : (
              <VideoCameraIcon className="w-5 h-5 text-white" />
            )}
          </button>
        )}

        {/* End Call */}
        <button
          onClick={handleEndCall}
          className="p-4 bg-red-500 hover:bg-red-600 rounded-full transition-all transform hover:scale-110 active:scale-95 shadow-lg"
          title="End Call"
          aria-label="End Call"
        >
          <PhoneXMarkIcon className="w-6 h-6 text-white" />
        </button>

        {/* Speaker Toggle */}
        <button
          onClick={handleToggleSpeaker}
          className={`p-3 rounded-full transition-all transform hover:scale-110 active:scale-95 ${
            isSpeakerOff ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-700 hover:bg-gray-600'
          }`}
          title={isSpeakerOff ? 'Unmute Speaker' : 'Mute Speaker'}
          aria-label={isSpeakerOff ? 'Unmute Speaker' : 'Mute Speaker'}
        >
          {isSpeakerOff ? (
            <SpeakerXMarkIcon className="w-5 h-5 text-white" />
          ) : (
            <SpeakerWaveIcon className="w-5 h-5 text-white" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ActiveCallWindow;
