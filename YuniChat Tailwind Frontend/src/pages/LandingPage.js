import React, { useState } from 'react';
import { ChatBubbleLeftRightIcon } from '@heroicons/react/24/solid';
import LoginModal from './LoginModal';
import RegisterModal from './RegisterModal';
import GuestLoginModal from './GuestLoginModal';

const LandingPage = () => {
  const [loginOpen, setLoginOpen] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [guestLoginOpen, setGuestLoginOpen] = useState(false);

  const handleLoginOpen = () => setLoginOpen(true);
  const handleLoginClose = () => setLoginOpen(false);

  const handleRegisterOpen = () => setRegisterOpen(true);
  const handleRegisterClose = () => setRegisterOpen(false);

  const handleGuestLoginOpen = () => setGuestLoginOpen(true);
  const handleGuestLoginClose = () => setGuestLoginOpen(false);

  const handleSwitchToRegister = () => {
    setLoginOpen(false);
    setRegisterOpen(true);
  };

  const handleSwitchToLogin = () => {
    setRegisterOpen(false);
    setLoginOpen(true);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex flex-col items-center justify-center px-4 py-6 fixed top-0 left-0">
      {/* Hero Section */}
      <div className="text-center mb-8">
        <ChatBubbleLeftRightIcon className="w-20 h-20 text-white mx-auto mb-4" />
        <h1 className="text-4xl sm:text-5xl font-bold text-white mb-2">
          Welcome to YuniChat
        </h1>
        <p className="text-lg sm:text-xl text-white/90">
          Connect with friends and chat in real-time
        </p>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-md space-y-4">
        <button
          onClick={handleLoginOpen}
          className="w-full flex items-center justify-center gap-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold py-3 px-6 rounded-full text-base transition-colors"
        >
          <ChatBubbleLeftRightIcon className="w-5 h-5" />
          Login
        </button>

        <button
          onClick={handleGuestLoginOpen}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 px-6 rounded-full text-base transition-colors"
        >
          Guest login
        </button>

        <div className="text-center mt-4">
          <p className="text-white/90 text-sm mb-2">New here?</p>
          <button
            onClick={handleRegisterOpen}
            className="text-white underline font-semibold hover:bg-white/10 px-4 py-2 rounded transition-colors"
          >
            Register now
          </button>
        </div>
      </div>

      {/* Modals */}
      <LoginModal
        open={loginOpen}
        onClose={handleLoginClose}
        onSwitchToRegister={handleSwitchToRegister}
      />
      <RegisterModal
        open={registerOpen}
        onClose={handleRegisterClose}
        onSwitchToLogin={handleSwitchToLogin}
      />
      <GuestLoginModal open={guestLoginOpen} onClose={handleGuestLoginClose} />
    </div>
  );
};

export default LandingPage;
