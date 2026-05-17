/* eslint-disable react/prop-types */
import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import { getCurrentUser, loginUser, registerUser } from '../services/api.js';

const AUTH_STORAGE_KEY = 'jewelaura_token';
const USER_STORAGE_KEY = 'jewelaura_user';

const AuthContext = createContext(null);

function readStoredToken() {
  if (typeof globalThis.localStorage === 'undefined') {
    return '';
  }

  return globalThis.localStorage.getItem(AUTH_STORAGE_KEY) || '';
}

function readStoredUser() {
  if (typeof globalThis.localStorage === 'undefined') {
    return null;
  }

  try {
    const storedUser = globalThis.localStorage.getItem(USER_STORAGE_KEY);
    return storedUser ? JSON.parse(storedUser) : null;
  } catch {
    return null;
  }
}

function persistAuth(token, user) {
  if (typeof globalThis.localStorage === 'undefined') {
    return;
  }

  if (token) {
    globalThis.localStorage.setItem(AUTH_STORAGE_KEY, token);
  } else {
    globalThis.localStorage.removeItem(AUTH_STORAGE_KEY);
  }

  if (user) {
    globalThis.localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    globalThis.localStorage.removeItem(USER_STORAGE_KEY);
  }
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(readStoredToken);
  const [user, setUser] = useState(readStoredUser);
  const [isLoading, setIsLoading] = useState(Boolean(readStoredToken()));
  const [authError, setAuthError] = useState('');

  useEffect(() => {
    async function restoreSession() {
      const storedToken = readStoredToken();

      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setAuthError('');

      try {
        const response = await getCurrentUser(storedToken);
        setToken(storedToken);
        setUser(response.user);
        persistAuth(storedToken, response.user);
      } catch (error) {
        setToken('');
        setUser(null);
        persistAuth('', null);
        setAuthError(error.response?.data?.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  const login = useCallback(async (credentials) => {
    setIsLoading(true);
    setAuthError('');

    try {
      const response = await loginUser(credentials);
      setToken(response.token);
      setUser(response.user);
      persistAuth(response.token, response.user);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng thử lại.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const register = useCallback(async (payload) => {
    setIsLoading(true);
    setAuthError('');

    try {
      const response = await registerUser(payload);
      setToken(response.token);
      setUser(response.user);
      persistAuth(response.token, response.user);
      return response;
    } catch (error) {
      const message = error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại.';
      setAuthError(message);
      throw new Error(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken('');
    setUser(null);
    setAuthError('');
    persistAuth('', null);
  }, []);

  const clearAuthError = useCallback(() => {
    setAuthError('');
  }, []);

  const value = useMemo(
    () => ({
      token,
      user,
      isAuthenticated: Boolean(token && user),
      isLoading,
      authError,
      login,
      register,
      logout,
      clearAuthError
    }),
    [token, user, isLoading, authError, login, register, logout, clearAuthError]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export { AuthContext };
