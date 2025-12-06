// Validate email
export const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(String(email).toLowerCase());
};

// Validate username (3-20 characters, alphanumeric and underscore)
export const validateUsername = (username) => {
  const re = /^[a-zA-Z0-9_]{3,20}$/;
  return re.test(username);
};

// Validate password (minimum 6 characters)
export const validatePassword = (password) => {
  return password && password.length >= 6;
};

// Validate full name (2-50 characters)
export const validateFullName = (name) => {
  return name && name.trim().length >= 2 && name.trim().length <= 50;
};

// Validate message (not empty, max 2000 characters)
export const validateMessage = (message) => {
  return message && message.trim().length > 0 && message.trim().length <= 2000;
};

// Validate file size
export const validateFileSize = (file, maxSize) => {
  return file.size <= maxSize;
};

// Validate file type
export const validateFileType = (file, allowedTypes) => {
  return allowedTypes.includes(file.type);
};
