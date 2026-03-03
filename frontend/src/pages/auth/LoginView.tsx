import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Ajusta la ruta si es necesario

export const LoginView = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      await login(email, password);
      navigate('/dashboard'); // Si sale bien, vamos al home
    } catch (err: any) {
      setError('Credenciales incorrectas o error de servidor');
    }
  };

  return (
    <div className="min-h-screen bg-[#fdf2ff] flex items-center justify-center p-6">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl shadow-purple-100 p-12 text-center relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        
        <div className="relative">
          <div className="bg-gradient-to-br from-purple-400 to-indigo-400 w-24 h-24 rounded-[2rem] mx-auto mb-8 flex items-center justify-center shadow-xl shadow-purple-200">
             <span className="text-white text-5xl">📖</span>
          </div>

          <h2 className="text-4xl font-black text-indigo-900/80 mb-2">Bienvenido/a</h2>
          <p className="text-gray-400 font-medium mb-10">Entra a tu espacio de lectura</p>

          {/* 🚨 Mensaje de Error */}
          {error && <p className="bg-red-50 text-red-500 p-3 rounded-xl mb-4 text-sm font-bold">{error}</p>}

          <form onSubmit={handleSubmit} className="space-y-6 text-left">
            <div>
              <label className="text-xs font-black text-indigo-900/40 uppercase ml-4 mb-2 block">Correo Electrónico</label>
              <div className="relative">
                <span className="absolute left-5 top-4 opacity-40">✉️</span>
                <input 
                  type="email" 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="tu@email.com"
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-600 font-medium"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-black text-indigo-900/40 uppercase ml-4 mb-2 block">Contraseña</label>
              <div className="relative">
                <span className="absolute left-5 top-4 opacity-40">🔒</span>
                <input 
                  type="password" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border-none rounded-2xl py-4 pl-14 pr-6 focus:ring-4 focus:ring-purple-100 transition-all outline-none text-gray-600"
                />
              </div>
            </div>

            <button 
              type="submit"
              className="w-full bg-gradient-to-r from-indigo-400 to-purple-400 text-white py-4 rounded-[1.5rem] font-bold text-lg shadow-lg shadow-purple-200 hover:scale-[1.02] active:scale-95 transition-all mt-4"
            >
              Iniciar Sesión
            </button>
          </form>

          <p className="mt-8 text-sm text-gray-500 font-medium">
            ¿No tienes cuenta?{' '}
            <Link 
              to="/register" 
              className="text-purple-500 font-bold hover:underline"
            >
              Regístrate aquí
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};