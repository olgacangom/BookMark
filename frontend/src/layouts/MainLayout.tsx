import { Outlet, Link, useLocation } from "react-router-dom";
import { Compass, Sparkles, User, LogOut, Bell, BarChart3, Bookmark, Library, Club } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export function MainLayout() {
  const location = useLocation();
  const { user, logout } = useAuth();
  

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: "/explore", icon: Compass, label: "Descubrir" },
    { path: "/feed", icon: Sparkles, label: "Feed" },
    { path: "/library", icon: Bookmark, label: " Mi Biblioteca" }, 
    { path: "/dashboard", icon: BarChart3, label: "Estadísticas" },      
    { path: "/requests", icon: Bell, label: "Solicitudes" },    
    { path: "/clubs", icon: Club, label: "Clubs" },            
    { path: "/myprofile", icon: User, label: "Perfil" },
  ];

  return (
    <div className="min-h-screen bg-[#F0F9F9] flex flex-col lg:flex-row">
      
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 w-64 bg-white border-r border-slate-100 flex-col z-50 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
        <div className="p-8">
          <Link to="/dashboard" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-teal-600 rounded-xl flex items-center justify-center shadow-lg shadow-teal-600/20">
              <Library className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none mb-1">
                Book<span className="text-teal-600 font-serif italic font-normal">Mark</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Tu espacio literario</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200 group ${active
                  ? "bg-teal-600 text-white shadow-lg shadow-teal-600/30"
                  : "text-slate-500 hover:bg-slate-50 hover:text-teal-600"
                  }`}
              >
                <item.icon className={`w-5 h-5 ${active ? "text-white" : "group-hover:text-teal-600"}`} />
                <span className="font-semibold text-sm">{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-6 border-t border-slate-50">
          <Link to="/myprofile" className="flex items-center gap-3 p-2 rounded-xl hover:bg-slate-50 transition-colors">
            <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden">
              {user?.avatarUrl ? <img src={user.avatarUrl} className="w-full h-full object-cover" alt="Avatar" /> : "O"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-bold text-slate-800 text-sm truncate">{user?.fullName || "Olga"}</p>
              <p className="text-xs text-slate-400">Ver perfil</p>
            </div>
          </Link>
          <button onClick={logout} className="mt-4 flex items-center gap-2 text-xs font-bold text-slate-400 hover:text-rose-500 px-2 transition-colors">
            <LogOut size={14} /> Cerrar sesión
          </button>
        </div>
      </aside>

      <main className="flex-1 lg:ml-64 min-h-screen relative pb-24 lg:pb-12"> 
        <header className="sticky top-0 z-40 bg-[#F0F9F9]/80 backdrop-blur-md px-6 lg:px-8 py-4 lg:py-6 flex justify-between lg:justify-end items-center gap-4">
            <div className="lg:hidden flex items-center gap-2">
                <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center shadow-lg">
                    <Library size={18} className="text-white" />
                </div>
                <span className="font-bold text-slate-900 tracking-tight">BookMark</span>
            </div>
            
            <button onClick={logout} className="lg:hidden p-2 text-slate-400">
                <LogOut size={20} />
            </button>
        </header>

        <div className="px-6 lg:px-8">
          <Outlet />
        </div>
      </main>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-slate-100 px-2 pb-safe-area-inset-bottom shadow-[0_-10px_25px_rgba(0,0,0,0.03)]">
        <div className="flex justify-around items-center h-16 max-w-md mx-auto">
          {navItems.map((item) => {
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 gap-1 transition-all duration-300 ${
                  active ? "text-teal-600" : "text-slate-400"
                }`}
              >
                <div className={`p-1 rounded-xl transition-all ${active ? "bg-teal-50" : ""}`}>
                    <item.icon size={20} strokeWidth={active ? 2.5 : 2} />
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tighter transition-opacity ${
                    active ? "opacity-100" : "opacity-60"
                }`}>
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}