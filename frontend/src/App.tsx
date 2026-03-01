import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginView } from './pages/auth/LoginView';
import { RegisterView } from './pages/auth/RegisterView';
import { DashboardView } from './pages/DashboardView'; 

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rutas Públicas */}
          <Route path="/login" element={<LoginView />} />
          <Route path="/register" element={<RegisterView />} />

          {/* Rutas Protegidas */}
          <Route element={<ProtectedRoute />}>
            {/* 📚 Cambiamos el placeholder por el Dashboard real */}
            <Route path="/dashboard" element={<DashboardView />} />
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