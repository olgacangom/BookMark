import { useEffect, useState, useRef, useCallback } from 'react'; 
import { useParams, useNavigate } from 'react-router-dom';
import { clubsService, Thread, ThreadPost } from '../../club/service/club.service';
import { bookService, Book } from '../../books/services/book.service';
import { Send, AlertCircle, Loader2, MessageSquare, Sparkles, ChevronLeft } from 'lucide-react';
import { ThreadPostItem } from '../../club/components/ThreadPostItem';
import { io, Socket } from 'socket.io-client';

export const ThreadView = () => {
    const { threadId } = useParams();
    const navigate = useNavigate();

    const [thread, setThread] = useState<Thread | null>(null);
    const [posts, setPosts] = useState<ThreadPost[]>([]);
    const [userBook, setUserBook] = useState<Book | null>(null);

    const [newPost, setNewPost] = useState('');
    const [spoilerPage, setSpoilerPage] = useState(0);
    const [loading, setLoading] = useState(true);

    const socketRef = useRef<Socket | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

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
                setPosts(prev => {
                    if (prev.find(p => p.id === newIncomingPost.id)) return prev;
                    return [...prev, newIncomingPost];
                });
                scrollToBottom();
            });

            return () => {
                socketRef.current?.disconnect();
            };
        }
    }, [threadId, loadData, scrollToBottom]); 

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPost.trim() || !threadId) return;

        try {
            const post = await clubsService.createPost(threadId, newPost, spoilerPage);
            const postWithFixedDate = {
                ...post,
                createdAt: post.createdAt || new Date().toISOString()
            };

            setPosts(prev => [...prev, postWithFixedDate]);
            setNewPost('');
            setSpoilerPage(0);
            scrollToBottom();
        } catch (e) {
            console.error("Error al enviar mensaje:", e);
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] items-center justify-center">
            <Loader2 className="animate-spin text-teal-600" size={40} />
        </div>
    );

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] bg-white rounded-[3rem] shadow-2xl border border-white overflow-hidden animate-in fade-in duration-500">
            <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-2 hover:bg-white rounded-2xl text-slate-400 hover:text-teal-600 transition-all shadow-sm group"
                        title="Volver al club"
                    >
                        <ChevronLeft size={24} className="group-active:scale-90 transition-transform" />
                    </button>
                    <div className="w-12 h-12 bg-teal-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
                        <MessageSquare size={24} />
                    </div>
                    <div>
                        <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight leading-none">
                            {thread?.title}
                        </h2>
                        <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">
                            {userBook ? `Tu progreso: Pág ${userBook.currentPage}` : 'Sala de discusión general'}
                        </p>
                    </div>
                </div>

                {thread?.relatedBook && (
                    <div className="hidden sm:block group relative">
                        <img
                            src={thread.relatedBook.urlPortada}
                            className="w-10 h-14 object-cover rounded-lg shadow-md border-2 border-white transform group-hover:rotate-3 transition-transform"
                            alt="Portada"
                        />
                    </div>
                )}
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-6 bg-slate-50/30">
                {posts.length > 0 ? (
                    posts.map(post => (
                        <ThreadPostItem
                            key={post.id}
                            post={post}
                            userCurrentPage={userBook?.currentPage || 0}
                        />
                    ))
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300">
                        <Sparkles size={40} className="mb-4 opacity-20" />
                        <p className="font-bold uppercase text-xs tracking-[0.2em]">Sé el primero en comentar</p>
                    </div>
                )}
                <div ref={scrollRef} />
            </div>

            <form onSubmit={handleSend} className="p-6 bg-white border-t border-slate-100">
                <div className="max-w-5xl mx-auto flex flex-col gap-4">
                    <div className="flex items-center gap-4">
                        <div className="flex-1 relative">
                            <input
                                type="text"
                                value={newPost}
                                onChange={(e) => setNewPost(e.target.value)}
                                placeholder="Escribe un mensaje en la sala..."
                                className="w-full bg-slate-100/50 border border-slate-200 rounded-[1.5rem] px-6 py-4 text-sm focus:bg-white focus:border-teal-500 outline-none transition-all font-medium"
                            />
                        </div>
                        <button
                            type="submit"
                            disabled={!newPost.trim()}
                            className="p-4 bg-teal-600 text-white rounded-2xl hover:bg-slate-900 transition-all active:scale-95 shadow-xl disabled:opacity-50"
                        >
                            <Send size={20} />
                        </button>
                    </div>

                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <div className="p-1.5 bg-amber-50 rounded-lg border border-amber-100">
                                <AlertCircle size={14} className="text-amber-500" />
                            </div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">¿Contiene Spoilers?</span>
                            <div className="flex items-center gap-2 bg-slate-100 rounded-xl px-3 py-1.5 border border-slate-200 shadow-inner">
                                <span className="text-[10px] font-bold text-slate-500">Pág:</span>
                                <input
                                    type="number"
                                    value={spoilerPage || ''}
                                    onChange={(e) => setSpoilerPage(Number(e.target.value))}
                                    className="w-14 bg-transparent text-xs font-black text-teal-600 outline-none"
                                    placeholder="0"
                                />
                            </div>
                        </div>
                        <p className="hidden md:block text-[9px] font-bold text-slate-300 uppercase italic">
                            Los mensajes marcados con una página superior a la del lector aparecerán desenfocados.
                        </p>
                    </div>
                </div>
            </form>
        </div>
    );
};