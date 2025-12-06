/**
 * Call Eligibility Utility
 * Determines if audio/video calls are allowed based on user status and chat type
 * Following settings.json: no duplicate code, proper validation
 */

/**
 * Check if user is eligible for calling features
 * @param {object} user - Current user object
 * @returns {boolean}
 */
export const isUserEligibleForCalls = (user) => {
  // Only registered users can make calls
  if (!user || user.isGuest === true) {
    return false;
  }
  
  return true;
};

/**
 * Check if call is allowed in current chat context
 * @param {boolean} isPrivateChat - Whether current chat is private (1-to-1)
 * @param {boolean} isGroupChat - Whether current chat is a group
 * @returns {boolean}
 */
export const isCallAllowedInChat = (isPrivateChat, isGroupChat = false) => {
  // Calls only allowed in private 1-to-1 chats
  if (isPrivateChat && !isGroupChat) {
    return true;
  }
  
  return false;
};

/**
 * Get call eligibility error message
 * @param {object} user - Current user object
 * @param {boolean} isPrivateChat - Whether current chat is private
 * @returns {string|null} - Error message or null if eligible
 */
export const getCallEligibilityError = (user, isPrivateChat) => {
  if (!user) {
    return 'You must be logged in to make calls';
  }
  
  if (user.isGuest === true) {
    return 'Guest users cannot make audio or video calls. Please register for a full account.';
  }
  
  if (!isPrivateChat) {
    return 'Audio and video calls are only available in private chats';
  }
  
  return null;
};

/**
 * Validate call participants
 * @param {object} currentUser - Current user object
 * @param {object} otherUser - Other user in the chat
 * @returns {{valid: boolean, error?: string}}
 */
export const validateCallParticipants = (currentUser, otherUser) => {
  if (!currentUser || !otherUser) {
    return { valid: false, error: 'Invalid participants' };
  }
  
  if (currentUser.isGuest === true) {
    return { valid: false, error: 'Guest users cannot make calls' };
  }
  
  if (otherUser.isGuest === true) {
    return { valid: false, error: 'Cannot call guest users' };
  }
  
  if (currentUser.id === otherUser.id) {
    return { valid: false, error: 'Cannot call yourself' };
  }
  
  return { valid: true };
};
