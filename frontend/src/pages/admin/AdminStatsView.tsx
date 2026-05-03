import { useEffect, useState } from "react";
import api from "../../services/api";
import { 
  Star, BookOpen, ArrowUpRight,
  Zap, Globe, ChevronRight, RefreshCw,
} from "lucide-react";
import { 
  ResponsiveContainer, AreaChart, Area,
  PieChart, Pie, Cell, Tooltip,
} from "recharts";

const COLORS = ["#3b82f6", "#f59e0b", "#0d9488", "#8b5cf6", "#94a3b8", "#f43f5e"];

export const AdminStatsView = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get('/admin/stats-global').then(res => {
        setStats(res.data);
    });
  }, []);

  if (!stats) return (
    <div className="h-96 flex flex-col items-center justify-center bg-[#F8FAFB]">
        <RefreshCw className="animate-spin text-teal-600 mb-4" size={40} />
        <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Sincronizando Dashboard...</p>
    </div>
  );

  // Datos simulados para las gráficas de las tarjetas ( Sparklines )
  const userHistory = [
    { n: 'L', v: 400 }, { n: 'M', v: 300 }, { n: 'M', v: 600 }, 
    { n: 'J', v: 800 }, { n: 'V', v: 500 }, { n: 'S', v: 900 }, { n: 'D', v: 1100 }
  ];

  const bookHistory = [
    { n: 'L', v: 20 }, { n: 'M', v: 45 }, { n: 'M', v: 30 }, 
    { n: 'J', v: 70 }, { n: 'V', v: 40 }, { n: 'S', v: 85 }, { n: 'D', v: 100 }
  ];

  const chartData = stats.topGenres?.map((g: any) => ({
    name: g.genre || 'Otros',
    value: Number(g.count) || 0
  })) || [];

  return (
    <div className="py-8 space-y-8 animate-in fade-in duration-700 px-4 sm:px-8 bg-[#F8FAFB] min-h-screen text-left">
      
      {/* HEADER */}
      <header className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tighter uppercase italic">
            Dashboard <span className="text-teal-600 font-serif lowercase">bookmark</span>
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.3em] mt-1">
            Panel de control administrativo • Global
          </p>
        </div>
      </header>

      {/* CARDS DE RESUMEN CON GRÁFICAS (SPARKINES) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Usuarios Activos */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Usuarios Activos</p>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalUsers}</span>
                <span className="text-emerald-500 text-[10px] font-bold flex items-center gap-0.5">
                    <ArrowUpRight size={12} /> 22%
                </span>
            </div>
          </div>
          {/* Sparkline */}
          <div className="absolute inset-0 pt-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={userHistory}>
                <defs>
                  <linearGradient id="colorU" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#10b981" strokeWidth={2} fillOpacity={1} fill="url(#colorU)" isAnimationActive={true} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Libros en Sistema */}
        <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Libros Totales</p>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-slate-900 tracking-tighter">{stats.totalBooks}</span>
                <span className="text-blue-500 text-[10px] font-bold flex items-center gap-0.5">
                    <ArrowUpRight size={12} /> 8%
                </span>
            </div>
          </div>
          <div className="absolute inset-0 pt-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={bookHistory}>
                <defs>
                  <linearGradient id="colorB" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorB)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <BookOpen className="absolute right-4 top-4 text-slate-100 group-hover:text-blue-50 transition-colors" size={40} />
        </div>

        {/* Interacciones */}
        <div className="bg-slate-900 p-6 rounded-[2.5rem] shadow-xl relative overflow-hidden group">
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Interacciones</p>
            <div className="flex items-baseline gap-2">
                <span className="text-4xl font-black text-white tracking-tighter">{stats.totalInteractions || stats.totalBooks * 2}</span>
                <Zap size={14} className="text-teal-400 fill-teal-400 animate-pulse" />
            </div>
            <p className="text-[9px] text-teal-400 font-bold uppercase mt-2">Sincronizado Live</p>
          </div>
          <Globe className="absolute -right-2 -bottom-2 text-white/5" size={100} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* DISTRIBUCIÓN POR GÉNERO */}
        <div className="lg:col-span-7 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm self-start">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="w-full md:w-1/2 flex flex-col items-center">
              <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest mb-10 self-start border-l-4 border-teal-500 pl-3">
                  Géneros Populares
              </h3>
              
              <div className="relative w-56 h-56 shrink-0">
                <PieChart width={220} height={220}>
                    <Pie
                        data={chartData}
                        cx="50%" cy="50%"
                        innerRadius={65}
                        outerRadius={95}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
                        cornerRadius={6}
                    >
                        {chartData.map((_: any, index: number) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="outline-none" />
                        ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '16px', border: 'none'}} />
                </PieChart>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-5xl font-black text-slate-900 tracking-tighter leading-none">{stats.totalBooks}</span>
                  <span className="text-[10px] font-black text-slate-400 uppercase mt-1">Libros</span>
                </div>
              </div>
            </div>

            <div className="w-full md:w-1/2 space-y-4">
              {stats.topGenres.map((g: any, i: number) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                        <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                        <span className="text-[10px] font-black text-slate-700 uppercase">{g.genre || 'Otros'}</span>
                    </div>
                    <span className="text-[10px] font-black text-slate-900">{Math.round((g.count / stats.totalBooks) * 100)}%</span>
                  </div>
                  <div className="w-full h-1 bg-slate-50 rounded-full overflow-hidden">
                    <div className="h-full bg-slate-200 group-hover:bg-teal-500 transition-all duration-500" style={{ width: `${(g.count / stats.totalBooks) * 100}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* RANKING DE LIBROS */}
        <div className="lg:col-span-5 bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-sm flex flex-col h-[550px]">
          <div className="flex justify-between items-center mb-8">
            <h3 className="text-[11px] font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <Star size={16} className="text-amber-500 fill-amber-500" /> Libros Tendencia
            </h3>
            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest italic">Top Global</span>
          </div>

          <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
            {stats.topBooks.map((b: any, i: number) => (
              <div key={i} className="flex items-center gap-4 group transition-all p-1">
                <span className="text-3xl font-black text-slate-100 group-hover:text-teal-500/20 transition-colors w-10 italic shrink-0">
                  0{i + 1}
                </span>
                
                {/* Portada Real */}
                <div className="w-12 h-16 rounded-xl bg-[#E8EDF2] flex items-center justify-center shrink-0 relative overflow-hidden shadow-sm group-hover:-rotate-2 transition-transform border border-slate-200">
                  {b.urlPortada ? (
                      <img 
                        src={b.urlPortada} 
                        className="w-full h-full object-cover relative z-10" 
                        alt="" 
                      />
                  ) : (
                      <span className="text-[#8B98A5] font-bold text-[10px] uppercase">Book</span>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <h4 className="text-[11px] font-black text-slate-900 uppercase truncate leading-tight tracking-tight group-hover:text-teal-600 transition-colors">
                    {b.title}
                  </h4>
                  <div className="flex flex-col gap-1 mt-1">
                    <p className="text-[9px] font-bold text-slate-400 uppercase truncate">{b.author}</p>
                    <div className="flex items-center gap-1.5 bg-teal-50 px-2 py-0.5 rounded-full w-max border border-teal-100/50">
                        <div className="w-1 h-1 bg-teal-500 rounded-full" />
                        <span className="text-[9px] font-black text-teal-600 uppercase tracking-tighter">
                            {b.totalSaves || 0} lecturas
                        </span>
                    </div>
                  </div>
                </div>

                <ChevronRight size={18} className="text-slate-200" />
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
};