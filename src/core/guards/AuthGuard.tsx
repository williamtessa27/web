import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/core/store/auth.store';
import { AppRoutes } from '@/config/routes.config';

export default function AuthGuard() {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to={AppRoutes.LOGIN} replace />;
  }

  return <Outlet />;
}
