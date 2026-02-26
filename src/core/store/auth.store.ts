import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { authApi } from '@/core/api/auth.api';
import { permissionApi } from '@/core/api';
import { ApiConfig } from '@/config/api.config';
import type { Utilisateur, Entreprise, RegisterRequest, LoginCredentials } from '@/types';

interface AuthState {
  user: Utilisateur | null;
  token: string | null;
  entreprise: Entreprise | null;
  /** Codes de permission du rôle courant (chargés depuis la matrice API). Pilote le CRUD par rubrique. */
  permissionCodes: string[] | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  loadPermissions: () => Promise<void>;
  setUser: (user: Utilisateur) => void;
  setEntreprise: (entreprise: Entreprise) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      entreprise: null,
      permissionCodes: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      loadPermissions: async () => {
        try {
          const { permissionCodes } = await permissionApi.getMyPermissions();
          set({ permissionCodes });
        } catch {
          set({ permissionCodes: [] });
        }
      },

      login: async (credentials) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.login(credentials);
          localStorage.setItem(ApiConfig.storageKeys.token, response.token);
          set({
            user: response.utilisateur,
            entreprise: response.utilisateur.entreprise || null,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          await get().loadPermissions();
        } catch (err: any) {
          set({ error: err.message || 'Erreur de connexion', isLoading: false });
          throw err;
        }
      },

      register: async (data: RegisterRequest) => {
        set({ isLoading: true, error: null });
        try {
          const response = await authApi.register(data);
          localStorage.setItem(ApiConfig.storageKeys.token, response.token);
          set({
            user: response.utilisateur,
            entreprise: response.entreprise,
            token: response.token,
            isAuthenticated: true,
            isLoading: false,
          });
          await get().loadPermissions();
        } catch (err: any) {
          set({ error: err.message || "Erreur lors de l'inscription", isLoading: false });
          throw err;
        }
      },

      logout: () => {
        localStorage.removeItem(ApiConfig.storageKeys.token);
        localStorage.removeItem(ApiConfig.storageKeys.user);
        set({ user: null, token: null, entreprise: null, permissionCodes: null, isAuthenticated: false });
      },

      checkAuth: async () => {
        const token = localStorage.getItem(ApiConfig.storageKeys.token);
        if (!token) {
          set({ isAuthenticated: false, user: null, token: null, entreprise: null, permissionCodes: null });
          return;
        }
        try {
          const user = await authApi.me();
          set({ user, token, entreprise: user.entreprise || null, isAuthenticated: true });
          await get().loadPermissions();
        } catch {
          localStorage.removeItem(ApiConfig.storageKeys.token);
          set({ user: null, token: null, entreprise: null, permissionCodes: null, isAuthenticated: false });
        }
      },

      setUser: (user) => set({ user }),
      setEntreprise: (entreprise) => set({ entreprise }),
    }),
    {
      name: 'collect-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        entreprise: state.entreprise,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
