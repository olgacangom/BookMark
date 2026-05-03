import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Club, Thread, clubsService } from "../../club/service/club.service";
import { bookService, Book } from "../../books/services/book.service"; 
import { useAuth } from "../../context/AuthContext";
import {
    BookOpen, MessageSquare, ChevronLeft, Plus,
    Users, Calendar, ArrowRight, Loader2, X,
    UserPlus, Info, CheckCircle2, MessageCircle,
    Check, Lock as LockIcon, ChevronDown,
} from "lucide-react";

export const ClubDetailsView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { user: currentUser } = useAuth();

    const [club, setClub] = useState<Club | null>(null);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [myBooks, setMyBooks] = useState<Book[]>([]); 

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    const [newThread, setNewThread] = useState({ title: '', bookId: '' });

    const loadData = useCallback(async () => {
        if (!id) return;
        try {
            const [clubData, threadsData] = await Promise.all([
                clubsService.getClubById(id),
                clubsService.getThreads(id)
            ]);
            setClub(clubData);
            setThreads(threadsData);
        } catch (error) {
            console.error("Error al cargar datos del club:", error);
        }
    }, [id]);

    useEffect(() => {
        const init = async () => {
            setLoading(true);
            await loadData();
            setLoading(false);
        };
        init();
    }, [id, loadData]);

    useEffect(() => {
        if (showModal) {
            bookService.getMyBooks()
                .then((data) => {
                    setMyBooks(data);
                })
                .catch(console.error);
        }
    }, [showModal]);

    const handleCreateThread = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!id) return;
        setIsCreating(true);
        try {
            await clubsService.createThread(
                id,
                newThread.title,
                newThread.bookId ? Number(newThread.bookId) : undefined
            );
            setShowModal(false);
            setNewThread({ title: '', bookId: '' });
            await loadData();
        } catch (error) {
            console.error("Error al crear la sala:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleJoinClub = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            await clubsService.joinClub(id);
            await loadData();
        } catch (error) {
            console.error("Error al unirse al club:", error);
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFB]"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;
    if (!club) return null;

    const isMember = club.members?.some(m => m.id === currentUser?.id);
    const totalMembers = club.members?.length || 0;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20 text-left animate-in fade-in duration-500">
            <div className="max-w-[1400px] mx-auto px-8 pt-8">
                <button onClick={() => navigate('/clubs')} className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Comunidades de lectura
                </button>
            </div>

            <main className="max-w-[1400px] mx-auto px-8 pt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

                <div className="lg:col-span-8 space-y-10">
                    {/* HERO CARD */}
                    <section className="bg-white rounded-[3rem] p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10 items-center md:items-start relative overflow-hidden">
                        <div className="w-44 h-44 bg-slate-900 rounded-[2.5rem] flex items-center justify-center shrink-0 shadow-2xl relative">
                            <Users size={70} className="text-teal-400" strokeWidth={1.2} />
                            <div className="absolute -bottom-2 -right-2 w-10 h-10 bg-teal-500 rounded-full border-4 border-white flex items-center justify-center text-white">
                                <Check size={20} strokeWidth={4} />
                            </div>
                        </div>

                        <div className="flex-1 text-center md:text-left pt-2">
                            <div className="flex flex-wrap justify-center md:justify-start gap-3 mb-4">
                                <span className="px-4 py-1 bg-teal-50 text-teal-600 rounded-lg text-[9px] font-black uppercase tracking-widest border border-teal-100">Comunidad Activa</span>
                                <span className="px-4 py-1 bg-slate-50 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest border border-slate-100 flex items-center gap-2">
                                    <Calendar size={12} /> Desde el {new Date(club.createdAt).toLocaleDateString()}
                                </span>
                            </div>
                            <h1 className="text-5xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">{club.name}</h1>
                            <p className="text-slate-400 font-bold italic text-lg mb-6">"{club.description}"</p>
                        </div>

                        <div className="flex flex-col gap-3 shrink-0">
                            <div className="bg-slate-50 rounded-2xl p-4 text-center border border-slate-100 mb-2 shadow-inner">
                                <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Miembros</p>
                                <p className="text-3xl font-black text-slate-900 leading-none">{totalMembers}</p>
                            </div>

                            {!isMember ? (
                                <button onClick={handleJoinClub} disabled={actionLoading} className="flex items-center justify-center gap-2 px-6 py-4 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 shadow-lg transition-all">
                                    {actionLoading ? <Loader2 className="animate-spin" size={16} /> : <><UserPlus size={14} /> Unirme al Club</>}
                                </button>
                            ) : (
                                <button className="flex items-center justify-center gap-2 px-6 py-4 bg-slate-100 text-slate-400 rounded-xl text-[10px] font-black uppercase tracking-widest cursor-default border border-slate-200">
                                    <Check size={14} /> Eres miembro
                                </button>
                            )}
                        </div>
                    </section>

                    <section>
                        <div className="flex justify-between items-center mb-8 px-4">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl">
                                    <BookOpen size={24} />
                                </div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tighter">
                                    Salas de discusión ({threads.length})
                                </h2>
                            </div>

                            <button
                                onClick={() => setShowModal(true)}
                                className="px-6 py-2.5 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:bg-teal-600 transition-all flex items-center gap-2 shadow-md"
                            >
                                <Plus size={14} strokeWidth={3} /> Nueva Sala
                            </button>
                        </div>

                        <div className="space-y-4">
                            {threads.map((thread) => (
                                <Link key={thread.id} to={`/clubs/thread/${thread.id}`} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex items-center justify-between group">
                                    <div className="flex items-center gap-6">
                                        <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 overflow-hidden">
                                            {thread.relatedBook ? <img src={thread.relatedBook.urlPortada} className="w-full h-full object-cover rounded-xl" alt="portada" /> : <MessageCircle size={28} />}
                                        </div>
                                        <div className="text-left">
                                            <h4 className="font-black text-slate-600 text-s uppercase tracking-tight group-hover:text-teal-600 transition-colors">{thread.title}</h4>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-slate-400 font-bold group-hover:text-teal-600 transition-colors">
                                            <MessageSquare size={18} />
                                        </div>
                                        <div className="w-10 h-10 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center group-hover:bg-teal-600 group-hover:text-white transition-all shadow-sm">
                                            <ArrowRight size={20} />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                </div>

                <aside className="lg:col-span-4 space-y-6">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-left">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Info size={14} className="text-teal-500" /> Sobre esta comunidad</h3>
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-6 ml-5">
                            Fundado por {club.creator?.fullName}
                        </p>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">
                            Un espacio para todos los fans de <span className="font-extrabold text-teal-600">"{club.name}"</span>. Compartiremos lecturas, teorías y pasión por la lectura.</p>

                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-left">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                            <Users size={14} className="text-teal-500" /> Participantes ({totalMembers})
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {club.members?.map((member: any) => (
                                <img
                                    key={member.id}
                                    title={member.fullName}
                                    src={member.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${member.id}`}
                                    className="w-10 h-10 rounded-xl border-2 border-white shadow-sm object-cover bg-slate-50 hover:scale-110 transition-transform cursor-help"
                                    alt="avatar"
                                />
                            ))}
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-left">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><LockIcon size={14} className="text-teal-500" /> Reglas</h3>
                        <ul className="space-y-4">
                            {['Respeta a todos los miembros', 'No spoilers sin previo aviso', 'Disfruta de la lectura compartida'].map((rule, i) => (
                                <li key={i} className="flex items-start gap-3 text-left">
                                    <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-[11px] font-bold text-slate-600">{rule}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </main>

            {/* MODAL NUEVA SALA */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)} />
                    <form onSubmit={handleCreateThread} className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 border-8 border-white text-left">
                        <button type="button" onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                            <X size={24} />
                        </button>
                        <h3 className="text-2xl font-black text-slate-900 mb-8 uppercase tracking-tight italic leading-tight">Abrir Nueva Sala</h3>

                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Asunto del debate</label>
                                <input
                                    required
                                    value={newThread.title}
                                    onChange={e => setNewThread({ ...newThread, title: e.target.value })}
                                    className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-teal-500/5 outline-none transition-all"
                                    placeholder="Ej: Teorías sobre el final"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Vincular un libro (Opcional)</label>
                                <div className="relative">
                                    <select
                                        value={newThread.bookId}
                                        onChange={e => setNewThread({ ...newThread, bookId: e.target.value })}
                                        className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-teal-500/5 outline-none transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="">Discusión general (Sin libro)</option>
                                        {myBooks.map(b => (
                                            <option key={b.id} value={b.id}>{b.title}</option>
                                        ))}
                                    </select>
                                    <ChevronDown className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400" size={18} />
                                </div>
                                <p className="text-[9px] text-teal-600 font-bold mt-3 ml-4 uppercase tracking-tighter">
                                    * Esto activará el control de spoilers basado en tu progreso de lectura.
                                </p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            disabled={isCreating}
                            className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl flex items-center justify-center gap-3"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={18} /> : "Crear Sala"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};