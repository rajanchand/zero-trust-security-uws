import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Role } from '@/lib/demo-data';

interface Props {
  children: React.ReactNode;
  roles: Role[];
}

export default function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, hasRole } = useAuth();
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRole(roles)) return <Navigate to="/dashboard" replace />;
  
  return <>{children}</>;
}
