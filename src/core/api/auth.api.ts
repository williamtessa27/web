import apiClient from './api.client';
import type {
  LoginCredentials,
  LoginResponse,
  RegisterRequest,
  RegisterResponse,
  Utilisateur,
} from '@/types';

export const authApi = {
  login: (credentials: LoginCredentials) =>
    apiClient.post<LoginResponse>('/auth/login', credentials).then((r) => r.data),

  register: (data: RegisterRequest) =>
    apiClient.post<RegisterResponse>('/auth/register', data).then((r) => r.data),

  me: () => apiClient.get<Utilisateur>('/auth/me').then((r) => r.data),
};
