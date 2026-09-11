import { create } from 'zustand';
import Cookies from 'js-cookie';

interface User {
  id: string;
  name: string;
  email: string;
  role: 'root' | 'gestor_operacional' | 'cidadao';
}

interface AuthState {
  token: string | null;
  user: User | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  init: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  token: null,
  user: null,
  
  login: (token, user) => {
    Cookies.set('token', token, { expires: 1 });
    Cookies.set('user', JSON.stringify(user), { expires: 1 });
    Cookies.set('userRole', user.role, { expires: 1 });
    set({ token, user });
  },
  
  logout: () => {
    Cookies.remove('token');
    Cookies.remove('user');
    Cookies.remove('userRole');
    set({ token: null, user: null });
  },

  init: () => {
    const token = Cookies.get('token');
    const userStr = Cookies.get('user');
    if (token && userStr) {
      try {
        const user = JSON.stringify(userStr);
        set({ token, user: JSON.parse(userStr) });
      } catch (e) {
        Cookies.remove('token');
        Cookies.remove('user');
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
