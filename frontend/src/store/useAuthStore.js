import { create } from 'zustand';
import api from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';

// Lazy import to avoid circular dep — ProtectedRoute exports this helper
const resetAuth = () => {
  try { require('../components/ProtectedRoute').resetAuthVerification?.(); } catch {}
};

// Decode JWT payload immediately (no async needed)
const decodeToken = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const storedToken = localStorage.getItem('token');
const decodedUser = storedToken ? decodeToken(storedToken) : null;

export const useAuthStore = create((set) => ({
  user: decodedUser ? { _id: decodedUser.id, name: decodedUser.name, role: decodedUser.role } : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/login', credentials);
      const data = response.data.data ? response.data.data : response.data;
      const user = data.user;
      const token = data.accessToken;

      localStorage.setItem('token', token);
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken);
      }

      // Connect WebSocket after successful login
      connectSocket(token);

      set({ user, token, isAuthenticated: true, isLoading: false, error: null });
      return data;
    } catch (error) {
      const msg = error.response?.data?.message || error.apiMessage || 'Login failed. Check your credentials.';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  register: async (userData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/auth/register', userData);
      set({ isLoading: false, error: null });
      return response.data;
    } catch (error) {
      const msg = error.response?.data?.message || error.apiMessage || 'Registration failed. Please try again.';
      set({ error: msg, isLoading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    disconnectSocket();
    resetAuth();
    set({ user: null, token: null, isAuthenticated: false, error: null });
  },

  // Called by ProtectedRoute to hydrate full user data from server
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      set({ isAuthenticated: false, isLoading: false });
      return;
    }

    set({ isLoading: true });
    try {
      const response = await api.get('/auth/me');
      const user = response.data.data?.user || response.data.user || response.data.data;

      // Re-read token from localStorage — may have been silently refreshed by the interceptor
      const currentToken = localStorage.getItem('token');
      connectSocket(currentToken || token);

      set({ user, token: currentToken || token, isAuthenticated: true, isLoading: false });
    } catch {
      localStorage.removeItem('token');
      disconnectSocket();
      set({ user: null, token: null, isAuthenticated: false, isLoading: false });
    }
  }
}));
