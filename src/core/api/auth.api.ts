import apiClient from './api.client';
import type {
  LoginCredentials,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Utilisateur,
} from '@/types';

/** Session / connexion enregistrée (E8.2.3). */
export interface SessionConnexion {
  id: string;
  idUtilisateur: string;
  dateConnexion: string;
  ip?: string | null;
  userAgent?: string | null;
  deviceInfo?: string | null;
}

/** Élément liste admin : connexion + infos utilisateur. */
export interface SessionAdminItem extends SessionConnexion {
  utilisateur?: { id: string; nom: string; prenom?: string; email: string; role: string };
}

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/login', credentials).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data).then((r) => r.data),

  me: () => apiClient.get<Utilisateur>('/auth/me').then((r) => r.data),

  changePassword: (data: {
    ancienMotDePasse: string;
    nouveauMotDePasse: string;
    confirmationMotDePasse: string;
  }) =>
    apiClient.post<{ ok: boolean }>('/auth/change-password', data).then((r) => r.data),

  /** Liste des connexions récentes de l'utilisateur connecté (30 derniers jours). */
  sessions: () =>
    apiClient.get<SessionConnexion[]>('/auth/sessions').then((r) => r.data),

  /** [Admin] Toutes les sessions de l'entreprise (ou d'un utilisateur). */
  sessionsAdmin: (params?: { idEntreprise?: string; idUtilisateur?: string }) =>
    apiClient
      .get<SessionAdminItem[]>('/auth/sessions/admin', { params })
      .then((r) => r.data),

  /** Révoquer toutes les sessions d'un utilisateur (ou les siennes si idUtilisateur non fourni). */
  revokeAllSessions: (idUtilisateur?: string) =>
    apiClient
      .post<{ ok: boolean }>('/auth/sessions/revoke-all', idUtilisateur ? { idUtilisateur } : {})
      .then((r) => r.data),
};
