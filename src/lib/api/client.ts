import axios from 'axios';

export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || (isTauri ? 'http://127.0.0.1:4000/api' : '/api'),
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If 401 Unauthorized and not on login page, redirect or broadcast
    if (error.response && error.response.status === 401) {
      if (window.location.pathname !== '/login') {
        // Session expired or logged out
      }
    }
    return Promise.reject(error);
  }
);
