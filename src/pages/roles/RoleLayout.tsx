import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth.store';
import { AppRoutes } from '@/config/routes.config';
import AppLayout from '@/components/layout/AppLayout';

/**
 * Affiche le layout pour l'utilisateur connecté.
 * Un seul layout (AppLayout) est utilisé ; la restriction par rôle est gérée par RoleGuard sur les routes dans App.tsx.
 */
export default function RoleLayout() {
  const { user } = useAuthStore();

  if (!user) {
    return <Navigate to={AppRoutes.LOGIN} replace />;
  }

  return <AppLayout />;
}
