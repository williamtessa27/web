import axios from 'axios';
import toast from 'react-hot-toast';
import { ApiConfig } from '@/config/api.config';
import { useAuthStore } from '@/core/store/auth.store';

const apiClient = axios.create({
  baseURL: ApiConfig.baseUrl,
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

function normalizeApiMessage(error: any): string {
  const rawMessage =
    error.response?.data?.message?.[0] ||
    error.response?.data?.message ||
    error.message ||
    'Une erreur est survenue';

  if (
    error.response?.status === 403 &&
    (!rawMessage || rawMessage === 'Forbidden' || rawMessage === 'Forbidden resource')
  ) {
    return "Accès refusé : votre rôle ou vos permissions ne permettent pas d'accéder à cette fonctionnalité. Contactez un administrateur si cet accès est nécessaire.";
  }

  return Array.isArray(rawMessage) ? rawMessage[0] : String(rawMessage);
}

// Flag pour éviter la boucle : un seul 401 déclenche logout + redirect
let isHandling401 = false;

// ─── Request : token + optionnellement ID entreprise (traçabilité uniquement) ───
// Le backend détermine le tenant via le JWT (user.idEntreprise), pas via un header.
// On envoie X-Entreprise-Id quand on l'a (login/register/me) pour logs ou debug.
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem(ApiConfig.storageKeys.token);
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  const state = useAuthStore.getState();
  const entrepriseId = state.user?.idEntreprise ?? state.entreprise?.id ?? null;
  if (entrepriseId) {
    config.headers['X-Entreprise-Id'] = entrepriseId;
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

    const message = normalizeApiMessage(error);

    return Promise.reject({
      message,
      statusCode: error.response?.status,
      details: error.response?.data?.details,
      response: error.response,
    });
  },
);

export default apiClient;
