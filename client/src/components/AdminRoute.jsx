import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export function AdminRoute({ children }) {
  const { user } = useAuth();
  if (!user || !user.isAdmin) {
    return <Navigate to="/" replace />;
  }
  return children;
}
