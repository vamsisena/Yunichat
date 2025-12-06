/**
 * Call Actions
 * Redux actions for managing call state
 */

import { createAsyncThunk } from '@reduxjs/toolkit';
import WebRTCManager from '../../utils/webrtcManager';
import { sendCallOffer, sendCallAnswer, sendCallEnd, sendCallReject, sendCallBusy } from '../../utils/callSignaling';
import { requestMicrophonePermission, requestCameraAndMicPermission } from '../../utils/mediaPermissions';
import audioManager from '../../utils/audioManager';
import userApi from '../../api/userApi';

// WebRTC manager instance (singleton)
let webrtcManager = null;

/**
 * Initialize outgoing call (audio or video)
 */
export const initiateCall = createAsyncThunk(
  'call/initiate',
  async ({ calleeId, calleeUsername, callType }, { rejectWithValue, dispatch }) => {
    console.log('🚨 ========== INITIATE CALL START ==========');
    console.log('🚨 Parameters:', { calleeId, calleeUsername, callType });
    try {
      console.log(`📞 Initiating ${callType} call to user ${calleeId}`);

      // Request media permissions
      const isVideo = callType === 'VIDEO';
      try {
        if (isVideo) {
          await requestCameraAndMicPermission();
        } else {
          await requestMicrophonePermission();
        }
      } catch (permError) {
        console.error('❌ Permission denied:', permError);
        const message = permError.name === 'NotAllowedError' 
          ? 'Permission for microphone/camera is required for calls. Please check your browser settings.'
          : `Media permission error: ${permError.message}`;
        return rejectWithValue(message);
      }

      // Create WebRTC manager
      webrtcManager = new WebRTCManager();

      // Get local stream
      await webrtcManager.getLocalStream(isVideo, true);

      // Create peer connection
      webrtcManager.createPeerConnection(calleeId);
      webrtcManager.addLocalStreamToPeer();

      // Setup WebRTC callbacks
      setupWebRTCCallbacks(dispatch);

      // Create offer
      const sdp = await webrtcManager.createOffer();
      console.log('🎯 SDP offer created, length:', sdp?.length, 'calleeId:', calleeId, 'callType:', callType);
      console.log('📞 I am the CALLER (INITIATOR), waiting for CALL_ANSWER from:', calleeId);

      // Send offer via signaling
      console.log('🚀 About to call sendCallOffer...');
      try {
        sendCallOffer(calleeId, sdp, callType);
        console.log('✅ sendCallOffer completed successfully');
      } catch (signalingError) {
        console.error('❌ Signaling error:', signalingError);
        throw new Error('Connection lost. Please check your network and try again.');
      }

      // Fetch peer user info for avatar/gender
      let peerAvatarUrl = null;
      let peerGender = null;
      try {
        const userResponse = await userApi.getUserById(calleeId);
        peerAvatarUrl = userResponse?.data?.avatarUrl;
        peerGender = userResponse?.data?.gender;
      } catch (userError) {
        console.warn('⚠️ Could not fetch peer user info:', userError);
      }

      return {
        calleeId,
        calleeUsername,
        callType,
        localStream: webrtcManager.localStream,
        peerAvatarUrl,
        peerGender,
      };
    } catch (error) {
      console.error('❌ Error initiating call:', error);
      
      // Cleanup on error
      if (webrtcManager) {
        webrtcManager.close();
        webrtcManager = null;
      }
      
      // Stop all sounds
      audioManager.stopAll();

      return rejectWithValue(error.message || 'Unable to establish call. Please check your network.');
    }
  }
);

/**
 * Accept incoming call
 */
export const acceptCall = createAsyncThunk(
  'call/accept',
  async ({ callerId, callerUsername, callType, sdp }, { rejectWithValue, dispatch, getState }) => {
    try {
      const { auth } = getState();
      const myUserId = auth?.user?.id;
      
      console.log('📞 ========== ACCEPTING CALL (RECEIVER SIDE) ==========');
      console.log(`📞 My user ID: ${myUserId}`);
      console.log(`📞 Accepting ${callType} call from caller ID: ${callerId}, username: ${callerUsername}`);
      console.log(`📞 I am the RECEIVER, caller is the INITIATOR`);

      // Request media permissions
      const isVideo = callType === 'VIDEO';
      try {
        if (isVideo) {
          await requestCameraAndMicPermission();
        } else {
          await requestMicrophonePermission();
        }
      } catch (permError) {
        console.error('❌ Permission denied:', permError);
        const message = permError.name === 'NotAllowedError' 
          ? 'Permission for microphone/camera is required for calls. Please check your browser settings.'
          : `Media permission error: ${permError.message}`;
        return rejectWithValue(message);
      }

      // Create WebRTC manager
      webrtcManager = new WebRTCManager();

      // Get local stream
      await webrtcManager.getLocalStream(isVideo, true);

      // Create peer connection
      webrtcManager.createPeerConnection(callerId);
      webrtcManager.addLocalStreamToPeer();

      // Setup WebRTC callbacks
      setupWebRTCCallbacks(dispatch);

      // Set remote description (offer from caller)
      console.log('📞 Setting remote offer from caller...');
      await webrtcManager.setRemoteDescription(sdp, 'offer');

      // Create answer
      console.log('📞 Creating answer SDP...');
      const answerSdp = await webrtcManager.createAnswer();

      // Send answer via signaling
      console.log('📞 ========================================');
      console.log('📞 SENDING CALL_ANSWER to caller:', callerId);
      console.log('📞 Answer SDP length:', answerSdp?.length);
      console.log('📞 This CALL_ANSWER should ONLY be received by caller ID:', callerId);
      console.log('📞 ========================================');
      try {
        sendCallAnswer(callerId, answerSdp);
        console.log('✅ CALL_ANSWER sent successfully to caller:', callerId);
      } catch (signalingError) {
        console.error('❌ Signaling error:', signalingError);
        throw new Error('Connection lost. Please check your network and try again.');
      }

      // Process any ICE candidates that arrived before we initialized WebRTC
      await processQueuedIceCandidates();

      // Fetch peer user info for avatar/gender
      let peerAvatarUrl = null;
      let peerGender = null;
      try {
        const userResponse = await userApi.getUserById(callerId);
        peerAvatarUrl = userResponse?.data?.avatarUrl;
        peerGender = userResponse?.data?.gender;
      } catch (userError) {
        console.warn('⚠️ Could not fetch peer user info:', userError);
      }

      console.log('✅ acceptCall thunk completed successfully');
      console.log('📞 ========== ACCEPT CALL COMPLETE ==========');
      
      return {
        callerId,
        callerUsername,
        callType,
        localStream: webrtcManager.localStream,
        peerAvatarUrl,
        peerGender,
      };
    } catch (error) {
      console.error('❌ Error accepting call:', error);
      
      // Cleanup on error
      if (webrtcManager) {
        webrtcManager.close();
        webrtcManager = null;
      }
      
      // Stop all sounds
      audioManager.stopAll();

      return rejectWithValue(error.message || 'Unable to establish call. Please check your network.');
    }
  }
);

/**
 * Reject incoming call
 */
export const rejectCall = createAsyncThunk(
  'call/reject',
  async ({ callerId }) => {
    console.log(`❌ Rejecting call from user ${callerId}`);
    sendCallReject(callerId);
    
    // Clear any queued ICE candidates
    pendingIceCandidates = [];
    console.log('🗑️ Cleared queued ICE candidates');
    
    return null;
  }
);

/**
 * End active call
 */
export const endCall = createAsyncThunk(
  'call/end',
  async ({ peerId }, { getState }) => {
    console.log(`📞 Ending call with user ${peerId}`);

    // Send end signal
    sendCallEnd(peerId);

    // Stop all audio (ringtones)
    audioManager.stopAll();

    // Cleanup WebRTC
    if (webrtcManager) {
      webrtcManager.close();
      webrtcManager = null;
    }

    // Clear any queued ICE candidates
    pendingIceCandidates = [];
    console.log('🗑️ Cleared queued ICE candidates');

    return null;
  }
);

/**
 * Handle incoming call offer
 */
export const receiveCallOffer = (payload) => (dispatch, getState) => {
  console.log('📞 ========== receiveCallOffer START ==========');
  console.log('📞 Payload received:', JSON.stringify(payload, null, 2));
  console.log('📞 callerId:', payload?.callerId, 'callerUsername:', payload?.callerUsername);
  console.log('📞 callType:', payload?.callType, 'sdp:', payload?.sdp?.substring(0, 50) + '...');
  
  const { call } = getState();
  console.log('📞 Current call state:', { 
    activeCall: call?.activeCall, 
    incomingCall: call?.incomingCall, 
    callStatus: call?.callStatus 
  });
  
  // Validate payload
  if (!payload?.callerId || !payload?.callerUsername) {
    console.error('❌ INVALID PAYLOAD - missing callerId or callerUsername:', payload);
    return;
  }
  
  // If already handling a call with this same caller, ignore duplicate offer
  const isFromSameCaller = 
    (call?.activeCall?.callerId === payload.callerId) ||
    (call?.incomingCall?.callerId === payload.callerId);
    
  if (isFromSameCaller && call?.callStatus !== 'idle') {
    console.log('📵 Ignoring duplicate CALL_OFFER from same caller:', payload.callerId, 'current status:', call?.callStatus);
    return;
  }
  
  // If already in a call with someone else, send busy signal
  if ((call?.activeCall || call?.incomingCall) && !isFromSameCaller) {
    console.log('📵 Already in call with different user, sending busy signal to user', payload.callerId);
    sendCallBusy(payload.callerId);
    return;
  }
  
  // Only accept new calls when idle
  if (call?.callStatus !== 'idle' && !isFromSameCaller) {
    console.log('📵 Not idle (status:', call?.callStatus, '), sending busy signal to user', payload.callerId);
    sendCallBusy(payload.callerId);
    return;
  }

  console.log('📞 Dispatching receiveOffer to reducer with payload:', payload);
  dispatch({
    type: 'call/receiveOffer',
    payload,
  });
  console.log('📞 ========== receiveCallOffer END ==========');
};

/**
 * Handle call answer from peer
 */
export const receiveCallAnswer = createAsyncThunk(
  'call/receiveAnswer',
  async ({ sdp }, { rejectWithValue, getState }) => {
    try {
      const { call, auth } = getState();
      const myUserId = auth?.user?.id;
      
      console.log('📞 ========== CALL_ANSWER RECEIVED ==========');
      console.log('   My user ID:', myUserId);
      console.log('   Current call status:', call?.callStatus);
      console.log('   Has active call:', !!call?.activeCall);
      console.log('   Active call peer ID:', call?.activeCall?.peerId);
      console.log('   WebRTC manager exists:', !!webrtcManager);
      
      // Only process answer if we're in 'calling' state (we initiated the call)
      if (call?.callStatus !== 'calling') {
        console.warn('⚠️ Ignoring CALL_ANSWER - not in calling state');
        console.warn('   Expected: calling, Got:', call?.callStatus);
        return null;
      }

      // Additional validation: ensure we have an active outgoing call
      if (!call?.activeCall) {
        console.warn('⚠️ Ignoring CALL_ANSWER - no active call');
        return null;
      }

      if (!webrtcManager) {
        console.error('❌ WebRTC manager not initialized when receiving answer');
        throw new Error('WebRTC manager not initialized');
      }

      console.log('📞 Processing call answer from peer:', call.activeCall.peerId);
      await webrtcManager.setRemoteDescription(sdp, 'answer');
      console.log('✅ Call answer processed successfully');
      console.log('📞 ========== CALL_ANSWER PROCESSING COMPLETE ==========');

      return null;
    } catch (error) {
      console.error('❌ Error handling call answer:', error);
      console.error('   Error details:', error.message);
      return rejectWithValue(error.message);
    }
  }
);

// Queue for ICE candidates that arrive before WebRTC is initialized
let pendingIceCandidates = [];

/**
 * Handle ICE candidate from peer
 */
export const receiveICECandidate = createAsyncThunk(
  'call/receiveICE',
  async ({ candidate }, { rejectWithValue }) => {
    try {
      if (!webrtcManager) {
        console.warn('⚠️ WebRTC manager not initialized, queueing ICE candidate');
        pendingIceCandidates.push(candidate);
        console.log(`📦 Queued ICE candidate. Queue size: ${pendingIceCandidates.length}`);
        return null;
      }

      console.log('🧊 Received ICE candidate from peer');
      await webrtcManager.addICECandidate(candidate);

      return null;
    } catch (error) {
      console.error('❌ Error handling ICE candidate:', error);
      return rejectWithValue(error.message);
    }
  }
);

/**
 * Process queued ICE candidates after WebRTC is initialized
 */
const processQueuedIceCandidates = async () => {
  if (pendingIceCandidates.length === 0) {
    return;
  }

  console.log(`📦 Processing ${pendingIceCandidates.length} queued ICE candidates...`);
  
  for (const candidate of pendingIceCandidates) {
    try {
      await webrtcManager.addICECandidate(candidate);
      console.log('✅ Queued ICE candidate added');
    } catch (error) {
      console.error('❌ Failed to add queued ICE candidate:', error);
    }
  }
  
  pendingIceCandidates = [];
  console.log('✅ All queued ICE candidates processed');
};

/**
 * Handle call end from peer
 */
export const receiveCallEnd = () => {
  console.log('📞 Peer ended the call');

  // Cleanup WebRTC
  if (webrtcManager) {
    webrtcManager.close();
    webrtcManager = null;
  }

  return { type: 'call/receiveEnd' };
};

/**
 * Handle call rejection from peer
 */
export const receiveCallReject = () => {
  console.log('❌ Peer rejected the call');

  // Cleanup WebRTC
  if (webrtcManager) {
    webrtcManager.close();
    webrtcManager = null;
  }

  return { type: 'call/receiveReject' };
};

/**
 * Handle call busy from peer
 */
export const receiveCallBusy = () => (dispatch, getState) => {
  const { call } = getState();
  
  console.log('📵 Received CALL_BUSY signal, current state:', call?.callStatus);

  // Only process CALL_BUSY if we're still in 'calling' state
  // Ignore if already connected (duplicate busy signal)
  if (call?.callStatus === 'connected') {
    console.log('📵 Ignoring CALL_BUSY - already connected');
    return;
  }

  console.log('📵 Peer is busy - ending call');

  // Cleanup WebRTC
  if (webrtcManager) {
    webrtcManager.close();
    webrtcManager = null;
  }

  dispatch({ type: 'call/receiveBusy' });
};

/**
 * Set remote stream when received
 */
export const setRemoteStream = (stream) => ({
  type: 'call/setRemoteStream',
  payload: stream,
});

/**
 * Update connection state
 */
export const updateConnectionState = (state) => ({
  type: 'call/updateConnectionState',
  payload: state,
});

/**
 * Get WebRTC manager instance
 */
export const getWebRTCManager = () => webrtcManager;

/**
 * Setup WebRTC callbacks
 */
export const setupWebRTCCallbacks = (dispatch) => {
  if (!webrtcManager) return;

  // Handle remote stream
  webrtcManager.onRemoteStream((stream) => {
    console.log('📺 Remote stream received');
    dispatch(setRemoteStream(stream));
  });

  // Handle connection state changes
  webrtcManager.onConnectionStateChange((state) => {
    console.log('🔗 Connection state:', state);
    dispatch(updateConnectionState(state));
    
    // Handle connection failures
    if (state === 'failed' || state === 'disconnected') {
      console.error('❌ WebRTC connection failed or disconnected');
      
      // Cleanup
      if (webrtcManager) {
        webrtcManager.close();
        webrtcManager = null;
      }
      
      // Stop all sounds
      audioManager.stopAll();
    }
  });
};
