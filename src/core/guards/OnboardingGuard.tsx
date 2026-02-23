import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth.store';
import { AppRoutes } from '@/config/routes.config';
import { RoleUtilisateur } from '@/types';

/**
 * Guard d'onboarding : redirige vers /onboarding si l'entreprise
 * n'a pas complété son profil. Le SuperAdmin est exempté.
 */
export default function OnboardingGuard() {
  const { user, entreprise } = useAuthStore();

  // SuperAdmin n'a pas d'entreprise, on le laisse passer
  if (user?.role === RoleUtilisateur.SuperAdmin) {
    return <Outlet />;
  }

  // Si l'entreprise n'a pas complété son profil, redirection
  if (entreprise && !entreprise.profilComplete) {
    return <Navigate to={AppRoutes.ONBOARDING} replace />;
  }

  return <Outlet />;
}
