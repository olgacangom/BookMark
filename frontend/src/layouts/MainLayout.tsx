import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const MainLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <nav className="bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-8">
          <Link to="/dashboard" className="flex items-center gap-2">
            <div className="bg-indigo-500 p-2 rounded-xl shadow-lg shadow-indigo-100">
              <span className="text-white text-xl">📖</span>
            </div>
            <div>
              <h1 className="font-black text-gray-800 leading-none">Biblioteca Virtual</h1>
              <p className="text-[10px] text-gray-400">Tu espacio de lectura</p>
            </div>
          </Link>

          {/* Enlaces centrales */}
          <div className="hidden lg:flex items-center gap-6 text-sm font-bold text-gray-500">
            <Link color="indigo" to="/dashboard" className="hover:text-indigo-600 transition-colors">Inicio</Link>
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Biblioteca</Link>
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Explorar</Link>
            <Link to="/dashboard" className="hover:text-indigo-600 transition-colors">Feed</Link>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Link to="/profile" className="flex items-center gap-3 bg-gray-50 px-3 py-1.5 rounded-2xl border border-gray-100 hover:bg-gray-100 transition-all">
            <span className="text-sm font-bold text-gray-700">Usuario</span>
          </Link>
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="text-gray-400 hover:text-red-500 transition-colors p-2"
          >
            🚪
          </button>
        </div>
      </nav>

      {/* 2. Contenido Dinámico */}
      <main>
        <Outlet />
      </main>
    </div>
  );
};