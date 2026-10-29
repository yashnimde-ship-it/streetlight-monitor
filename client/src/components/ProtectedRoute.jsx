import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { Loader } from './ui.jsx';

export default function ProtectedRoute() {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) return <Loader label="Checking session…" />;
  if (!user) return <Navigate to="/login" replace state={{ from: location }} />;
  return <Outlet />;
}
