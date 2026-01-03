import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoginScreen } from '@/components/LoginScreen';

const Index = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LoginScreen />;
};

export default Index;
