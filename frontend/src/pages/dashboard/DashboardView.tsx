import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookService, Book } from '../../books/services/book.service';
import { Link } from 'react-router-dom';
import {
    BookOpen,
    Users,
    Trophy,
    Flame,
    Target,
    Sparkles
} from "lucide-react";

export const DashboardView = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);

    const challenges = [
        { id: 1, name: 'Reto 2026', description: 'Lee 12 libros este año', current: 3, target: 12, icon: '🎯' },
    ];

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await bookService.getMyBooks();
                setBooks(data);
            } catch (e) {
                console.error("Error cargando biblioteca:", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const currentlyReading = books.filter((b) => b.status === "Reading");
    const booksRead = books.filter((b) => b.status === "Read").length;

    if (loading) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-primary font-black uppercase tracking-widest text-xs animate-pulse">Organizando estanterías...</p>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 animate-in fade-in duration-700">
            <div className="bg-gradient-to-br from-[#a4a99f] via-[#9b8b7e] to-[#b5a99a] rounded-[2.5rem] p-8 md:p-10 text-white mb-8 shadow-2xl shadow-neutral-300/30 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-4xl md:text-5xl font-bold">¡Hola, {user?.fullName?.split(' ')[0]}!</h1>
                        <Sparkles className="w-8 h-8 text-amber-200/60 animate-pulse" />
                    </div>
                    <p className="text-white/90 text-lg mb-8">Tu espacio literario te espera</p>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatBannerCard icon={<Flame className="text-orange-100" />} value="5" label="días seguidos" bg="bg-orange-400/30" />
                        <StatBannerCard icon={<BookOpen className="text-blue-100" />} value={booksRead.toString()} label="libros leídos" bg="bg-blue-400/30" />
                        <StatBannerCard icon={<Trophy className="text-yellow-100" />} value="1" label="logros" bg="bg-yellow-400/30" />
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-3 gap-5 mb-10">
                <QuickActionLink to="/library" icon={<BookOpen />} title="Explorar Libros" desc="Encuentra tu lectura" color="from-[#9b8b7e] to-[#c5b5aa]" />
                <QuickActionLink to="/library" icon={<Users />} title="Clubes de Lectura" desc="Únete a la comunidad" color="from-[#c5b5aa] to-[#d0bfb3]" />
                <QuickActionLink to="/library" icon={<Target />} title="Retos" desc="Alcanza tus metas" color="from-[#a4a99f] to-[#b8bdb3]" />
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-sm border border-neutral-100/50">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <BookOpen className="w-6 h-6 text-[#9b8b7e]" /> Leyendo Ahora
                        </h2>
                        <Link to="/library" className="text-[#9b8b7e] text-sm font-bold hover:underline">Ver todos →</Link>
                    </div>

                    {currentlyReading.length === 0 ? (
                        <div className="text-center py-12 bg-neutral-50 rounded-3xl border-2 border-dashed border-neutral-100">
                            <p className="text-slate-400 font-medium">No hay lecturas activas</p>
                            <Link to="/library" className="text-indigo-500 text-sm font-bold mt-2 inline-block">Añadir libro</Link>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentlyReading.map(book => (
                                <div key={book.id} className="flex gap-4 p-4 rounded-3xl hover:bg-neutral-50 transition-all border border-transparent hover:border-neutral-100">
                                    <div className="w-16 h-24 bg-neutral-200 rounded-xl shadow-md flex items-center justify-center text-neutral-400">📖</div>
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-800">{book.title}</h3>
                                        <p className="text-sm text-slate-500 mb-3">{book.author}</p>
                                        <div className="w-full bg-neutral-100 h-2 rounded-full">
                                            <div className="bg-[#9b8b7e] h-2 rounded-full" style={{ width: '45%' }}></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white/80 backdrop-blur-sm rounded-[2.5rem] p-8 shadow-sm border border-neutral-100/50">
                    <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <Target className="w-6 h-6 text-[#a4a99f]" /> Retos Activos
                    </h2>
                    {challenges.map(c => (
                        <div key={c.id} className="p-6 bg-gradient-to-br from-neutral-50 to-white rounded-3xl border border-neutral-100 relative overflow-hidden">
                            <div className="relative z-10">
                                <div className="flex justify-between mb-2">
                                    <span className="font-bold text-slate-700">{c.name}</span>
                                    <span className="text-[#a4a99f] font-black">{Math.round((c.current/c.target)*100)}%</span>
                                </div>
                                <div className="w-full bg-neutral-200 h-3 rounded-full overflow-hidden">
                                    <div className="bg-[#a4a99f] h-3 rounded-full" style={{ width: `${(c.current/c.target)*100}%` }}></div>
                                </div>
                                <p className="text-xs text-slate-400 mt-3">{c.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

const StatBannerCard = ({ icon, value, label, bg }: any) => (
    <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md rounded-3xl px-6 py-4 border border-white/10">
        <div className={`${bg} p-3 rounded-2xl`}>{icon}</div>
        <div>
            <p className="text-3xl font-black">{value}</p>
            <p className="text-white/70 text-xs font-bold uppercase tracking-wider">{label}</p>
        </div>
    </div>
);

const QuickActionLink = ({ to, icon, title, desc, color }: any) => (
    <Link to={to} className="group bg-white p-6 rounded-[2rem] shadow-sm border border-neutral-50 hover:shadow-xl transition-all hover:-translate-y-1">
        <div className="flex items-center gap-4">
            <div className={`bg-gradient-to-br ${color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                {icon}
            </div>
            <div>
                <h3 className="font-bold text-slate-800">{title}</h3>
                <p className="text-xs text-slate-400 font-medium">{desc}</p>
            </div>
        </div>
    </Link>
);