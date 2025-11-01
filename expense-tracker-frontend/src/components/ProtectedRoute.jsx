import { Navigate } from 'react-router-dom';
import useAuthStore from '@/store/useAuthStore';

const ProtectedRoute = ({ children }) => {
  const { user } = useAuthStore();
  return user ? children : <Navigate to="/login" />;
}

export default ProtectedRoute;