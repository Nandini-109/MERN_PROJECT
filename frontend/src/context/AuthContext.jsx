import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import api from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

const readUser = () => {
  try { return JSON.parse(localStorage.getItem('skillswap_user')) || null; } catch { return null; }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(readUser); // { id, name, email, role } – same shape as before
  const [profile, setProfile] = useState(null); // full profile (avatar, skills, completion…)
  const [signedOut, setSignedOut] = useState(false); // true after a deliberate logout (guards send you home, not to /login)

  const refreshProfile = useCallback(async () => {
    try {
      const { data } = await api.get('/users/me');
      setProfile(data);
      return data;
    } catch { return null; }
  }, []);

  const login = useCallback((data) => {
    localStorage.setItem('skillswap_token', data.token);
    localStorage.setItem('skillswap_user', JSON.stringify(data.user));
    setUser(data.user);
    setSignedOut(false);
  }, []);

  const logout = useCallback((intentional = false) => {
    localStorage.removeItem('skillswap_token');
    localStorage.removeItem('skillswap_user');
    setUser(null);
    setProfile(null);
    setSignedOut(intentional === true);
  }, []);

  useEffect(() => { if (user) refreshProfile(); }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Token expired / revoked -> back to login.
  useEffect(() => {
    const onExpired = () => logout(false); // an expired session should send people to /login
    window.addEventListener('skillswap:unauthorized', onExpired);
    return () => window.removeEventListener('skillswap:unauthorized', onExpired);
  }, [logout]);

  const value = useMemo(() => ({ user, profile, signedOut, login, logout, refreshProfile }), [user, profile, signedOut, login, logout, refreshProfile]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
