import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { homeFor } from '../../hooks/useAuthActions';
import { useAppSelector } from '../../store';
import { Role } from '../../types';
import { Spinner } from '../ui/Feedback';

// Shows the page only to logged-in users with an allowed role.
export function ProtectedRoute({ roles }: { roles: Role[] }) {
  const { user, status } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (status === 'loading') return <Spinner label="Checking your session" />;
  if (!user) return <Navigate to="/login" state={{ from: location.pathname + location.search }} replace />;
  if (!roles.includes(user.role)) return <Navigate to={homeFor(user.role)} replace />;
  return <Outlet />;
}
