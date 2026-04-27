import { useEffect, useState } from "react";
import api from "../../services/api";
import { BarChart3, TrendingUp, Star, BookOpen } from "lucide-react";

export const AdminStatsView = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/stats-global').then(res => setStats(res.data));
  }, []);

  if (!stats) return null;

  return (
    <div className="py-8 space-y-8 animate-in zoom-in-95 duration-500">
      <header>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">Estadísticas de BookMark</h2>
        <p className="text-slate-500 font-medium">Rendimiento global y tendencias de lectura</p>
      </header>

      {/* Cards de resumen */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Usuarios Activos</p>
            <p className="text-4xl font-black text-slate-900">{stats.totalUsers}</p>
          </div>
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center">
            <TrendingUp size={32} />
          </div>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Libros en Sistema</p>
            <p className="text-4xl font-black text-slate-900">{stats.totalBooks}</p>
          </div>
          <div className="w-16 h-16 bg-teal-50 text-teal-600 rounded-3xl flex items-center justify-center">
            <BookOpen size={32} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Géneros más populares */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
            <BarChart3 className="text-teal-600" size={18} /> Géneros más leídos
          </h3>
          <div className="space-y-6">
            {stats.topGenres.map((g: any, i: number) => (
              <div key={i}>
                <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-tighter">
                  <span className="text-slate-600">{g.genre || 'Sin género'}</span>
                  <span className="text-teal-600">{g.count} libros</span>
                </div>
                <div className="h-2 bg-slate-50 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-teal-500 rounded-full" 
                    style={{ width: `${(g.count / stats.totalBooks) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ranking de Libros */}
        <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
            <Star className="text-amber-500" size={18} /> Libros tendencia
          </h3>
          <div className="space-y-4">
            {stats.topBooks.map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-4 p-4 rounded-2xl hover:bg-slate-50 transition-colors">
                <span className="text-2xl font-black text-slate-200">0{i + 1}</span>
                <div className="flex-1">
                  <p className="text-sm font-black text-slate-800 leading-none mb-1">{b.title}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">{b.author}</p>
                </div>
                <div className="text-[10px] font-black bg-amber-50 text-amber-600 px-2 py-1 rounded-md uppercase">
                  {b.totalSaves} lect.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};