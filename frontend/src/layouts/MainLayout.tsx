import { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, BookOpen, Menu, X, User as UserIcon } from 'lucide-react';

export const MainLayout = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="min-h-screen bg-background">
      <nav className="bg-[#e5ded3] border-b border-[#9b8b7e]/10 px-4 md:px-8 py-3 flex justify-between items-center sticky top-0 z-50 shadow-sm">

        <div className="flex-1 flex items-center">
          <Link to="/dashboard" onClick={closeMenu} className="flex items-center gap-2 md:gap-3 group">
            <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/10 transition-transform group-hover:scale-105">
              <BookOpen className="text-white w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="block">
              <h1 className="text-[16px] md:text-[19px] font-black text-[#564e4e] tracking-tight leading-none">
                BookMark
              </h1>
            </div>
          </Link>
        </div>

        {/* Centro: Navegación Desktop */}
        <div className="hidden lg:flex items-center justify-center gap-8">
          <NavLink to="/dashboard" label="Inicio" active={location.pathname === '/dashboard'} />
          <NavLink to="/library" label="Biblioteca" active={location.pathname === '/library'} />
          <NavLink to="/explore" label="Explorar" active={location.pathname === '/explore'} />
          <NavLink to="/feed" label="Feed" active={location.pathname === '/feed'} />
          <NavLink to="/requests" label="Solicitudes" active={location.pathname === '/requests'} />

        </div>

        {/* Lado Derecho: Perfil y Logout */}
        <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">

          {/* BOTÓN DE PERFIL */}
          <Link
            to="/myprofile"
            onClick={closeMenu}
            className={`flex items-center gap-2 px-3 py-1.5 md:px-4 md:py-2 rounded-2xl border transition-all group
              ${location.pathname === '/myprofile'
                ? 'bg-primary/10 border-primary/20'
                : 'bg-[#e8e4e0] border-[#9b8b7e]/10 hover:bg-[#dedad5]'}`}
          >
            <span className="text-xs md:text-sm font-bold text-[#564e4e] hidden sm:block">
              {user?.fullName?.split(' ')[0] || 'Perfil'}
            </span>
            <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-primary text-white flex items-center justify-center text-xs font-black shadow-md shrink-0">
              {user?.fullName?.charAt(0) || <UserIcon className="w-4 h-4" />}
            </div>
          </Link>

          {/* Botón Menú Móvil (Solo visible en pantallas pequeñas) */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="lg:hidden p-2 text-[#564e4e] hover:bg-[#dedad5] rounded-xl transition-all"
            aria-label="Menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Logout Directo (Solo Desktop) */}
          <button
            onClick={() => { logout(); navigate('/login'); }}
            className="hidden md:flex p-2.5 text-[#9b8b7e] hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
            title="Cerrar Sesión"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </nav>

      {/* MENÚ DESPLEGABLE MÓVIL */}
      {isMenuOpen && (
        <div className="lg:hidden fixed inset-0 top-[64px] bg-[#e5ded3] z-[100] p-8 flex flex-col gap-8 animate-in slide-in-from-top duration-300">
          <MobileNavLink to="/dashboard" label="Inicio" onClick={closeMenu} active={location.pathname === '/dashboard'} />
          <MobileNavLink to="/library" label="Biblioteca" onClick={closeMenu} active={location.pathname === '/library'} />
          <MobileNavLink to="/explore" label="Explorar" onClick={closeMenu} active={location.pathname === '/explore'} />
          <MobileNavLink to="/feed" label="Feed" onClick={closeMenu} active={location.pathname === '/feed'} />
          <MobileNavLink to="/requests" label="Solicitudes" onClick={closeMenu} active={location.pathname === '/requests'}  />

          <hr className="border-[#9b8b7e]/20" />
          <button
            onClick={() => { logout(); navigate('/login'); closeMenu(); }}
            className="flex items-center gap-4 text-destructive font-black uppercase text-sm tracking-widest mt-auto pb-10"
          >
            <LogOut className="w-5 h-5" /> Cerrar Sesión
          </button>
        </div>
      )}

      {/* CONTENIDO PRINCIPAL */}
      <main className="animate-in fade-in duration-500 min-h-[calc(100vh-64px)]">
        <Outlet />
      </main>
    </div>
  );
};

const NavLink = ({ to, label, active }: { to: string, label: string, active?: boolean }) => (
  <Link
    to={to}
    className={`text-[12px] font-black uppercase tracking-[0.2em] transition-all relative group py-2 
      ${active ? 'text-primary' : 'text-[#9b8b7e] hover:text-primary'}`}
  >
    {label}
    <span className={`absolute bottom-0 left-0 h-0.5 bg-primary transition-all duration-300 rounded-full
      ${active ? 'w-full' : 'w-0 group-hover:w-full'}`}
    />
  </Link>
);

const MobileNavLink = ({ to, label, onClick, active }: { to: string, label: string, onClick: () => void, active?: boolean }) => (
  <Link
    to={to}
    onClick={onClick}
    className={`text-2xl font-black uppercase tracking-[0.1em] transition-colors
      ${active ? 'text-primary' : 'text-[#564e4e]'}`}
  >
    {label}
  </Link>
);