import React, { Suspense, lazy, useEffect, useState, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import useAuth from './hooks/useAuth';
import { setMobileView } from './features/actions/uiActions';
import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';
import OutgoingCallModal from './components/OutgoingCallModal';
import IncomingCallModal from './components/IncomingCallModal';
import ActiveCallWindow from './components/ActiveCallWindow';
import CallStatusNotification from './components/CallStatusNotification';

// Create Theme Context
export const ThemeContext = createContext({
  isDarkMode: false,
  toggleTheme: () => {},
});

// Hook to use theme context
export const useThemeMode = () => useContext(ThemeContext);

// Lazy load pages
const LandingPage = lazy(() => import('./pages/LandingPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));

// Loading component
const LoadingScreen = () => (
  <div className="flex justify-center items-center min-h-screen bg-gray-50 dark:bg-gray-900">
    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
  </div>
);

// Protected route component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }
  
  return children;
};

function App() {
  const { isAuthenticated, user } = useAuth();
  const dispatch = useDispatch();
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      // Toggle dark class on html element
      if (newMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return newMode;
    });
  };

  // Initialize dark mode on mount
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  // Debug authentication state
  useEffect(() => {
    console.log('=== APP.JS: Authentication State ===', { 
      isAuthenticated, 
      user,
      userFromStorage: localStorage.getItem('yunichat_user'),
      tokenFromStorage: localStorage.getItem('yunichat_token') ? 'EXISTS' : 'NONE'
    });
  }, [isAuthenticated, user]);

  // Handle window resize for mobile view
  useEffect(() => {
    const handleResize = () => {
      dispatch(setMobileView(window.innerWidth < 960));
    };

    window.addEventListener('resize', handleResize);
    handleResize(); // Initial check

    return () => window.removeEventListener('resize', handleResize);
  }, [dispatch]);

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme }}>
      <Router>
        <Suspense fallback={<LoadingScreen />}>
          {/* Call UI Components */}
          <OutgoingCallModal />
          <IncomingCallModal />
          <ActiveCallWindow />
          <CallStatusNotification />
          
          <Routes>
            {/* Public routes */}
            <Route
              path="/"
              element={
                isAuthenticated ? (
                  <Navigate to="/chat" replace />
                ) : (
                  <AuthLayout>
                    <LandingPage />
                  </AuthLayout>
                )
              }
            />

            {/* Protected routes */}
            <Route
              path="/chat"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ChatPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <ProfilePage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <MainLayout>
                    <SettingsPage />
                  </MainLayout>
                </ProtectedRoute>
              }
            />

            {/* Catch all - redirect to landing or chat */}
            <Route
              path="*"
              element={
                <Navigate to={isAuthenticated ? '/chat' : '/'} replace />
              }
            />
          </Routes>
        </Suspense>
      </Router>
    </ThemeContext.Provider>
  );
}

export default App;
