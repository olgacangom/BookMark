import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginView } from './pages/auth/LoginView';
import { RegisterView } from './pages/auth/RegisterView';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />

          {/* Rutas Protegidas (Solo entras si estás logueado) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<div>¡Bienvenido al Dashboard Privado!</div>} />
            {/* Aquí irán tus futuras páginas de marcadores/bookmarks */}
          </Route>

          {/* Redirección por defecto */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;