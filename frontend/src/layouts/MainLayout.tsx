import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen } from 'lucide-react'; // Importamos iconos profesionales

export const MainLayout = () => {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const { user } = useAuth();


  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-white/80 backdrop-blur-md border-b border-border px-8 py-4 flex justify-between items-center sticky top-0 z-50">
        
        <div className="flex-1 flex items-center">
          <Link to="/dashboard" className="flex items-center gap-3 group">
            <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
              <BookOpen className="text-white w-6 h-6" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-[19px] font-black text-foreground tracking-tight leading-none">
                BookMark
              </h1>
              <p className="text-[11px] text-muted-foreground font-medium uppercase tracking-wider mt-1">
                Tu espacio de lectura
              </p>
            </div>
          </Link>
        </div>

        <div className="hidden lg:flex items-center justify-center gap-8">
          <NavLink to="/dashboard" label="Inicio" />
          <NavLink to="/library" label="Biblioteca" />
          <NavLink to="/dashboard" label="Explorar" />
          <NavLink to="/dashboard" label="Feed" />
        </div>

        <div className="flex-1 flex items-center justify-end gap-5">
          <Link 
            to="/myprofile" 
            className="flex items-center gap-3 bg-muted/50 px-4 py-2 rounded-2xl border border-border hover:bg-muted transition-all hover:shadow-sm"
          >
            <span className="text-sm font-bold text-foreground" title="Mi Perfil">{user?.fullName}</span>
            <div className="w-6 h-6 rounded-full bg-secondary/30 border border-secondary/20" />
          </Link>
          
          <button 
            onClick={() => { logout(); navigate('/login'); }}
            className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/5 rounded-xl"
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

const NavLink = ({ to, label }: { to: string, label: string }) => (
  <Link 
    to={to} 
    className="text-lg font-bold text-muted-foreground hover:text-primary transition-all relative group py-2"
  >
    {label}
    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full rounded-full" />
  </Link>
);