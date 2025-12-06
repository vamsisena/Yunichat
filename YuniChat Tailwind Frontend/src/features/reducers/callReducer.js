/**
 * Call Reducer
 * Redux reducer for managing call state
 */

import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  // Current active call
  activeCall: null, // { peerId, peerUsername, peerAvatarUrl, peerGender, callType, localStream, remoteStream, connectionState }
  
  // Incoming call (when receiving CALL_OFFER)
  incomingCall: null, // { callerId, callerUsername, callType, sdp }
  
  // Call status: 'idle', 'calling', 'ringing', 'connected', 'ended', 'rejected', 'busy', 'failed'
  callStatus: 'idle',
  
  // Error message
  error: null,
  
  // Loading states
  isInitiating: false,
  isAccepting: false,
};

const callSlice = createSlice({
  name: 'call',
  initialState,
  reducers: {
    // Handle incoming call offer
    receiveOffer: (state, action) => {
      console.log('📞 receiveOffer reducer - payload:', action.payload);
      console.log('📞 receiveOffer reducer - current state:', { activeCall: state.activeCall, callStatus: state.callStatus });
      
      const { callerId, callerUsername, callType, sdp } = action.payload;
      
      // If already in a call, ignore
      if (state.activeCall || state.callStatus !== 'idle') {
        console.warn('⚠️ Ignoring incoming call - already in call');
        return;
      }

      console.log('📞 Setting incoming call state');
      state.incomingCall = {
        callerId,
        callerUsername,
        callType,
        sdp,
      };
      state.callStatus = 'ringing';
      state.error = null;
      console.log('📞 Incoming call state updated:', state.incomingCall);
    },

    // Handle call end from peer
    receiveEnd: (state) => {
      state.activeCall = null;
      state.incomingCall = null;
      state.callStatus = 'ended';
      state.error = 'Call ended by other user';
    },

    // Handle call rejection from peer
    receiveReject: (state) => {
      state.activeCall = null;
      state.incomingCall = null;
      state.callStatus = 'rejected';
      state.error = 'Call was rejected';
    },

    // Handle call busy from peer
    receiveBusy: (state) => {
      state.activeCall = null;
      state.incomingCall = null;
      state.callStatus = 'busy';
      state.error = 'User is busy';
    },

    // Set remote stream
    setRemoteStream: (state, action) => {
      if (state.activeCall) {
        state.activeCall.remoteStream = action.payload;
      }
    },

    // Update connection state
    updateConnectionState: (state, action) => {
      if (state.activeCall) {
        const previousState = state.activeCall.connectionState;
        state.activeCall.connectionState = action.payload;
        
        console.log('🔄 updateConnectionState reducer called');
        console.log('   Previous connection state:', previousState);
        console.log('   New connection state:', action.payload);
        console.log('   Current call status:', state.callStatus);
        
        // Update call status based on connection state
        if (action.payload === 'connected' && previousState !== 'connected') {
          console.log('✅ CONNECTION ESTABLISHED - Setting callStatus to "connected"');
          console.log('   This should trigger timer to start!');
          state.callStatus = 'connected';
          // Play connected sound (handled in middleware/component)
        } else if (action.payload === 'failed') {
          console.log('❌ Connection FAILED');
          state.callStatus = 'failed';
          state.error = 'Connection failed';
        } else if (action.payload === 'disconnected') {
          console.log('⚠️ Connection DISCONNECTED - may reconnect');
          // Don't immediately fail on disconnect, it may reconnect
          // Only fail if it stays disconnected for too long
        }
      } else {
        console.warn('⚠️ updateConnectionState called but no active call!');
      }
    },

    // Clear call state
    clearCall: (state) => {
      state.activeCall = null;
      state.incomingCall = null;
      state.callStatus = 'idle';
      state.error = null;
      state.isInitiating = false;
      state.isAccepting = false;
    },
  },
  extraReducers: (builder) => {
    // Initiate call
    builder
      .addCase('call/initiate/pending', (state) => {
        state.isInitiating = true;
        state.callStatus = 'calling';
        state.error = null;
      })
      .addCase('call/initiate/fulfilled', (state, action) => {
        state.isInitiating = false;
        state.activeCall = {
          peerId: action.payload.calleeId,
          peerUsername: action.payload.calleeUsername,
          peerAvatarUrl: action.payload.peerAvatarUrl,
          peerGender: action.payload.peerGender,
          callType: action.payload.callType,
          localStream: action.payload.localStream,
          remoteStream: null,
          connectionState: 'new',
        };
        state.callStatus = 'calling';
      })
      .addCase('call/initiate/rejected', (state, action) => {
        state.isInitiating = false;
        state.callStatus = 'failed';
        state.error = action.payload || 'Failed to initiate call';
      });

    // Accept call
    builder
      .addCase('call/accept/pending', (state) => {
        state.isAccepting = true;
        state.error = null;
      })
      .addCase('call/accept/fulfilled', (state, action) => {
        state.isAccepting = false;
        state.activeCall = {
          peerId: action.payload.callerId,
          peerUsername: action.payload.callerUsername,
          peerAvatarUrl: action.payload.peerAvatarUrl,
          peerGender: action.payload.peerGender,
          callType: action.payload.callType,
          localStream: action.payload.localStream,
          remoteStream: null,
          connectionState: 'new',
        };
        state.incomingCall = null;
        // Stay in 'calling' state (waiting for connection), not 'connected'
        // updateConnectionState will set to 'connected' when WebRTC connection succeeds
        state.callStatus = 'calling';
      })
      .addCase('call/accept/rejected', (state, action) => {
        state.isAccepting = false;
        state.callStatus = 'failed';
        state.error = action.payload || 'Failed to accept call';
        state.incomingCall = null;
      });

    // Reject call
    builder
      .addCase('call/reject/fulfilled', (state) => {
        state.incomingCall = null;
        state.callStatus = 'idle';
        state.error = null;
      });

    // End call
    builder
      .addCase('call/end/fulfilled', (state) => {
        state.activeCall = null;
        state.incomingCall = null;
        state.callStatus = 'ended';
        state.error = 'You ended the call';
      });

    // Receive call answer
    builder
      .addCase('call/receiveAnswer/fulfilled', (state) => {
        // Answer received and processed, stay in 'calling' state
        // Status will be updated to 'connected' by updateConnectionState
        console.log('✅ Call answer processed, waiting for connection...');
      })
      .addCase('call/receiveAnswer/rejected', (state, action) => {
        state.callStatus = 'failed';
        state.error = action.payload || 'Failed to process call answer';
      });

    // Receive ICE candidate
    builder
      .addCase('call/receiveICE/rejected', (state, action) => {
        console.error('Failed to add ICE candidate:', action.payload);
        // Don't change call status for ICE failures (best-effort)
      });
  },
});

export const {
  receiveOffer,
  receiveEnd,
  receiveReject,
  receiveBusy,
  setRemoteStream,
  updateConnectionState,
  clearCall,
} = callSlice.actions;

export default callSlice.reducer;
