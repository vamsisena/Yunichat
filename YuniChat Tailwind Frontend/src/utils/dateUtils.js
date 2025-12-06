/**
 * Format last seen display based on user status
 * @param {string} status - User status (online, offline, away, busy)
 * @param {string|Date} lastSeen - Last seen timestamp
 * @returns {string} Formatted last seen text
 */
export const formatLastSeen = (status, lastSeen) => {
  // If user is online, show "Online"
  if (status && status.toLowerCase() === 'online') {
    return 'Online';
  }

  // If no lastSeen data, show status
  if (!lastSeen) {
    return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Offline';
  }

  try {
    // Parse the timestamp
    let ts = lastSeen;
    if (typeof ts === 'string' && ts.includes('T')) {
      ts = ts.substring(0, 23) + 'Z';
    }
    
    const date = new Date(ts);
    if (isNaN(date.getTime())) {
      return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Offline';
    }

    // Format as "DD Month YYYY at HH:MM am/pm" in IST
    const options = {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const formatted = date.toLocaleString('en-IN', options);
    
    // Convert "DD Month YYYY, HH:MM am/pm" to "DD Month YYYY at HH:MM am/pm"
    const parts = formatted.split(', ');
    if (parts.length === 2) {
      return `${parts[0]} at ${parts[1].toLowerCase()}`;
    }
    
    return formatted.toLowerCase();
  } catch (error) {
    console.error('Error formatting last seen:', error);
    return status ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase() : 'Offline';
  }
};

/**
 * Format relative time (e.g., "2 minutes ago", "1 hour ago")
 * @param {string|Date} timestamp
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';

  try {
    let ts = timestamp;
    if (typeof ts === 'string' && ts.includes('T')) {
      ts = ts.substring(0, 23) + 'Z';
    }
    
    const date = new Date(ts);
    if (isNaN(date.getTime())) return '';

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    // For older dates, show full date
    return formatLastSeen(null, timestamp);
  } catch (error) {
    console.error('Error formatting relative time:', error);
    return '';
  }
};

/**
 * Smart format for status and last seen display
 * Shows status for online/busy/away, or relative time for recent offline activity
 * @param {string} status - User status (online, offline, away, busy)
 * @param {string|Date} lastSeen - Last seen timestamp
 * @returns {object} { text, showAsStatus } - formatted text and whether it's a status or last seen
 */
export const formatSmartLastSeen = (status, lastSeen) => {
  const statusLower = status?.toLowerCase();
  
  // Show status for online, busy, away
  if (statusLower === 'online') {
    return { text: 'Online', showAsStatus: true, isOnline: true };
  }
  
  if (statusLower === 'busy') {
    return { text: 'Busy', showAsStatus: true, isOnline: false };
  }
  
  if (statusLower === 'away') {
    return { text: 'Away', showAsStatus: true, isOnline: false };
  }
  
  // For offline, show last seen
  if (!lastSeen) {
    return { text: 'Offline', showAsStatus: true, isOnline: false };
  }
  
  try {
    let ts = lastSeen;
    if (typeof ts === 'string' && ts.includes('T')) {
      ts = ts.substring(0, 23) + 'Z';
    }
    
    const date = new Date(ts);
    if (isNaN(date.getTime())) {
      return { text: 'Offline', showAsStatus: true, isOnline: false };
    }

    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    // Show relative time for recent activity (within 7 days)
    if (diffMins < 1) {
      return { text: 'Just now', showAsStatus: false, isOnline: false };
    }
    if (diffMins < 60) {
      return { text: `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`, showAsStatus: false, isOnline: false };
    }
    if (diffHours < 24) {
      return { text: `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`, showAsStatus: false, isOnline: false };
    }
    if (diffDays < 7) {
      return { text: `${diffDays} day${diffDays > 1 ? 's' : ''} ago`, showAsStatus: false, isOnline: false };
    }
    
    // For older dates, show full date
    const options = {
      timeZone: 'Asia/Kolkata',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    };

    const formatted = date.toLocaleString('en-IN', options);
    const parts = formatted.split(', ');
    const fullDate = parts.length === 2 ? `${parts[0]} at ${parts[1].toLowerCase()}` : formatted.toLowerCase();
    
    return { text: fullDate, showAsStatus: false, isOnline: false };
  } catch (error) {
    console.error('Error formatting smart last seen:', error);
    return { text: 'Offline', showAsStatus: true, isOnline: false };
  }
};
