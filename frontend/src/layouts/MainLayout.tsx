import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react'; 

export const MainLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-background">

      <nav className="bg-[#e5ded3] border-b border-[#9b8b7e]/10 px-8 py-4 flex justify-between items-center sticky top-0 z-50 shadow-sm">
        
        <div className="flex-1 flex items-center">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            {/* El icono con el primary para mantener la marca */}
            <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/10 transition-transform group-hover:scale-105">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[19px] font-black text-[#564e4e] tracking-tight leading-none">
                BookMark
              </h1>
              <p className="text-[10px] text-[#9b8b7e] font-black uppercase tracking-[0.15em] mt-1 italic">
                Tu espacio de lectura
              </p>
            </div>
          </Link>
        </div>

        {/* Links de Navegación centralizados */}
        <div className="hidden lg:flex items-center justify-center gap-10">
          <NavLink to="/dashboard" label="Inicio" active={location.pathname === '/dashboard'} />
          <NavLink to="/library" label="Biblioteca" active={location.pathname === '/library'} />
          <NavLink to="/explorar" label="Explorar" active={location.pathname === '/explorar'} />
          <NavLink to="/feed" label="Feed" active={location.pathname === '/feed'} />
        </div>

        <div className="flex-1 flex items-center justify-end gap-4">
          <Link 
            to="/myprofile" 
            className="flex items-center gap-3 bg-[#e8e4e0] hover:bg-[#dedad5] px-4 py-2 rounded-2xl border border-[#9b8b7e]/10 transition-all group"
          >
            <span className="text-sm font-bold text-[#564e4e] hidden md:block">
              {user?.fullName?.split(' ')[0]}
            </span>
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shadow-md">
              {user?.fullName?.charAt(0)}
            </div>
          </Link>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="p-2.5 text-[#9b8b7e] hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      <main className="animate-in fade-in duration-500">
        <Outlet />
      </main>
    </div>
  );
};

const NavLink = ({ to, label, active }: { to: string, label: string, active?: boolean }) => (
  <Link 
    to={to} 
    className={`text-[13px] font-black uppercase tracking-[0.2em] transition-all relative group py-2 
      ${active ? 'text-primary' : 'text-[#9b8b7e] hover:text-primary'}`}
  >
    {label}
    <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 rounded-full
      ${active ? 'w-full' : 'w-0 group-hover:w-full'}`} 
    />
  </Link>
);