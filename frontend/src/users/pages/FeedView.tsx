import { useState, useEffect, useRef } from 'react';
import { activityService, Activity, Comment } from '../services/activity.service';
import { bookService } from '../../books/services/book.service';
import {
    Loader2, RefreshCw,
    Image as ImageIcon, Book as BookIcon, BarChart2,
    X, MessageCircle, Send
} from 'lucide-react';
import { ActivityCard } from '../components/ActivityCard';
import { useAuth } from '../../context/AuthContext';

export const FeedView = () => {
    const { user } = useAuth();
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    const [postText, setPostText] = useState('');
    const [isPublishing, setIsPublishing] = useState(false);
    const [showPoll, setShowPoll] = useState(false);
    const [pollOptions, setPollOptions] = useState(['', '']);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [showBookPicker, setShowBookPicker] = useState(false);
    const [myBooks, setMyBooks] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const data = await activityService.getFeed();
            setActivities(data);
        } catch (err) {
            console.error("Error al cargar el feed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
        bookService.getMyBooks().then(setMyBooks).catch(() => { });
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setImagePreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handlePublish = async () => {
        if (!postText.trim() && !imagePreview && !selectedBook) return;
        setIsPublishing(true);

        const payload: any = { content: postText };
        if (imagePreview) payload.imageUrl = imagePreview;
        if (selectedBook?.id) payload.bookId = Number(selectedBook.id);

        try {
            const newActivity = await activityService.createActivity(payload);

            if (selectedBook) {
                const extractedAuthor = selectedBook.author || selectedBook.authors;

                newActivity.targetBook = {
                    id: selectedBook.id,
                    title: selectedBook.title,
                    urlPortada: selectedBook.urlPortada,
                    author: Array.isArray(extractedAuthor)
                        ? extractedAuthor.join(', ')
                        : (extractedAuthor || 'Autor desconocido')
                };
            }

            setActivities([newActivity, ...activities]);

            setPostText('');
            setImagePreview(null);
            setSelectedBook(null);
            setShowPoll(false);
            setPollOptions(['', '']);
        } catch {
            alert("Error al publicar.");
        } finally {
            setIsPublishing(false);
        }
    };

    const handleToggleLike = async (activityId: string) => {
        setActivities(current => current.map(act => {
            if (act.id === activityId) {
                const isAdding = !act.isLiked;
                return {
                    ...act,
                    isLiked: isAdding,
                    likesCount: isAdding ? (act.likesCount || 0) + 1 : Math.max(0, (act.likesCount || 0) - 1)
                };
            }
            return act;
        }));
        try { await activityService.toggleLike(activityId); } catch (e) { console.log(e); }
    };

    const handleIgnoreActivity = async (activityId: string) => {
        setActivities(current => current.filter(act => act.id !== activityId));
        try { await activityService.ignoreActivity(activityId); } catch (e) { console.log(e); }
    };

    const handleCommentAdded = (activityId: string, newComment: Comment) => {
        setActivities(current => current.map(act => {
            if (act.id === activityId) {
                return {
                    ...act,
                    commentsCount: (act.commentsCount || 0) + 1,
                    comments: [...(act.comments || []), newComment]
                };
            }
            return act;
        }));
    };

    const handleUpdateActivity = (id: string, updatedActivity: Activity) => {
        setActivities(current => current.map(act =>
            act.id === id ? { ...act, ...updatedActivity } : act
        ));
    };

    const handleDeleteActivity = async (id: string) => {
        try {
            await activityService.deleteActivity(id);
            setActivities(current => current.filter(act => act.id !== id));
        } catch (err) {
            console.error(err);
            alert("No se pudo eliminar la publicación.");
        }
    };

    if (loading && activities.length === 0) return (
        <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-24 text-left animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                <div className="lg:col-span-8 space-y-6">
                    <header className="flex items-center justify-between mb-2">
                        <div>
                            <h1 className="text-3xl font-black tracking-tighter text-slate-900 italic uppercase">
                                THE <span className="text-teal-600 font-serif">FEED</span>
                            </h1>
                            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">Actividad de tu círculo literario</p>
                        </div>
                        <button onClick={fetchFeed} className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm">
                            <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        </button>
                    </header>

                    <div className="bg-white rounded-3xl p-4 shadow-sm border border-slate-100 space-y-3 transition-all">
                        <div className="flex gap-3">
                            <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-10 h-10 rounded-full border border-slate-50 shadow-sm shrink-0 object-cover" alt="Avatar" />
                            <div className="flex-1">
                                <textarea
                                    value={postText}
                                    onChange={(e) => setPostText(e.target.value)}
                                    placeholder="¿Qué tienes en mente hoy?"
                                    className="w-full bg-transparent border-none text-base font-medium outline-none focus:ring-0 resize-none min-h-[40px] placeholder:text-slate-300 py-2"
                                />

                                <div className="space-y-2">
                                    {imagePreview && (
                                        <div className="relative inline-block mt-2">
                                            <img src={imagePreview} className="max-h-48 rounded-xl border border-slate-100 shadow-sm" alt="Preview" />
                                            <button onClick={() => setImagePreview(null)} className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1 hover:bg-rose-500 transition-all">
                                                <X size={12} />
                                            </button>
                                        </div>
                                    )}
                                    {selectedBook && (
                                        <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 w-fit animate-in zoom-in-95">
                                            <img src={selectedBook.urlPortada} className="w-6 h-9 object-cover rounded shadow-xs" alt="" />
                                            <div className="text-left pr-2">
                                                <p className="text-[9px] font-black text-slate-800 uppercase leading-none">{selectedBook.title}</p>
                                                <p className="text-[8px] text-slate-400 uppercase mt-0.5">{selectedBook.author}</p>
                                            </div>
                                            <button onClick={() => setSelectedBook(null)} className="text-slate-300 hover:text-rose-500">
                                                <X size={14} />
                                            </button>
                                        </div>
                                    )}
                                    {showPoll && (
                                        <div className="space-y-1.5 bg-teal-50/30 p-3 rounded-xl border border-teal-100/50 mt-2">
                                            {pollOptions.map((opt, idx) => (
                                                <input key={idx} value={opt} onChange={(e) => { const newOpts = [...pollOptions]; newOpts[idx] = e.target.value; setPollOptions(newOpts); }} placeholder={`Opción ${idx + 1}`} className="w-full bg-white border border-teal-100 rounded-lg px-3 py-1.5 text-xs outline-none" />
                                            ))}
                                            <div className="flex justify-between items-center pt-1">
                                                {pollOptions.length < 4 ? (
                                                    <button onClick={() => setPollOptions([...pollOptions, ''])} className="text-[8px] font-black text-teal-600 uppercase hover:underline">+ Opción</button>
                                                ) : <div />}
                                                <button onClick={() => setShowPoll(false)} className="text-[8px] font-black text-rose-400 uppercase hover:underline">Quitar encuesta</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex gap-1 sm:gap-2">
                                <button onClick={() => fileInputRef.current?.click()} className="p-2 hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-lg transition-all flex items-center gap-1.5">
                                    <ImageIcon size={16} className="text-emerald-400" />
                                    <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Foto</span>
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                                <button onClick={() => setShowBookPicker(!showBookPicker)} className="p-2 hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-lg transition-all flex items-center gap-1.5">
                                    <BookIcon size={16} className="text-blue-400" />
                                    <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Libro</span>
                                </button>

                                <button onClick={() => setShowPoll(true)} className="p-2 hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-lg transition-all flex items-center gap-1.5">
                                    <BarChart2 size={16} className="text-amber-400" />
                                    <span className="text-[9px] font-black uppercase tracking-wider hidden sm:inline">Encuesta</span>
                                </button>
                            </div>

                            <button
                                onClick={handlePublish}
                                disabled={isPublishing || (!postText.trim() && !imagePreview && !selectedBook)}
                                className="px-5 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-[0.1em] hover:bg-teal-600 transition-all flex items-center gap-2 disabled:opacity-30"
                            >
                                {isPublishing ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                                Publicar
                            </button>
                        </div>

                        {/* SELECTOR LIBROS */}
                        {showBookPicker && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-xl border border-slate-100 max-h-40 overflow-y-auto custom-scrollbar">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                    {myBooks.map(book => (
                                        <button key={book.id} onClick={() => { setSelectedBook(book); setShowBookPicker(false); }} className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-transparent hover:border-teal-500 text-left">
                                            <img src={book.urlPortada} className="w-5 h-7 object-cover rounded shadow-xs" alt="" />
                                            <span className="text-[9px] font-bold truncate uppercase text-slate-700">{book.title}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {activities.map((activity) => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onLike={handleToggleLike}
                                onIgnore={handleIgnoreActivity}
                                onComment={handleCommentAdded}
                                onUpdate={handleUpdateActivity}
                                onDelete={handleDeleteActivity}
                            />
                        ))}
                    </div>
                </div>

                <aside className="lg:col-span-4 space-y-8 hidden lg:block">
                    <section className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100 text-left">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-slate-400 mb-6">Tendencias</h3>
                        <div className="space-y-5">
                            {[1, 2, 3].map((_, i) => (
                                <div key={i} className="flex gap-3 items-center group cursor-pointer">
                                    <div className="w-8 h-12 bg-slate-100 rounded shadow-sm overflow-hidden group-hover:scale-105 transition-all">
                                        <img src={`https://picsum.photos/seed/book${i}/150/200`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-[10px] font-black text-slate-800 truncate uppercase">Libro Top {i + 1}</p>
                                        <div className="flex items-center gap-1 mt-1">
                                            <MessageCircle size={10} className="text-teal-500" />
                                            <span className="text-[8px] font-black text-teal-600 uppercase">Destacado</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                </aside>
            </div>
        </div>
    );
};