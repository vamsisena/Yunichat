/**
 * Media Permissions Utility
 * Handles microphone and camera permission requests
 * Following settings.json: proper error handling, no duplicate code
 */

/**
 * Request microphone permission for audio calls
 * @returns {Promise<{success: boolean, stream?: MediaStream, error?: string}>}
 */
export const requestMicrophonePermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true,
      video: false 
    });
    
    console.log('✅ Microphone permission granted');
    return { success: true, stream };
  } catch (error) {
    console.error('❌ Microphone permission denied:', error);
    
    let errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings.';
    
    if (error.name === 'NotFoundError') {
      errorMessage = 'No microphone found. Please connect a microphone and try again.';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = 'Microphone access denied. Please allow microphone permissions in your browser settings.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Microphone is already in use by another application.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Request camera and microphone permissions for video calls
 * @returns {Promise<{success: boolean, stream?: MediaStream, error?: string}>}
 */
export const requestCameraAndMicPermission = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      audio: true,
      video: true 
    });
    
    console.log('✅ Camera and microphone permissions granted');
    return { success: true, stream };
  } catch (error) {
    console.error('❌ Camera/microphone permission denied:', error);
    
    let errorMessage = 'Camera and microphone access denied. Please allow permissions in your browser settings.';
    
    if (error.name === 'NotFoundError') {
      errorMessage = 'No camera or microphone found. Please connect devices and try again.';
    } else if (error.name === 'NotAllowedError') {
      errorMessage = 'Camera and microphone access denied. Please allow permissions in your browser settings.';
    } else if (error.name === 'NotReadableError') {
      errorMessage = 'Camera or microphone is already in use by another application.';
    }
    
    return { success: false, error: errorMessage };
  }
};

/**
 * Check if browser supports getUserMedia
 * @returns {boolean}
 */
export const isMediaSupported = () => {
  return !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
};

/**
 * Stop all tracks in a media stream
 * @param {MediaStream} stream 
 */
export const stopMediaStream = (stream) => {
  if (stream && stream.getTracks) {
    stream.getTracks().forEach(track => {
      track.stop();
      console.log(`🛑 Stopped ${track.kind} track`);
    });
  }
};

/**
 * Check current permission status (if supported)
 * @param {string} permissionName - 'microphone' or 'camera'
 * @returns {Promise<string>} - 'granted', 'denied', 'prompt', or 'unsupported'
 */
export const checkPermissionStatus = async (permissionName) => {
  try {
    if (!navigator.permissions || !navigator.permissions.query) {
      return 'unsupported';
    }
    
    const result = await navigator.permissions.query({ name: permissionName });
    return result.state; // 'granted', 'denied', or 'prompt'
  } catch (error) {
    console.warn(`Permission status check not supported for ${permissionName}`);
    return 'unsupported';
  }
};
