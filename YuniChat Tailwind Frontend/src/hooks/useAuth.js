import { useSelector } from 'react-redux';

// Custom hook for authentication
const useAuth = () => {
  const authData = useSelector((state) => {
    return {
      loading: state?.auth?.loading,
      error: state?.auth?.error,
      user: state?.auth?.user,
      isAuthenticated: state?.auth?.isAuthenticated,
      isGuest: state?.auth?.isGuest,
    };
  });

  return authData;
};

export default useAuth;
