/**
 * Call Signaling Utility
 * Handles WebSocket signaling for WebRTC call setup
 */

import store from '../app/store';

/**
 * Get WebSocket client from Redux store
 */
const getClient = () => {
  const state = store.getState();
  return state?.websocket?.chatClient;
};

/**
 * Send call offer to initiate a call
 * @param {number} calleeId - ID of the user being called
 * @param {string} sdp - Session Description Protocol offer
 * @param {string} callType - 'AUDIO' or 'VIDEO'
 */
export const sendCallOffer = (calleeId, sdp, callType) => {
  const client = getClient();
  
  if (!client?.connected) {
    console.error('WebSocket not connected');
    throw new Error('WebSocket connection not available');
  }

  const signal = {
    type: 'CALL_OFFER',
    calleeId,
    sdp,
    callType,
  };

  console.log('📤 Sending CALL_OFFER:', signal);
  console.log('📤 WebSocket client state:', { connected: client.connected, active: client.active });
  
  try {
    client.publish({
      destination: '/app/call.signal',
      body: JSON.stringify(signal),
    });
    console.log('✅ CALL_OFFER published successfully');
  } catch (error) {
    console.error('❌ Error publishing CALL_OFFER:', error);
    throw error;
  }
};

/**
 * Send call answer to accept a call
 * @param {number} callerId - ID of the caller
 * @param {string} sdp - Session Description Protocol answer
 */
export const sendCallAnswer = (callerId, sdp) => {
  const client = getClient();
  
  if (!client?.connected) {
    console.error('WebSocket not connected');
    throw new Error('WebSocket connection not available');
  }

  const signal = {
    type: 'CALL_ANSWER',
    calleeId: callerId, // calleeId is used for routing to the peer
    sdp,
  };

  console.log('📤 Sending CALL_ANSWER:', signal);
  
  client.publish({
    destination: '/app/call.signal',
    body: JSON.stringify(signal),
  });
};

/**
 * Send ICE candidate for NAT traversal
 * @param {number} peerId - ID of the peer
 * @param {string} candidate - ICE candidate JSON string
 */
export const sendICECandidate = (peerId, candidate) => {
  const client = getClient();
  
  if (!client?.connected) {
    console.error('WebSocket not connected');
    return; // ICE candidates are best-effort, don't throw
  }

  const signal = {
    type: 'ICE_CANDIDATE',
    calleeId: peerId,
    candidate,
  };

  console.log('📤 Sending ICE_CANDIDATE to peer:', peerId);
  console.log('📤 ICE candidate signal:', signal);
  
  try {
    client.publish({
      destination: '/app/call.signal',
      body: JSON.stringify(signal),
    });
    console.log('✅ ICE_CANDIDATE published successfully');
  } catch (error) {
    console.error('❌ Error publishing ICE_CANDIDATE:', error);
  }
};

/**
 * Send call end signal
 * @param {number} peerId - ID of the peer to notify
 */
export const sendCallEnd = (peerId) => {
  const client = getClient();
  
  if (!client?.connected) {
    console.error('WebSocket not connected');
    return;
  }

  const signal = {
    type: 'CALL_END',
    calleeId: peerId,
  };

  console.log('📤 Sending CALL_END to peer:', peerId);
  
  client.publish({
    destination: '/app/call.signal',
    body: JSON.stringify(signal),
  });
};

/**
 * Send call reject signal
 * @param {number} callerId - ID of the caller being rejected
 */
export const sendCallReject = (callerId) => {
  const client = getClient();
  
  if (!client?.connected) {
    console.error('WebSocket not connected');
    return;
  }

  const signal = {
    type: 'CALL_REJECT',
    calleeId: callerId,
  };

  console.log('📤 Sending CALL_REJECT to caller:', callerId);
  
  client.publish({
    destination: '/app/call.signal',
    body: JSON.stringify(signal),
  });
};

/**
 * Send call busy signal (user is already in a call)
 * @param {number} callerId - ID of the caller
 */
export const sendCallBusy = (callerId) => {
  const client = getClient();
  
  if (!client?.connected) {
    console.error('WebSocket not connected');
    return;
  }

  const signal = {
    type: 'CALL_BUSY',
    calleeId: callerId,
  };

  console.log('📤 Sending CALL_BUSY to caller:', callerId);
  
  client.publish({
    destination: '/app/call.signal',
    body: JSON.stringify(signal),
  });
};
