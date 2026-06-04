import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  roles?: string[]; 
}

export const ProtectedRoute = ({ roles }: ProtectedRouteProps) => {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) return <div>Cargando...</div>;

  // Si no está logueado, sí o sí va al login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Si el rol no coincide:
  if (roles && user && !roles.includes(user.role)) {
    return (
      <div className="p-8 text-center">
        <h2 className="text-xl font-bold text-slate-800">Acceso restringido</h2>
        <p className="text-slate-500">No tienes permisos para ver esta sección.</p>
      </div>
    );
  }

  return <Outlet />;
};