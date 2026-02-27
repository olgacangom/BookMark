import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { LoginView } from './pages/auth/LoginView';
import { RegisterView } from './pages/auth/RegisterView';
import './App.css';

function App() {
  return (
    <Router>
      <Routes>
        {/* Redirigimos la raíz al login para probarlo de inmediato */}
        <Route path="/" element={<Navigate to="/login" />} />
        
        {/* Rutas de Autenticación */}
        <Route path="/login" element={<LoginView />} />
        <Route path="/register" element={<RegisterView />} />

        {/* Ruta para capturar errores 404 (opcional) */}
        <Route path="*" element={<div className="p-10 text-center">Página no encontrada</div>} />
      </Routes>
    </Router>
  );
}

export default App;