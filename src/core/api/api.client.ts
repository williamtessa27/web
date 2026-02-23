import axios from 'axios';
import toast from 'react-hot-toast';
import { ApiConfig } from '@/config/api.config';
import { useAuthStore } from '@/core/store/auth.store';

const apiClient = axios.create({
  baseURL: ApiConfig.baseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// Flag pour éviter la boucle : un seul 401 déclenche logout + redirect
let isHandling401 = false;

// ─── Request : injecter le token ──────────────────
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ApiConfig.storageKeys.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response : gérer les erreurs ─────────────────
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (!isHandling401) {
        isHandling401 = true;
        useAuthStore.getState().logout();
        localStorage.removeItem('collect-auth-storage');
        const path = window.location.pathname;
        if (path !== '/login') {
          toast.error('Session expirée, veuillez vous reconnecter.');
          window.location.replace('/login');
        } else {
          isHandling401 = false;
        }
      }
    }

    const message =
      error.response?.data?.message?.[0] ||
      error.response?.data?.message ||
      error.message ||
      'Une erreur est survenue';

    return Promise.reject({ message, statusCode: error.response?.status });
  },
);

export default apiClient;
