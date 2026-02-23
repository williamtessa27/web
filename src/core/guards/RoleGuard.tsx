import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth.store';
import { AppRoutes } from '@/config/routes.config';
import type { RoleUtilisateur } from '@/types';

interface Props {
  allowedRoles: RoleUtilisateur[];
}

export default function RoleGuard({ allowedRoles }: Props) {
  const { user } = useAuthStore();

  if (!user || !allowedRoles.includes(user.role)) {
    return <Navigate to={AppRoutes.DASHBOARD} replace />;
  }

  return <Outlet />;
}
