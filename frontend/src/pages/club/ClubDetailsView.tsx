import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Club, Thread, clubsService } from "../../club/service/club.service";
import { bookService } from "../../books/services/book.service";
import {
    BookOpen, MessageSquare, ChevronLeft, Plus,
    Users, Calendar, ArrowRight, BookMarked, Loader2, X
} from "lucide-react";

export const ClubDetailsView = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [club, setClub] = useState<Club | null>(null);
    const [threads, setThreads] = useState<Thread[]>([]);
    const [myBooks, setMyBooks] = useState<any[]>([]);
    
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    
    const [newThread, setNewThread] = useState({ title: '', bookId: '' });

    useEffect(() => {
        const loadClubData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                const [clubData, threadsData] = await Promise.all([
                    clubsService.getClubById(id),
                    clubsService.getThreads(id)
                ]);

                setClub(clubData);
                setThreads(threadsData);
            } catch (error) {
                console.error("Error al cargar el club:", error);
            } finally {
                setLoading(false);
            }
        };

        loadClubData();
    }, [id]);

    useEffect(() => {
        if (showModal) {
            bookService.getMyBooks().then(setMyBooks).catch(console.error);
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
            
            const updatedThreads = await clubsService.getThreads(id);
            setThreads(updatedThreads);
        } catch (error) {
            console.error("Error al crear la sala:", error);
        } finally {
            setIsCreating(false);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] flex-col items-center justify-center gap-4">
            <Loader2 className="w-10 h-10 text-teal-600 animate-spin" />
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Sincronizando comunidad...</p>
        </div>
    );

    if (!club) return (
        <div className="max-w-xl mx-auto mt-20 p-12 bg-white rounded-[3rem] shadow-xl text-center border border-slate-100">
            <div className="w-20 h-20 bg-rose-50 text-rose-500 rounded-3xl flex items-center justify-center mx-auto mb-6">
                <BookMarked size={40} />
            </div>
            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Club extraviado</h3>
            <p className="text-slate-400 font-medium mb-8 italic">No hemos podido localizar esta comunidad.</p>
            <Link to="/clubs" className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all">
                Volver a la biblioteca
            </Link>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F9F9] pb-24 animate-in fade-in duration-700">
            {/* NAVEGACIÓN SUPERIOR */}
            <div className="max-w-7xl mx-auto px-6 pt-8">
                <button
                    onClick={() => navigate('/clubs')}
                    className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
                >
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Comunidades de lectura
                </button>
            </div>

            {/* HEADER DEL CLUB */}
            <header className="max-w-7xl mx-auto px-6 pt-8 pb-12">
                <div className="bg-white/90 backdrop-blur-xl rounded-[3.5rem] p-8 md:p-14 shadow-2xl shadow-slate-200/60 border border-white flex flex-col lg:flex-row gap-12 items-center relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-80 h-80 bg-teal-500/5 rounded-full blur-3xl -mr-32 -mt-32" />

                    <div className="w-48 h-48 bg-gradient-to-br from-slate-800 to-slate-900 rounded-[3rem] flex items-center justify-center text-white shadow-2xl shrink-0 transform -rotate-2 relative">
                        <Users size={72} strokeWidth={1.2} className="text-teal-400" />
                    </div>

                    <div className="flex-1 text-center lg:text-left z-10">
                        <div className="flex flex-wrap justify-center lg:justify-start items-center gap-4 mb-6">
                            <span className="px-5 py-2 bg-teal-600 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-lg shadow-teal-600/20">
                                Comunidad Activa
                            </span>
                            <span className="flex items-center gap-2 text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                                <Calendar size={14} className="text-teal-500" />
                                Desde el {new Date(club.createdAt).toLocaleDateString()}
                            </span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 uppercase tracking-tighter leading-[0.9] mb-6">
                            {club.name}
                        </h1>
                        <p className="text-slate-500 font-medium leading-relaxed max-w-2xl italic text-lg lg:text-xl">
                            "{club.description}"
                        </p>
                    </div>

                    <div className="shrink-0 bg-slate-50/50 backdrop-blur-sm p-8 rounded-[2.5rem] border border-slate-100 text-center min-w-[160px] shadow-inner">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Lectores</p>
                        <p className="text-5xl font-black text-slate-900 tracking-tighter">
                            {club.members?.length || 0}
                        </p>
                    </div>
                </div>
            </header>

            {/* LISTADO DE SALAS */}
            <main className="max-w-7xl mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end md:items-center mb-10 gap-6 px-4">
                    <div>
                        <h2 className="text-2xl font-black text-slate-900 flex items-center gap-4 uppercase tracking-tighter">
                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center shadow-lg border border-slate-50 text-teal-600">
                                <BookOpen size={24} />
                            </div>
                            Salas de Discusión
                        </h2>
                    </div>

                    <button 
                        onClick={() => setShowModal(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl active:scale-95 group"
                    >
                        <Plus size={18} className="group-hover:rotate-90 transition-transform" />
                        Nueva Sala
                    </button>
                </div>

                <div className="grid grid-cols-1 gap-6">
                    {threads.length > 0 ? (
                        threads.map((thread) => (
                            <Link
                                key={thread.id}
                                to={`/clubs/thread/${thread.id}`}
                                className="bg-white/70 backdrop-blur-md p-6 rounded-[3rem] border border-white shadow-sm hover:shadow-2xl hover:shadow-teal-500/5 hover:scale-[1.01] transition-all group flex flex-col md:flex-row items-center justify-between gap-6"
                            >
                                <div className="flex flex-col md:flex-row items-center gap-8 w-full">
                                    <div className="w-24 h-36 bg-slate-100 rounded-[1.5rem] overflow-hidden shadow-2xl border-4 border-white shrink-0 transform group-hover:-rotate-3 transition-transform duration-500 relative">
                                        {thread.relatedBook?.urlPortada ? (
                                            <img src={thread.relatedBook.urlPortada} className="w-full h-full object-cover" alt="" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                <BookMarked size={40} />
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1 text-center md:text-left">
                                        <h4 className="font-black text-slate-900 text-2xl group-hover:text-teal-600 transition-colors uppercase tracking-tight leading-none mb-3">
                                            {thread.title}
                                        </h4>
                                        <span className="px-4 py-1.5 bg-slate-100 text-slate-500 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                            {thread.relatedBook ? `Libro: ${thread.relatedBook.title}` : 'Tema Libre'}
                                        </span>
                                    </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-8 bg-slate-50/50 rounded-[2rem] px-8 py-4 border border-slate-100">
                                    <MessageSquare size={20} className="text-slate-300" />
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-teal-600 group-hover:text-white transition-all duration-500 shadow-md">
                                        <ArrowRight size={24} />
                                    </div>
                                </div>
                            </Link>
                        ))
                    ) : (
                        <div className="text-center py-32 bg-white/40 rounded-[4rem] border-2 border-dashed border-slate-200">
                            <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                            <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">Silencio en la biblioteca</p>
                        </div>
                    )}
                </div>
            </main>

            {/* MODAL: NUEVA SALA DE LECTURA */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)} />
                    
                    <form onSubmit={handleCreateThread} className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 border border-white">
                        <button 
                            type="button" 
                            onClick={() => setShowModal(false)}
                            className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"
                        >
                            <X size={24} />
                        </button>

                        <h3 className="text-2xl font-black text-slate-900 mb-6 uppercase tracking-tight">Crear Sala de Lectura</h3>
                        
                        <div className="space-y-6">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Nombre de la sala</label>
                                <input 
                                    required
                                    value={newThread.title}
                                    onChange={e => setNewThread({...newThread, title: e.target.value})}
                                    placeholder="Ej: Debate Capítulos 1-10"
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-teal-500 transition-all shadow-inner"
                                />
                            </div>

                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Vincular un libro (Opcional)</label>
                                <select 
                                    value={newThread.bookId}
                                    onChange={e => setNewThread({...newThread, bookId: e.target.value})}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:bg-white focus:border-teal-500 transition-all appearance-none cursor-pointer shadow-inner"
                                >
                                    <option value="">Discusión general (Sin filtros)</option>
                                    {myBooks.map(b => (
                                        <option key={b.id} value={b.id}>{b.title}</option>
                                    ))}
                                </select>
                                <p className="text-[9px] text-teal-600 font-bold mt-3 ml-4 uppercase tracking-tighter">
                                    * Activa el control de spoilers según el progreso de Olga.
                                </p>
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isCreating}
                            className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/20 active:scale-95 flex items-center justify-center gap-3"
                        >
                            {isCreating ? <Loader2 className="animate-spin" size={20} /> : "Abrir Sala"}
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
};