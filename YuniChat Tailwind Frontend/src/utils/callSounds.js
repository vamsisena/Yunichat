/**
 * Call Sounds Utility
 * Manages audio feedback for call events
 */

class CallSounds {
  constructor() {
    this.connectedSound = null;
  }

  /**
   * Play connected sound when call is established
   */
  playConnected() {
    try {
      if (!this.connectedSound) {
        this.connectedSound = new Audio('/sounds/call-connected.mp3');
        this.connectedSound.volume = 0.5;
      }
      this.connectedSound.currentTime = 0;
      this.connectedSound.play().catch((error) => {
        console.warn('Failed to play connected sound:', error);
      });
    } catch (error) {
      console.error('Error playing connected sound:', error);
    }
  }

  /**
   * Stop all sounds
   */
  stopAll() {
    if (this.connectedSound) {
      this.connectedSound.pause();
      this.connectedSound.currentTime = 0;
    }
  }

  /**
   * Cleanup resources
   */
  cleanup() {
    this.stopAll();
    this.connectedSound = null;
  }
}

// Export singleton instance
const callSoundsInstance = new CallSounds();
export default callSoundsInstance;
