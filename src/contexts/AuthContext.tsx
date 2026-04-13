import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { AUTH_TOKEN_KEY } from '../lib/apiAuth';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

type User = { id: string; name: string; email: string } | null;

type AuthContextValue = {
  user: User;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [token, setTokenState] = useState<string | null>(() => localStorage.getItem(AUTH_TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const setToken = useCallback((t: string | null) => {
    if (t) localStorage.setItem(AUTH_TOKEN_KEY, t);
    else localStorage.removeItem(AUTH_TOKEN_KEY);
    setTokenState(t);
  }, []);

  const loadUser = useCallback(async () => {
    const t = localStorage.getItem(AUTH_TOKEN_KEY);
    if (!t) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${t}` }
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
      } else {
        setToken(null);
        setUser(null);
      }
    } catch {
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, [setToken]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  const login = useCallback(async (email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
    } catch (err) {
      const msg = err instanceof Error && err.message === 'Failed to fetch'
        ? `Cannot reach the server. Start the backend (e.g. run "npm run dev" in the Backend folder) and ensure it is running at ${API_URL}`
        : (err instanceof Error ? err.message : 'Network error');
      throw new Error(msg);
    }
    const text = await res.text();
    let data: { error?: string; token?: string; user?: User } = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned an invalid response. Make sure the backend is running at ' + API_URL);
    }
    if (!res.ok) throw new Error(data.error || 'Login failed');
    setToken(data.token!);
    setUser(data.user!);
  }, [setToken]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    let res: Response;
    try {
      res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password })
      });
    } catch (err) {
      const msg = err instanceof Error && err.message === 'Failed to fetch'
        ? `Cannot reach the server. Start the backend (e.g. run "npm run dev" in the Backend folder) and ensure it is running at ${API_URL}`
        : (err instanceof Error ? err.message : 'Network error');
      throw new Error(msg);
    }
    const text = await res.text();
    let data: { error?: string; token?: string; user?: User } = {};
    try {
      data = JSON.parse(text);
    } catch {
      throw new Error('Server returned an invalid response. Make sure the backend is running at ' + API_URL);
    }
    if (!res.ok) throw new Error(data.error || 'Registration failed');
    setToken(data.token!);
    setUser(data.user!);
  }, [setToken]);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, [setToken]);

  const value: AuthContextValue = { user, token, loading, login, register, logout };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
