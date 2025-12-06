/**
 * Get avatar background color based on user's gender
 * @param {string} gender - User's gender ('male', 'female', 'm', 'f', etc.)
 * @returns {string} Tailwind color class
 */
export const getAvatarColor = (gender) => {
  if (!gender || gender === 'null' || gender === 'undefined') return 'bg-green-500'; // Green for unspecified
  const genderLower = String(gender).toLowerCase().trim();
  if (genderLower === 'male' || genderLower === 'm') return 'bg-blue-500'; // Blue
  if (genderLower === 'female' || genderLower === 'f') return 'bg-purple-500'; // Purple
  if (genderLower === 'others' || genderLower === 'other') return 'bg-green-500'; // Green for others
  return 'bg-green-500'; // Green for any unrecognized value
};

/**
 * Get avatar background color with transparency check for image
 * @param {string} avatarUrl - User's avatar image URL
 * @param {string} gender - User's gender
 * @returns {string} Empty string if avatarUrl exists, otherwise gender-based color class
 */
export const getAvatarBgColor = (avatarUrl, gender) => {
  return avatarUrl ? '' : getAvatarColor(gender);
};

/**
 * Get hex color for avatar (for use in non-Tailwind contexts)
 */
export const getAvatarColorHex = (gender) => {
  if (!gender || gender === 'null' || gender === 'undefined') return '#10b981';
  const genderLower = String(gender).toLowerCase().trim();
  if (genderLower === 'male' || genderLower === 'm') return '#3b82f6';
  if (genderLower === 'female' || genderLower === 'f') return '#a855f7';
  if (genderLower === 'others' || genderLower === 'other') return '#10b981';
  return '#10b981';
};
