import { useEffect, useState } from 'react';
import { bookService, Book } from '../../books/services/book.service';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import {
    BookOpen, Trophy, Flame, Target, Sparkles,
    BarChart3, Award, History,
    TrendingUp, BookCheck, Bookmark
} from "lucide-react";
import { BooksGrowthChart } from '../../components/stats/BooksGrowthChart';

export const DashboardView = () => {
    const { user } = useAuth();
    const [books, setBooks] = useState<Book[]>([]);
    const [growthData, setGrowthData] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [booksData, statsResponse] = await Promise.all([
                    bookService.getMyBooks(),
                    fetch(`${import.meta.env.VITE_API_URL}/users/stats/growth`, {
                        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
                    }).then(res => res.json())
                ]);
                setBooks(booksData);
                setGrowthData(statsResponse);
            } catch (e) { console.error(e); } finally { setLoading(false); }
        };
        loadData();
    }, []);

    
    const currentlyReading = books.filter(b => b.status === "Reading");
    const booksRead = books.filter(b => b.status === "Read");
    const wantToRead = books.filter(b => b.status === "Want to Read");

    const totalPages = booksRead.reduce((acc, b) => acc + (Number(b.pageCount) || 0), 0);
    const formattedPages = totalPages >= 1000 ? `${(totalPages / 1000).toFixed(1)}k` : totalPages;

    const currentYear = new Date().getFullYear();
    const countForGoal = booksRead.length; 
    const yearlyTarget = 50; 
    const challengePercent = Math.min(Math.round((countForGoal / yearlyTarget) * 100), 100);

    const isStreakActive = books.some(b => {
        const lastUpdate = new Date(b.updatedAt).getTime();
        const fortyEightHoursAgo = Date.now() - (48 * 60 * 60 * 1000);
        return lastUpdate > fortyEightHoursAgo;
    });

    if (loading) return (
        <div className="min-h-screen bg-[#F0F9F9] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-20">
            <header className="max-w-7xl mx-auto px-6 pt-10 pb-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black tracking-tight text-slate-900">
                            Tu Progreso, <span className="text-teal-600 font-serif italic">{user?.fullName?.split(' ')[0]}.</span>
                        </h1>
                        <p className="text-slate-500 font-medium mt-1">
                            {countForGoal > 0 
                                ? `Llevas ${countForGoal} libros completados. ¡Sigue así!` 
                                : "Es un buen momento para empezar una nueva historia."}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <div className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm flex items-center gap-2">
                            <Flame className={`w-4 h-4 ${isStreakActive ? 'text-orange-500 fill-orange-500' : 'text-slate-300'}`} />
                            <span className="text-sm font-bold text-slate-700">
                                {isStreakActive ? 'Racha Activa' : 'Sin actividad'}
                            </span>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                    <StatCard label="Libros Leídos" value={booksRead.length} icon={<BookCheck className="w-5 h-5 text-white" />} color="from-slate-700 to-slate-800" />
                    <StatCard label="Páginas Totales" value={formattedPages} icon={<Trophy className="w-5 h-5 text-white" />} color="from-sky-600 to-cyan-600" />
                    <StatCard label="Leyendo" value={currentlyReading.length} icon={<BookOpen className="w-5 h-5 text-white" />} color="from-teal-600 to-emerald-600" />
                    <StatCard label="Pendientes" value={wantToRead.length} icon={<Bookmark className="w-5 h-5 text-white" />} color="from-amber-500 to-orange-500" />
                </div>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-8 space-y-8">
                        <section className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-xl shadow-slate-200/50">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2 mb-8">
                                <BarChart3 className="text-teal-600 w-5 h-5" /> Análisis de Ritmo
                            </h2>
                            <div className="h-[300px]">
                                <BooksGrowthChart data={growthData} color="#0D9488" />
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex justify-between items-center px-2">
                                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                                    <History className="w-5 h-5 text-teal-600" /> Continuar Leyendo
                                </h2>
                                <Link to="/library" className="text-teal-600 text-xs font-bold uppercase tracking-widest">Ver todo</Link>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {currentlyReading.length > 0 ? (
                                    currentlyReading.slice(0, 2).map(book => (
                                        <ReadingCard key={book.id} book={book} />
                                    ))
                                ) : (
                                    <div className="col-span-2 py-10 bg-white/40 rounded-3xl border border-dashed border-slate-300 text-center text-slate-400 text-sm font-medium italic">
                                        No tienes lecturas en curso.
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-4 space-y-8">
                        <section className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-xl shadow-slate-200/50">
                            <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <Target className="w-5 h-5 text-emerald-600" /> Meta {currentYear}
                            </h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-end">
                                    <span className="text-sm font-bold text-slate-700">Objetivo Anual</span>
                                    <span className="text-sm font-extrabold text-teal-600">{countForGoal}/{yearlyTarget}</span>
                                </div>
                                <div className="h-4 w-full bg-slate-100 rounded-full overflow-hidden p-1 shadow-inner">
                                    <div 
                                        className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000 shadow-lg"
                                        style={{ width: `${challengePercent}%` }}
                                    />
                                </div>
                                <p className="text-[11px] text-slate-400 font-medium italic text-center leading-relaxed">
                                    {challengePercent === 0 
                                        ? "¡Termina un libro para activar tu progreso!" 
                                        : `Has completado el ${challengePercent}% de tu meta para ${currentYear}.`}
                                </p>
                            </div>
                        </section>

                        <section className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                            <div className="relative z-10">
                                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                                    <Award className="w-5 h-5 text-teal-400" /> Rango de Lector
                                </h3>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className="w-14 h-14 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl shadow-inner border border-white/10">
                                        {totalPages > 5000 ? '🏅' : totalPages > 1000 ? '📖' : '👶'}
                                    </div>
                                    <div>
                                        <h4 className="font-bold text-sm">
                                            {totalPages > 5000 ? 'Erudito' : totalPages > 1000 ? 'Lector Voraz' : 'Iniciado'}
                                        </h4>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold tracking-widest">
                                            {totalPages} páginas devoradas
                                        </p>
                                    </div>
                                </div>
                                <Link to="/library">
                                    <button className="w-full py-3 bg-teal-600 text-white font-bold rounded-xl text-[10px] uppercase tracking-widest hover:bg-teal-500 transition-all">
                                        Añadir más lecturas
                                    </button>
                                </Link>
                            </div>
                            <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-teal-500/10 rotate-12" />
                        </section>
                    </div>
                </div>
            </main>
        </div>
    );
};

const ReadingCard = ({ book }: { book: Book }) => {

    return (
        <div className="bg-white/60 backdrop-blur-sm p-4 rounded-[2rem] border border-white flex gap-4 hover:shadow-md transition-all group">
            <div className="w-16 h-24 bg-slate-200 rounded-2xl overflow-hidden shadow-md shrink-0 border border-white transform group-hover:scale-105 transition-transform">
                {book.urlPortada ? (
                    <img src={book.urlPortada} className="w-full h-full object-cover" alt={book.title} />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-black">{book.title[0]}</div>
                )}
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <div className="flex justify-between items-start">
                    <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-black text-slate-900 truncate tracking-tight uppercase leading-tight">{book.title}</h4>
                        <p className="text-[10px] font-bold text-teal-600 uppercase mb-3 truncate">{book.author}</p>
                    </div>
                    <TrendingUp size={14} className="text-teal-500 shrink-0 ml-2" />
                </div>              
            </div>
        </div>
    );
};

const StatCard = ({ label, value, icon, color }: any) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white hover:shadow-lg transition-all shadow-sm">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl mb-4 flex items-center justify-center shadow-lg`}>
            {icon}
        </div>
        <div className="text-2xl font-black text-slate-900 mb-0.5">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
);