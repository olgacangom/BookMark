import { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { clubsService, Thread, ThreadPost } from '../../club/service/club.service';
import { bookService, Book } from '../../books/services/book.service';
import {
    Send, Loader2, MessageSquare, Sparkles,
    ChevronLeft, Smile, Info, Users, CheckCircle2,
    Lock
} from 'lucide-react';
import { ThreadPostItem } from '../../club/components/ThreadPostItem';
import { io, Socket } from 'socket.io-client';
import EmojiPicker, { EmojiClickData, Theme } from 'emoji-picker-react';

export const ThreadView = () => {
    const { threadId } = useParams();
    const navigate = useNavigate();

    const [thread, setThread] = useState<Thread | null>(null);
    const [posts, setPosts] = useState<ThreadPost[]>([]);
    const [userBook, setUserBook] = useState<Book | null>(null);

    const [newPost, setNewPost] = useState('');
    const [spoilerPage, setSpoilerPage] = useState(0);
    const [isSpoiler, setIsSpoiler] = useState(false);
    const [loading, setLoading] = useState(true);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);

    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);
    const emojiPickerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (emojiPickerRef.current && !emojiPickerRef.current.contains(event.target as Node)) {
                setShowEmojiPicker(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const scrollToBottom = useCallback(() => {
        setTimeout(() => {
            scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    const loadData = useCallback(async () => {
        if (!threadId) return;
        try {
            setLoading(true);
            const [t, p] = await Promise.all([
                clubsService.getThreadById(threadId),
                clubsService.getPosts(threadId)
            ]);

            setThread(t);
            setPosts(p);
            if (t.id) {
                // Aquí debería obtener el club al que pertenece el thread
                // Si el backend no da el clubId en el thread, hab´ra que pasarlo por URL o Contexto
                // Por ahora usamos la data del thread y buscamos el progreso
            }

            if (t.relatedBook) {
                const myBooks = await bookService.getMyBooks();
                const bookProgress = myBooks.find(b => b.isbn === t.relatedBook?.isbn);
                setUserBook(bookProgress || null);
            }
            scrollToBottom();
        } catch (e) {
            console.error("Error cargando la sala:", e);
        } finally {
            setLoading(false);
        }
    }, [threadId, scrollToBottom]);

    useEffect(() => {
        if (threadId) {
            loadData();
            const socketUrl = import.meta.env.VITE_API_URL_WS || 'http://localhost:3000';
            socketRef.current = io(socketUrl);
            socketRef.current.on(`thread-${threadId}`, (newIncomingPost: ThreadPost) => {
                setPosts(prev => prev.find(p => p.id === newIncomingPost.id) ? prev : [...prev, newIncomingPost]);
                scrollToBottom();
            });
            return () => { socketRef.current?.disconnect(); };
        }
    }, [threadId, loadData, scrollToBottom]);

    const onEmojiClick = (emojiData: EmojiClickData) => {
        setNewPost(prev => prev + emojiData.emoji);
    };

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() || !threadId) return;
        try {
            const post = await clubsService.createPost(threadId, newPost, isSpoiler ? spoilerPage : 0);
            setPosts(prev => [...prev, { ...post, createdAt: post.createdAt || new Date().toISOString() }]);
            setNewPost('');
            setSpoilerPage(0);
            setIsSpoiler(false);
            setShowEmojiPicker(false);
            scrollToBottom();
        } catch (e) {
            console.error("Error al enviar mensaje:", e);
        }
    };

    // Cálculo dinámico de progreso
    const progressPercentage = userBook?.pageCount
        ? Math.round((userBook.currentPage / userBook.pageCount) * 100)
        : 0;

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFB]"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-10 text-left animate-in fade-in duration-500">
            <div className="max-w-[1400px] mx-auto px-8 pt-6">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-teal-600 font-black text-[10px] uppercase tracking-[0.2em] transition-all group">
                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                    Volver al Club
                </button>
            </div>

            <main className="max-w-[1400px] mx-auto px-8 pt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-140px)]">

                {/* COLUMNA IZQUIERDA: CHAT */}
                <div className="lg:col-span-8 flex flex-col bg-white rounded-[3rem] shadow-sm border border-slate-100 overflow-hidden relative">
                    <header className="p-6 border-b border-slate-50 flex justify-between items-center bg-white/50 backdrop-blur-md z-20">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg"><MessageSquare size={24} /></div>
                            <div>
                                <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">{thread?.title}</h2>
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest mt-1">Sala de discusión activa</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl border border-slate-100">
                            <Users size={14} className="text-slate-400" />
                            <span className="text-[10px] font-black text-slate-500 uppercase">En directo</span>
                            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse ml-1" />
                        </div>
                    </header>

                    <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/30 custom-scrollbar">
                        {posts.length > 0 ? posts.map(post => (
                            <ThreadPostItem key={post.id} post={post} userCurrentPage={userBook?.currentPage || 0} />
                        )) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-300">
                                <Sparkles size={40} className="mb-4 opacity-20" />
                                <p className="font-black uppercase text-[10px] tracking-[0.2em]">Sé el primero en compartir algo</p>
                            </div>
                        )}
                        <div ref={scrollRef} />
                    </div>

                    <div className="p-6 bg-white border-t border-slate-100 relative">
                        {/* EMOJI PICKER REAL */}
                        {showEmojiPicker && (
                            <div ref={emojiPickerRef} className="absolute bottom-24 right-8 z-50 shadow-2xl">
                                <EmojiPicker
                                    onEmojiClick={onEmojiClick}
                                    theme={Theme.LIGHT}
                                    width={300}
                                    height={400}
                                />
                            </div>
                        )}

                        <form onSubmit={handleSend} className="max-w-5xl mx-auto space-y-4">
                            <div className="flex items-center gap-4">
                                <div className="flex-1 relative">
                                    <input
                                        type="text"
                                        value={newPost}
                                        onChange={(e) => setNewPost(e.target.value)}
                                        placeholder="Escribe tu mensaje..."
                                        className="w-full bg-slate-100 border-none rounded-2xl py-4 pl-6 pr-12 text-sm font-medium focus:bg-white focus:ring-4 focus:ring-teal-500/5 transition-all outline-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                        className={`absolute right-4 top-1/2 -translate-y-1/2 transition-colors ${showEmojiPicker ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}
                                    >
                                        <Smile size={20} />
                                    </button>
                                </div>
                                <button type="submit" disabled={!newPost.trim()} className="w-14 h-14 bg-teal-600 text-white rounded-2xl flex items-center justify-center shadow-lg hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50">
                                    <Send size={24} />
                                </button>
                            </div>

                            <div className="flex items-center justify-between px-2">
                                <div className="flex items-center gap-6">
                                    <label className="flex items-center gap-2 cursor-pointer group">
                                        <input type="checkbox" checked={isSpoiler} onChange={(e) => setIsSpoiler(e.target.checked)} className="w-4 h-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500" />
                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest group-hover:text-teal-600 transition-colors">Contiene spoiler</span>
                                    </label>
                                    {isSpoiler && (
                                        <div className="flex items-center gap-2 bg-slate-100 rounded-lg px-3 py-1 border border-slate-200 animate-in zoom-in-95">
                                            <span className="text-[10px] font-bold text-slate-400">Pág:</span>
                                            <input type="number" value={spoilerPage || ''} onChange={(e) => setSpoilerPage(Number(e.target.value))} className="w-12 bg-transparent text-[11px] font-black text-teal-600 outline-none" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </form>
                    </div>
                </div>

                {/* COLUMNA DERECHA: SIDEBAR */}
                <aside className="lg:col-span-4 space-y-6 overflow-y-auto no-scrollbar">
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-left">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-4 flex items-center gap-2"><Info size={14} className="text-teal-500" /> Sobre esta sala</h3>
                        <p className="text-slate-500 text-xs font-medium leading-relaxed">Debate abierto sobre <span className="font-bold text-teal-600">"{thread?.title}"</span>. Recuerda marcar tus spoilers si mencionas eventos avanzados.</p>
                    </div>

                    {/* LIBRO ACTUAL DINÁMICO */}
                    {thread?.relatedBook && (
                        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100">
                            <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 text-left">Libro vinculado</h3>
                            <div className="flex gap-4">
                                <img src={thread.relatedBook.urlPortada} className="w-16 h-24 object-cover rounded-xl shadow-md" alt="" />
                                <div className="flex-1 text-left py-1">
                                    <h4 className="font-black text-slate-900 text-sm uppercase leading-tight mb-1 truncate">{thread.relatedBook.title}</h4>
                                    <p className="text-[10px] text-slate-400 font-bold mb-4">ISBN: {thread.relatedBook.isbn}</p>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end text-[9px] font-black uppercase text-teal-600">
                                            <span>Progreso</span>
                                            <span>{progressPercentage}%</span>
                                        </div>
                                        <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                                            <div className="h-full bg-teal-500 rounded-full transition-all duration-1000" style={{ width: `${progressPercentage}%` }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PARTICIPANTES REALES ÚNICOS */}
                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-left">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6">Lectores activos</h3>
                        <div className="flex items-center gap-3">
                            <div className="flex -space-x-2">
                                {Array.from(new Map(posts.map(post => [post.author.id, post.author])).values())
                                    .slice(0, 5)
                                    .map((uniqueAuthor, i) => (
                                        <img
                                            key={i}
                                            className="w-8 h-8 rounded-full border-2 border-white shadow-sm object-cover bg-slate-200 relative z-10 hover:z-20 transition-all hover:scale-110"
                                            src={uniqueAuthor.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${uniqueAuthor.id}`}
                                            alt={uniqueAuthor.fullName}
                                            title={uniqueAuthor.fullName}
                                        />
                                    ))
                                }
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase ml-2">
                                {(() => {
                                    const uniqueUsersCount = new Set(posts.map(p => p.author.id)).size;
                                    if (uniqueUsersCount === 0) return 'Esperando mensajes';
                                    if (uniqueUsersCount <= 5) return `${uniqueUsersCount} activos`;
                                    return `+${uniqueUsersCount - 5} activos`;
                                })()}
                            </span>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 text-left">
                        <h3 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.2em] mb-6 flex items-center gap-2"><Lock size={14} className="text-teal-500" /> Reglas</h3>
                        <ul className="space-y-4">
                            {['Respeta a los demás', 'Usa etiquetas de spoiler', 'Disfruta la lectura'].map((rule, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <CheckCircle2 size={16} className="text-teal-500 shrink-0 mt-0.5" />
                                    <span className="text-[11px] font-bold text-slate-600">{rule}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </aside>
            </main>
        </div>
    );
};