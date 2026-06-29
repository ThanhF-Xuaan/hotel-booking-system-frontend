import { create } from 'zustand';
import { User } from '../../../types/auth';

export interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
}

export interface AuthActions {
  login: (token: string, user: User) => void;
  logout: () => void;
}

const getStoredUser = (): User | null => {
  try {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) as User : null;
  } catch (e) {
    console.error('Failed to parse user from localStorage:', e);
    return null;
  }
};

export const useAuthStore = create<AuthState & AuthActions>((set) => ({
  token: localStorage.getItem('token') || null,
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem('token'),

  login: (token: string, user: User) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    set({ token, user, isAuthenticated: true });
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    set({ token: null, user: null, isAuthenticated: false });
  }
}));
