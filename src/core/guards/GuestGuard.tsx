import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth.store';
import { AppRoutes } from '@/config/routes.config';
import { isSuperAdmin } from '@/config/permissions';

export default function GuestGuard() {
  const { isAuthenticated, user } = useAuthStore();

  if (isAuthenticated && user) {
    const target = isSuperAdmin(user.role)
      ? AppRoutes.SUPER_ADMIN_ENTREPRISES
      : AppRoutes.DASHBOARD;
    return <Navigate to={target} replace />;
  }

  return <Outlet />;
}
