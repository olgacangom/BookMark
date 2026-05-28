import { useEffect, useState } from "react";
import api from "../../services/api";
import {
  Star,
  BookOpen,
  RefreshCw,
  Users,
  Megaphone,
  Calendar,
  ClipboardList,
  Globe2,
  Mail,
  Library,
  MessageSquareText,
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Bar,
  Legend,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Sector,
} from "recharts";

const COLORS = ["#5B74E8", "#C89A33", "#5A9985", "#7B61FF", "#AAB4C5"];

export const AdminStatsView = () => {
  const [stats, setStats] = useState<any>(null);
  const [monthlyData, setMonthlyData] = useState([]);
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/admin/stats-global"),
      api.get("/admin/stats/monthly-growth")
    ]).then(([resStats, resMonthly]) => {
      setStats(resStats.data);
      setMonthlyData(resMonthly.data);
    }).catch(err => console.error("Error cargando estadísticas:", err));
  }, []);

  if (!stats)
    return (
      <div className="fixed inset-0 bg-linear-to-r from-slate-700 via-teal-600 to-emerald-600 flex items-center justify-center">
        <RefreshCw className="animate-spin text-white" size={42} />
      </div>
    );

  const genreMap = stats.topGenres.reduce((acc: any, g: any) => {
    const name = (g.genre && g.genre.trim() !== "") ? g.genre : "Sin categoría";

    acc[name] = (acc[name] || 0) + Number(g.count);
    return acc;
  }, {});

  const chartData = Object.entries(genreMap).map(([name, value]) => ({
    name,
    value
  }));

  const total = chartData.reduce((acc: number, cur: any) => acc + cur.value, 0);

  return (
    <div className="p-5 lg:p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-black uppercase italic text-white">ESTADÍSTICAS</h1>
        <p className="mt-2 text-[10px] uppercase tracking-[0.35em] font-black text-white/70">Panel de control administrativo • Global</p>
      </header>

      {/* BLOQUE SUPERIOR (Solo con sus pequeñas gráficas de tendencia) */}
      <div className="grid xl:grid-cols-[1fr_280px] gap-5 mb-6">
        <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-black/20">
            <StatBlock title="Usuarios lectores" value={stats.totalUsers} sub="usuarios que leen" icon={<Users />} color="emerald" />
            <StatBlock title="Libreros" value={stats.totalLibreros} sub={`Pendientes: ${stats.pendingLibreros}`} icon={<Library />} color="amber" />
            <StatBlock title="Libros Totales" value={stats.totalBooks} sub="libros registrados" icon={<BookOpen />} color="blue" />
            <StatBlock title="Anuncios libros" value={stats.totalAvailableListings} sub={`actuales de ${stats.totalListings} registrados`} icon={<Megaphone />} color="amber" />
          </div>
        </div>

        <div className="relative overflow-hidden rounded-[2rem] bg-[#07111e] p-6 shadow-xl">
          <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/60">Solicitudes Totales</p>
          <div className="mt-4 flex items-end gap-2">
            <span className="text-5xl font-black text-white">{stats.totalRequests}</span>
            <span className="text-xl text-emerald-300 font-bold">+{stats.acceptedRequests}</span>
          </div>
          <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-emerald-300 font-bold">Aceptadas: {stats.acceptedRequests}<br />Completadas: {stats.completedRequests}</p>
          <Globe2 size={100} className="absolute right-[-15px] bottom-[-15px] text-white/5" />
        </div>
      </div>

      <section className="rounded-[2rem] border border-white/10 bg-white/80 backdrop-blur-md shadow-lg p-8 mb-6">
        <h3 className="font-black uppercase text-xs text-slate-900 mb-6 tracking-widest">
          Crecimiento Mensual de Usuarios
        </h3>
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <XAxis dataKey="month" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <Tooltip cursor={{ fill: '#f1f5f9' }} contentStyle={{ borderRadius: '1rem', border: 'none' }} />
              <Legend />
              <Bar dataKey="reader" name="Lectores" fill="#10b981" radius={[8, 8, 0, 0]} />
              <Bar dataKey="librero" name="Libreros" fill="#f59e0b" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* MIDDLE */}
      <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-black/20">
          <StatBlock
            title="Eventos"
            value={stats.totalEvents}
            sub={`Próximos: ${stats.upcomingEvents}`}
            icon={<Calendar />}
            color="emerald"
          />

          <StatBlock
            title="Registros en Eventos"
            value={stats.totalRegistrations}
            sub={`Media: ${stats.avgRegistrationsPerEvent}`}
            icon={<ClipboardList />}
            color="blue"
          />

          <StatBlock
            title="Clubes"
            value={stats.totalClubs}
            sub="en total"
            icon={<MessageSquareText />}
            color="amber" />
        </div>


        <div className="mt-6 pt-5 border-t border-slate-300 px-5">
          <div className="flex items-center justify-between mb-4">
            <h4 className="flex-1 text-center text-[12px] font-black uppercase tracking-[0.2em] text-teal-700">
              Marketplace
            </h4>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-6">

            {/* Interacciones */}
            <div className="relative bg-emerald-50 border border-emerald-200  rounded-2xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Interacciones
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {stats.totalInteractions}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center text-teal-600">
                  💬
                </div>
              </div>
            </div>

            {/* Ventas */}
            <div className="relative bg-emerald-50 border border-emerald-200  rounded-2xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Ventas
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {stats.totalSaleListings}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  💰
                </div>
              </div>
            </div>

            {/* Préstamos */}
            <div className="relative bg-emerald-50 border border-emerald-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                    Préstamos
                  </p>
                  <p className="text-2xl font-black text-slate-900 mt-1">
                    {stats.totalLoanListings}
                  </p>
                </div>
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  📦
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM */}
      <div className="grid xl:grid-cols-2 gap-8 mb-6">

        <section className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg p-8 mb-6">
          <h3 className="font-black uppercase text-xs text-slate-900 mb-6 tracking-widest">
            Géneros Populares
          </h3>

          {/* TOP METRICS */}
          <div className="flex gap-3 mb-8">
            <MetricPill label="Total libros" value={stats.totalBooks} />
            <MetricPill label="Géneros" value={chartData.length} />
          </div>

          {/* GRÁFICO Y LEYENDA */}
          <div className="grid lg:grid-cols-[300px_1fr] gap-10 items-center">
            <div className="relative h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    {...({
                      data: chartData,
                      dataKey: "value",
                      nameKey: "name",
                      innerRadius: 90,
                      outerRadius: 130,
                      paddingAngle: 6,
                      activeIndex: activeIndex ?? undefined,
                      activeShape: (props: any) => <Sector {...props} stroke="#fff" strokeWidth={3} />,
                      onMouseEnter: (_: any, index: number) => setActiveIndex(index),
                      onMouseLeave: () => setActiveIndex(null),
                    } as any)}
                  >
                    {chartData.map((entry: any, i: number) => (
                      <Cell
                        key={`cell-${i}`}
                        fill={COLORS[i % COLORS.length]}
                        style={{ opacity: activeIndex === null || activeIndex === i ? 1 : 0.4 }}
                      />
                    ))}
                  </Pie>
                  <Tooltip
                    cursor={false}
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const { name, value } = payload[0];
                        const pct = Math.round(((value as number) / total) * 100);
                        return (
                          <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-100 text-xs font-bold">
                            <p className="text-slate-500 uppercase">{name}</p>
                            <p className="text-slate-900 text-base">{value} libros ({pct}%)</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>

              {/* CENTRO DINÁMICO */}
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {activeIndex !== null ? chartData[activeIndex].name : "Total libros"}
                </p>
                <p className="text-4xl font-black text-slate-900">
                  {activeIndex !== null ? chartData[activeIndex].value : stats.totalBooks}
                </p>
              </div>
            </div>

            {/* LEYENDA MEJORADA */}
            <div className="space-y-3">
              {chartData.map((g: any, i: number) => {
                const pct = Math.round((g.value / total) * 100);
                const isActive = activeIndex === i;
                return (
                  <div
                    key={i}
                    onMouseEnter={() => setActiveIndex(i)}
                    onMouseLeave={() => setActiveIndex(null)}
                    className={`p-3 rounded-xl transition-all cursor-pointer ${isActive ? "bg-slate-100" : "bg-transparent"}`}
                  >
                    <div className="flex justify-between items-center mb-1">
                      <span className={`font-bold text-sm ${isActive ? "text-slate-900" : "text-slate-600"}`}>
                        {g.name}
                      </span>
                      <span className="text-xs font-black text-slate-900">{pct}%</span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${pct}%`, backgroundColor: COLORS[i % COLORS.length] }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg p-8 mb-6">
          <div className="flex justify-between mb-5">
            <h3 className="font-black uppercase text-xs text-slate-900 flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" />
              Libros Tendencia
            </h3>
          </div>

          <div className="space-y-4">
            {stats.topBooks?.map((b: any, i: number) => (
              <div key={i} className="flex gap-3 items-center">
                <span className="text-3xl font-black text-emerald-600 w-10">
                  0{i + 1}
                </span>

                <img
                  src={b.urlPortada}
                  className="w-12 h-16 rounded-xl object-cover"
                />

                <div>
                  <p className="font-black text-sm text-slate-900">
                    {b.title}
                  </p>
                  <p className="text-xs text-slate-700">
                    {b.author}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      {/* LIBREROS */}
      <section className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg p-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 rounded-2xl bg-white/20">
            <Users size={18} />
          </div>

          <h3 className="font-black uppercase text-xs text-slate-900">
            Usuarios Top
          </h3>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          {stats.topLibreros.map((l: any, i: number) => (
            <div
              key={i}
              className="rounded-[1.5rem] border border-white/15 p-5 bg-white/15 flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <img
                  src={l.avatarUrl}
                  className="w-14 h-14 rounded-full object-cover"
                />

                <div>
                  <p className="font-black text-slate-900">
                    {l.fullName}
                  </p>

                  <div className="flex gap-2 text-xs text-slate-700">
                    <Mail size={12} />
                    {l.email}
                  </div>

                  <p className="text-xs text-emerald-700 font-bold mt-1">
                    {l.listingsCount} anuncios
                  </p>
                </div>
              </div>

              <span className="text-3xl font-black text-emerald-600">
                #{i + 1}
              </span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};


const StatBlock = ({
  title,
  value,
  sub,
  icon,
  color,
  chart,
}: any) => {
  const styles: any = {
    emerald: ["bg-emerald-100", "text-emerald-600"],
    red: ["bg-red-100", "text-red-600"],
    blue: ["bg-blue-100", "text-blue-600"],
    amber: ["bg-amber-100", "text-amber-600"],
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between mb-4">
        <p className="font-black uppercase text-xs text-slate-900">
          {title}
        </p>

        <div className={`rounded-2xl p-3 ${styles[color][0]} ${styles[color][1]}`}>
          {icon}
        </div>
      </div>

      <div className="text-3xl sm:text-5xl font-black text-slate-900">
        {value}
      </div>

      {chart}

      <p className="text-sm mt-4 text-slate-800">
        {sub}
      </p>
    </div>
  );
};


const MetricPill = ({ label, value }: any) => (
  <div className="rounded-2xl bg-white/20 px-4 py-2">
    <p className="text-[10px] uppercase text-slate-700">
      {label}
    </p>
    <p className="text-xl font-black text-slate-900">
      {value}
    </p>
  </div>
);