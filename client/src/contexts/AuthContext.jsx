import { createContext, useContext, useState, useEffect } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import api from '../api/client';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const {
    user: auth0User,
    isAuthenticated,
    isLoading: auth0Loading,
    loginWithRedirect,
    logout,
    getIdTokenClaims
  } = useAuth0();

  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [agency, setAgency] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If Auth0 is still loading, wait
    if (auth0Loading) return;

    if (isAuthenticated && auth0User) {
      syncWithBackend();
    } else {
      setLoading(false);
      setUser(null);
      setProfile(null);
      setAgency(null);
    }
  }, [isAuthenticated, auth0User, auth0Loading]);

  const syncWithBackend = async () => {
    try {
      const claims = await getIdTokenClaims();
      const token = claims.__raw;
      localStorage.setItem('auth_token', token); // For legacy compatibility with api instance

      const response = await api.get('/auth/me'); // Or just fetch if it's auto-provisioned

      setProfile(response.data.user || response.data);
      setUser({ email: auth0User.email });

      if (response.data.user?.agencies || response.data?.agencies) {
        setAgency(response.data.user?.agencies || response.data?.agencies);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async () => {
    await loginWithRedirect();
  };

  const signUp = async () => {
    await loginWithRedirect({
      authorizationParams: {
        screen_hint: 'signup',
      }
    });
  };

  const signOut = async () => {
    localStorage.removeItem('auth_token');
    await logout({ logoutParams: { returnTo: window.location.origin } });
  };

  const value = {
    user,
    profile,
    agency,
    loading: loading || auth0Loading,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
