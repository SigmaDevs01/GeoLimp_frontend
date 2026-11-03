import axios from 'axios';
import Cookies from 'js-cookie';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Only dispatch auth-unauthorized if the error is 401 and NOT from the login endpoint
    if (
      error.response && 
      error.response.status === 401 && 
      !error.config.url?.includes('/auth/login')
    ) {
      // Logout on unauthorized
      Cookies.remove('userRole');
      window.dispatchEvent(new Event('auth-unauthorized'));
    }
    return Promise.reject(error);
  }
);
