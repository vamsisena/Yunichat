import React from 'react';

const ForgotPasswordModal = ({ open, onClose }) => {
  if (!open) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      <div className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold mb-4">Forgot Password</h2>
        <p>Password reset feature coming soon...</p>
      </div>
    </div>
  );
};

export default ForgotPasswordModal;
