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
  MessageSquareText
} from "lucide-react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const COLORS = [
  "#5B74E8",
  "#C89A33",
  "#5A9985",
  "#7B61FF",
  "#AAB4C5",
];

export const AdminStatsView = () => {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    api.get("/admin/stats-global").then((res) => setStats(res.data));
  }, []);

  if (!stats)
    return (
      <div className="fixed inset-0 bg-linear-to-r from-slate-700 via-teal-600 to-emerald-600 p-5 lg:p-8 overflow-y-auto">        <RefreshCw className="animate-spin text-white" size={42} />
      </div>
    );

  const chartData =
    stats.topGenres?.map((g: any) => ({
      name: g.genre,
      value: Number(g.count),
    })) || [];

  return (
      <div>

        <header className="mb-8">
          <h1 className="text-4xl font-black uppercase italic text-white">
            ESTADÍSTICAS
          </h1>
          <p className="mt-2 text-[10px] uppercase tracking-[0.35em] font-black text-white/70">
            Panel de control administrativo • Global
          </p>
        </header>

        {/* TOP */}
        <div className="grid xl:grid-cols-[1fr_280px] gap-5 mb-6">
          <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg">
            <div className="grid md:grid-cols-4 divide-x divide-black/20">

              <StatBlock
                title="Usuarios lectores"
                value={stats.totalUsers}
                sub="usuarios que leen"
                icon={<Users />}
                color="emerald"
                chart={
                  <StatChart
                    data={stats.weeklyUserGrowth}
                    color="#16a34a"
                  />
                }
              />

              <StatBlock
                title="Libreros"
                value={stats.totalLibreros}
                sub={`Pendientes: ${stats.pendingLibreros}`}
                icon={<Library />}
                color="amber"
                chart={
                  <StatChart
                    data={stats.weeklyLibreroGrowth?.length ? stats.weeklyLibreroGrowth : stats.weeklyUserGrowth}
                    color="#f59e0b"
                  />
                }
              />

              <StatBlock
                title="Libros Totales"
                value={stats.totalBooks}
                sub="libros registrados"
                icon={<BookOpen />}
                color="blue"
                chart={
                  <StatChart
                    data={stats.weeklyListingGrowth}
                    color="#2563eb"
                  />
                }
              />

              <StatBlock
                title="Anuncios de libros"
                value={stats.totalAvailableListings}
                sub={`actuales de ${stats.totalListings} registrados`}
                icon={<Megaphone />}
                color="amber"
                chart={
                  <StatChart
                    data={stats.weeklyListingGrowth}
                    color="#f59e0b"
                  />
                }
              />
            </div>
          </div>

          <div className="relative overflow-hidden rounded-[2rem] bg-[#07111e] p-6 shadow-xl">
            <p className="text-[10px] uppercase tracking-[0.3em] font-black text-white/60">
              Solicitudes Totales
            </p>

            <div className="mt-4 flex items-end gap-2">
              <span className="text-5xl font-black text-white">
                {stats.totalRequests}
              </span>
              <span className="text-xl text-emerald-300 font-bold">
                +{stats.acceptedRequests}
              </span>
            </div>

            <p className="mt-4 text-[9px] uppercase tracking-[0.2em] text-emerald-300 font-bold">
              Aceptadas: {stats.acceptedRequests}
              <br />
              Completadas: {stats.completedRequests}
            </p>

            <Globe2
              size={100}
              className="absolute right-[-15px] bottom-[-15px] text-white/5"
            />
          </div>
        </div>

        {/* MIDDLE */}
        <div className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg mb-6">
          <div className="grid md:grid-cols-3 divide-x divide-black/20">
            <StatBlock
              title="Eventos"
              value={stats.totalEvents}
              sub={`Próximos: ${stats.upcomingEvents}`}
              icon={<Calendar />}
              color="emerald"
            />

            <StatBlock
              title="Registros"
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

          <div className="grid md:grid-cols-3 border-t border-black/20">
            <SmallInfo
              label="Interacciones"
              value={stats.totalInteractions}
            />
            <SmallInfo
              label="Ventas"
              value={stats.totalSaleListings}
            />
            <SmallInfo
              label="Préstamos"
              value={stats.totalLoanListings}
            />
          </div>
        </div>

        {/* BOTTOM */}
        <div className="grid xl:grid-cols-2 gap-8 mb-6">

          <section className="rounded-[2rem] overflow-hidden border border-white/10 bg-white/80 backdrop-blur-md shadow-lg p-8 mb-6">
            <h3 className="font-black uppercase text-xs text-slate-900 mb-5">
              Géneros Populares
            </h3>

            <div className="flex gap-3 mb-6">
              <MetricPill label="Total" value={stats.totalBooks} />
              <MetricPill label="Géneros" value={chartData.length} />
            </div>

            <div className="grid lg:grid-cols-[220px_1fr] gap-6 items-center">
              <div className="relative h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      innerRadius={55}
                      outerRadius={85}
                      dataKey="value"
                    >
                      {chartData.map((_: any, i: number) => (
                        <Cell
                          key={i}
                          fill={COLORS[i % COLORS.length]}
                        />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>

                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-5xl font-black text-slate-900">
                    {stats.totalBooks}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                {chartData.map((g: any, i: number) => {
                  const total = chartData.reduce(
                    (a: number, b: any) => a + b.value,
                    0
                  );

                  const pct = Math.round((g.value / total) * 100);

                  return (
                    <div key={i}>
                      <div className="flex justify-between text-sm font-bold text-slate-800 mb-1">
                        <span>{g.name}</span>
                        <span>{pct}%</span>
                      </div>

                      <div className="h-2 bg-slate-200 rounded-full">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${pct}%`,
                            backgroundColor:
                              COLORS[i % COLORS.length],
                          }}
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
    <div className="p-6">
      <div className="flex justify-between mb-4">
        <p className="font-black uppercase text-xs text-slate-900">
          {title}
        </p>

        <div className={`rounded-2xl p-3 ${styles[color][0]} ${styles[color][1]}`}>
          {icon}
        </div>
      </div>

      <div className="text-5xl font-black text-slate-900">
        {value}
      </div>

      {chart}

      <p className="text-sm mt-4 text-slate-800">
        {sub}
      </p>
    </div>
  );
};

const SmallInfo = ({ label, value }: any) => (
  <div className="p-4 text-center">
    <p className="text-[12px] uppercase text-black/80">
      {label}
    </p>
    <p className="text-lg font-black text-black/80">
      {value}
    </p>
  </div>
);

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

const StatChart = ({ data, color }: any) => {
  if (!data?.length) return null;

  const values = data.map((d: any) => d.value);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);

  const range = max - min || 1;

  const points = data
    .map((d: any, i: number) => {
      const x = 8 + i * (104 / (data.length - 1));

      // escala real para que no salga plano
      const normalized = (d.value - min) / range;

      // altura entre 8 y 32
      const y = 32 - normalized * 22;

      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="mt-4 rounded-3xl bg-white/30 p-3 border border-white/20">
      <svg viewBox="0 0 120 40" className="w-full h-9">

        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <polyline
          fill="none"
          stroke={color}
          strokeWidth="3"
          points={points}
          filter="url(#glow)"
          className="animate-pulse"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {data.map((d: any, i: number) => {
          const x = 8 + i * (104 / (data.length - 1));
          const normalized = (d.value - min) / range;
          const y = 32 - normalized * 22;

          return (
            <circle
              key={i}
              cx={x}
              cy={y}
              r="2.5"
              fill={color}
            />
          );
        })}
      </svg>
    </div>
  );
};
