import { create } from 'zustand';
import Cookies from 'js-cookie';
import { api } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: 'root' | 'gestor' | 'gestor_operacional' | 'cidadao';
}

interface AuthState {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  
  login: (user) => {
    Cookies.set('user', JSON.stringify(user), { expires: 1 });
    Cookies.set('userRole', user.role, { expires: 1 });
    set({ user });
  },
  
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.error(e);
    }
    Cookies.remove('user');
    Cookies.remove('userRole');
    set({ user: null });
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  },

  init: () => {
    const userStr = Cookies.get('user');
    if (userStr) {
      try {
        set({ user: JSON.parse(userStr) });
      } catch (e) {
        Cookies.remove('user');
        Cookies.remove('userRole');
      }
    }
  }
}));

// Listener for 401 Unauthorized
if (typeof window !== 'undefined') {
  window.addEventListener('auth-unauthorized', () => {
    useAuthStore.getState().logout();
  });
}
