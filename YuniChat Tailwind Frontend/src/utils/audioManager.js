/**
 * Audio Manager
 * Manages all audio elements (ringtones) in the call system
 */

class AudioManager {
  constructor() {
    this.audioElements = new Map();
  }

  /**
   * Register an audio element for management
   * @param {string} id - Unique identifier for the audio element
   * @param {HTMLAudioElement} audioElement - The audio element
   */
  register(id, audioElement) {
    if (audioElement) {
      this.audioElements.set(id, audioElement);
      console.log(`🔊 Registered audio element: ${id}`);
    }
  }

  /**
   * Unregister an audio element
   * @param {string} id - Unique identifier for the audio element
   */
  unregister(id) {
    if (this.audioElements.has(id)) {
      this.stopAndCleanup(id);
      this.audioElements.delete(id);
      console.log(`🔇 Unregistered audio element: ${id}`);
    }
  }

  /**
   * Stop and cleanup a specific audio element
   * @param {string} id - Unique identifier for the audio element
   */
  stopAndCleanup(id) {
    const audioElement = this.audioElements.get(id);
    if (audioElement) {
      try {
        audioElement.pause();
        audioElement.currentTime = 0;
        audioElement.srcObject = null;
        console.log(`⏹️ Stopped audio: ${id}`);
      } catch (error) {
        console.error(`Error stopping audio ${id}:`, error);
      }
    }
  }

  /**
   * Stop all registered audio elements
   */
  stopAll() {
    console.log('🔇 Stopping all audio elements...');
    this.audioElements.forEach((audioElement, id) => {
      this.stopAndCleanup(id);
    });
  }

  /**
   * Clear all registered audio elements
   */
  clear() {
    this.stopAll();
    this.audioElements.clear();
    console.log('✅ All audio elements cleared');
  }

  /**
   * Check if an audio element is registered
   * @param {string} id - Unique identifier for the audio element
   * @returns {boolean}
   */
  has(id) {
    return this.audioElements.has(id);
  }

  /**
   * Get the number of registered audio elements
   * @returns {number}
   */
  get count() {
    return this.audioElements.size;
  }
}

// Singleton instance
const audioManager = new AudioManager();

export default audioManager;
