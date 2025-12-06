/**
 * WebRTC Manager
 * Manages RTCPeerConnection for audio/video calls with free STUN servers
 */

import { sendICECandidate } from './callSignaling';

// Free STUN servers (Google)
const ICE_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

class WebRTCManager {
  constructor() {
    this.peerConnection = null;
    this.localStream = null;
    this.remoteStream = null;
    this.peerId = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;
    this.pendingICECandidates = []; // Queue for ICE candidates received before remote description
    this.remoteDescriptionSet = false; // Track if remote description has been set
  }

  /**
   * Create a new RTCPeerConnection
   * @param {number} peerId - ID of the peer user
   */
  createPeerConnection(peerId) {
    try {
      this.peerId = peerId;
      this.peerConnection = new RTCPeerConnection(ICE_SERVERS);

      console.log('📞 RTCPeerConnection created with STUN servers');

      // Handle ICE candidates
      this.peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          console.log('🧊 ICE candidate generated:', event.candidate);
          sendICECandidate(peerId, JSON.stringify(event.candidate));
        } else {
          console.log('🧊 All ICE candidates have been sent');
        }
      };

      // Handle remote stream
      this.peerConnection.ontrack = (event) => {
        console.log('📺 Remote track received:', event.track.kind);
        
        if (!this.remoteStream) {
          this.remoteStream = new MediaStream();
        }
        
        this.remoteStream.addTrack(event.track);
        
        if (this.onRemoteStreamCallback) {
          this.onRemoteStreamCallback(this.remoteStream);
        }
      };

      // Handle connection state changes
      this.peerConnection.onconnectionstatechange = () => {
        const state = this.peerConnection?.connectionState;
        console.log('🔗 ========================================');
        console.log('🔗 CONNECTION STATE CHANGED:', state);
        console.log('🔗 Signaling state:', this.peerConnection?.signalingState);
        console.log('🔗 ICE connection state:', this.peerConnection?.iceConnectionState);
        console.log('🔗 ICE gathering state:', this.peerConnection?.iceGatheringState);
        console.log('🔗 Timestamp:', new Date().toISOString());
        console.log('🔗 ========================================');

        if (this.onConnectionStateChangeCallback) {
          this.onConnectionStateChangeCallback(state);
        }

        // Handle connection failures
        if (state === 'failed') {
          console.error('❌ ========================================');
          console.error('❌ CONNECTION FAILED!');
          console.error('❌ ICE state:', this.peerConnection?.iceConnectionState);
          console.error('❌ Signaling state:', this.peerConnection?.signalingState);
          console.error('❌ This usually means ICE candidates failed to establish connection');
          console.error('❌ ========================================');
        } else if (state === 'disconnected') {
          console.warn('⚠️ Connection disconnected - may reconnect automatically');
        } else if (state === 'connected') {
          console.log('✅ ========================================');
          console.log('✅ CONNECTION ESTABLISHED SUCCESSFULLY!');
          console.log('✅ Timer should start now!');
          console.log('✅ ICE state:', this.peerConnection?.iceConnectionState);
          console.log('✅ ========================================');
        }
      };

      // Handle ICE connection state changes
      this.peerConnection.oniceconnectionstatechange = () => {
        const state = this.peerConnection?.iceConnectionState;
        console.log('🧊 ========================================');
        console.log('🧊 ICE CONNECTION STATE CHANGED:', state);
        console.log('🧊 Connection state:', this.peerConnection?.connectionState);
        console.log('🧊 Signaling state:', this.peerConnection?.signalingState);
        console.log('🧊 Timestamp:', new Date().toISOString());
        console.log('🧊 ========================================');

        if (state === 'failed') {
          console.error('❌ ICE connection FAILED - NAT/firewall issue or no valid candidates');
          console.error('   This will trigger connection state to fail');
        } else if (state === 'disconnected') {
          console.warn('⚠️ ICE connection DISCONNECTED - may reconnect automatically');
        } else if (state === 'connected' || state === 'completed') {
          console.log('✅ ICE connection successful:', state);
        }
      };

      return this.peerConnection;
    } catch (error) {
      console.error('❌ Error creating peer connection:', error);
      throw error;
    }
  }

  /**
   * Get local media stream (audio/video)
   * @param {boolean} video - Include video
   * @param {boolean} audio - Include audio
   * @returns {Promise<MediaStream>}
   */
  async getLocalStream(video = false, audio = true) {
    try {
      const constraints = { video, audio };
      console.log('🎤 Requesting local media:', constraints);

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      console.log('✅ Local media stream obtained');

      return this.localStream;
    } catch (error) {
      console.error('❌ Error getting local stream:', error);
      throw error;
    }
  }

  /**
   * Add local stream tracks to peer connection
   */
  addLocalStreamToPeer() {
    if (!this.localStream || !this.peerConnection) {
      throw new Error('Local stream or peer connection not initialized');
    }

    this.localStream.getTracks().forEach((track) => {
      console.log('➕ Adding local track to peer connection:', track.kind);
      this.peerConnection.addTrack(track, this.localStream);
    });
  }

  /**
   * Create and return SDP offer
   * @returns {Promise<string>} SDP offer
   */
  async createOffer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      console.log('📝 Creating SDP offer...');
      const offer = await this.peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });

      await this.peerConnection.setLocalDescription(offer);
      console.log('✅ Local description set (offer)');

      return offer.sdp;
    } catch (error) {
      console.error('❌ Error creating offer:', error);
      throw error;
    }
  }

  /**
   * Create and return SDP answer
   * @returns {Promise<string>} SDP answer
   */
  async createAnswer() {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      console.log('📝 Creating SDP answer...');
      const answer = await this.peerConnection.createAnswer();

      await this.peerConnection.setLocalDescription(answer);
      console.log('✅ Local description set (answer)');

      return answer.sdp;
    } catch (error) {
      console.error('❌ Error creating answer:', error);
      throw error;
    }
  }

  /**
   * Set remote SDP (offer or answer)
   * @param {string} sdp - Remote SDP
   * @param {string} type - 'offer' or 'answer'
   */
  async setRemoteDescription(sdp, type) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      const currentState = this.peerConnection.signalingState;
      console.log(`📝 Setting remote description (${type})...`);
      console.log(`   Current signaling state: ${currentState}`);
      console.log(`   Remote description already set: ${this.remoteDescriptionSet}`);

      // Validate state before setting remote description
      if (type === 'answer') {
        if (currentState !== 'have-local-offer') {
          console.error(`❌ Cannot set remote answer in state: ${currentState}. Expected 'have-local-offer'`);
          console.error(`   This usually means the answer arrived too late or the offer was not set properly`);
          throw new Error(`Invalid state for setting remote answer: ${currentState}`);
        }
      }

      if (type === 'offer') {
        if (currentState !== 'stable') {
          console.warn(`⚠️ Setting remote offer in non-stable state: ${currentState}`);
          // Allow it to proceed but log warning
        }
      }

      await this.peerConnection.setRemoteDescription(
        new RTCSessionDescription({ type, sdp })
      );
      
      const newState = this.peerConnection.signalingState;
      console.log(`✅ Remote description set (${type})`);
      console.log(`   New signaling state: ${newState}`);
      
      // Verify remote description was actually set
      if (this.peerConnection.remoteDescription) {
        console.log(`   Remote description verified: type=${this.peerConnection.remoteDescription.type}`);
        this.remoteDescriptionSet = true;
      } else {
        console.error('❌ Remote description set but verification failed!');
      }
      
      // Process any pending ICE candidates that arrived early
      if (this.pendingICECandidates.length > 0) {
        console.log(`🧊 Processing ${this.pendingICECandidates.length} pending ICE candidates`);
        for (const candidate of this.pendingICECandidates) {
          try {
            await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
            console.log('✅ Pending ICE candidate added');
          } catch (err) {
            console.error('❌ Error adding pending ICE candidate:', err);
          }
        }
        this.pendingICECandidates = [];
      }
    } catch (error) {
      console.error('❌ Error setting remote description:', error);
      throw error;
    }
  }

  /**
   * Add ICE candidate from peer
   * @param {string} candidateJson - ICE candidate JSON string
   */
  async addICECandidate(candidateJson) {
    try {
      if (!this.peerConnection) {
        throw new Error('Peer connection not initialized');
      }

      const candidate = JSON.parse(candidateJson);
      
      // If remote description not set yet, queue the candidate
      if (!this.remoteDescriptionSet) {
        console.log('🧊 Queueing ICE candidate (remote description not set yet)');
        this.pendingICECandidates.push(candidate);
        return;
      }

      console.log('🧊 Adding ICE candidate from peer');
      await this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ Error adding ICE candidate:', error);
      // Don't throw - ICE candidates are best-effort
    }
  }

  /**
   * Set callback for when remote stream is received
   * @param {Function} callback - Callback function(stream)
   */
  onRemoteStream(callback) {
    this.onRemoteStreamCallback = callback;
  }

  /**
   * Set callback for connection state changes
   * @param {Function} callback - Callback function(state)
   */
  onConnectionStateChange(callback) {
    this.onConnectionStateChangeCallback = callback;
  }

  /**
   * Stop local media stream
   */
  stopLocalStream() {
    if (this.localStream) {
      console.log('🛑 Stopping local media stream');
      this.localStream.getTracks().forEach((track) => {
        track.stop();
      });
      this.localStream = null;
    }
  }

  /**
   * Close peer connection and cleanup
   */
  close() {
    console.log('🔌 Closing WebRTC connection');

    this.stopLocalStream();

    if (this.peerConnection) {
      this.peerConnection.close();
      this.peerConnection = null;
    }

    this.remoteStream = null;
    this.pendingICECandidates = [];
    this.remoteDescriptionSet = false;
    this.peerId = null;
    this.onRemoteStreamCallback = null;
    this.onConnectionStateChangeCallback = null;

    console.log('✅ WebRTC connection closed');
  }

  /**
   * Get current connection state
   * @returns {string|null}
   */
  getConnectionState() {
    return this.peerConnection?.connectionState || null;
  }

  /**
   * Check if connection is active
   * @returns {boolean}
   */
  isConnected() {
    return this.peerConnection?.connectionState === 'connected';
  }
}

export default WebRTCManager;
