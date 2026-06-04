import { useState, useEffect, useRef } from 'react';
import { activityService, Activity, Comment } from '../services/activity.service';
import { bookService } from '../../books/services/book.service';
import {
    Loader2,
    RefreshCw,
    Image as ImageIcon,
    Book as BookIcon,
    BarChart2,
    X,
    Send,
    Flame,
    TrendingUp,
    BookOpen
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
    const [trendingBooks, setTrendingBooks] = useState<any[]>([]);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const data = await activityService.getFeed();
            setActivities(data);
        } catch (err) {
            console.error('Error al cargar el feed:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleVotePoll = async (activityId: string, optionIndex: number) => {
        try {
            const updatedActivity = await activityService.votePoll(activityId, optionIndex);
            setActivities(prev => prev.map(a => a.id === activityId ? updatedActivity : a));
        } catch (error: any) {

            if (error.response?.status === 403) {
                console.warn("Intento de voto duplicado bloqueado por el servidor.");
            } else {
                console.error("Error inesperado:", error);
            }
        }
    };

    useEffect(() => {
        fetchFeed();

        bookService.getMyBooks()
            .then(setMyBooks)
            .catch(() => { });

        const loadTrending = async () => {
            try {
                const books = await bookService.getMyBooks();

                const sorted = [...books]
                    .sort((a, b) => (b.rating || 0) - (a.rating || 0))
                    .slice(0, 4);

                setTrendingBooks(sorted);
            } catch {
                setTrendingBooks([]);
            }
        };

        loadTrending();
    }, []);

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];

        if (!file) return;

        const reader = new FileReader();

        reader.onloadend = () => {
            setImagePreview(reader.result as string);
        };

        reader.readAsDataURL(file);
    };

    const handlePublish = async () => {
        if (!postText.trim() && !imagePreview && !selectedBook && !showPoll) return;

        setIsPublishing(true);

        const payload: any = {
            content: postText
        };

        if (imagePreview) payload.imageUrl = imagePreview;

        if (selectedBook?.id) {
            payload.bookId = Number(selectedBook.id);
        }

        if (showPoll) {
            const validOptions = pollOptions.filter(
                o => o.trim() !== ''
            );

            if (validOptions.length >= 2) {
                payload.pollOptions = validOptions;
            }
        }

        try {
            const newActivity = await activityService.createActivity(payload);

            if (selectedBook) {
                const extractedAuthor =
                    selectedBook.author || selectedBook.authors;

                newActivity.targetBook = {
                    id: selectedBook.id,
                    title: selectedBook.title,
                    urlPortada: selectedBook.urlPortada,
                    author: Array.isArray(extractedAuthor)
                        ? extractedAuthor.join(', ')
                        : extractedAuthor || 'Autor desconocido'
                };
            }

            setActivities([newActivity, ...activities]);

            setPostText('');
            setImagePreview(null);
            setSelectedBook(null);
            setShowPoll(false);
            setPollOptions(['', '']);
        } catch {
            alert('Error al publicar.');
        } finally {
            setIsPublishing(false);
        }
    };

    const handleToggleLike = async (activityId: string) => {
        setActivities(current =>
            current.map(act => {
                if (act.id === activityId) {
                    const isAdding = !act.isLiked;

                    return {
                        ...act,
                        isLiked: isAdding,
                        likesCount: isAdding
                            ? (act.likesCount || 0) + 1
                            : Math.max(0, (act.likesCount || 0) - 1),
                        commentsCount: Number(act.commentsCount) || 0,
                        comments: act.comments || [],
                        poll: act.poll,
                    };
                }

                return act;
            })
        );

        try {
            await activityService.toggleLike(activityId);
        } catch (e) {
            console.log(e);
        }
    };

    const handleIgnoreActivity = async (activityId: string) => {
        setActivities(current =>
            current.filter(act => act.id !== activityId)
        );

        try {
            await activityService.ignoreActivity(activityId);
        } catch (e) {
            console.log(e);
        }
    };

    const handleCommentAdded = (
        activityId: string,
        newComment: Comment
    ) => {
        setActivities(current =>
            current.map(act => {
                if (act.id === activityId) {
                    return {
                        ...act,
                        commentsCount: (act.commentsCount || 0) + 1,
                        comments: [...(act.comments || []), newComment]
                    };
                }

                return act;
            })
        );
    };

    const handleUpdateActivity = (
        id: string,
        updatedActivity: Activity
    ) => {
        setActivities(current =>
            current.map(act =>
                act.id === id
                    ? { ...act, ...updatedActivity }
                    : act
            )
        );
    };

    const handleDeleteActivity = async (id: string) => {
        try {
            await activityService.deleteActivity(id);

            setActivities(current =>
                current.filter(act => act.id !== id)
            );
        } catch (err) {
            console.error(err);
            alert('No se pudo eliminar la publicación.');
        }
    };

    if (loading && activities.length === 0) {
        return (
            <div className="flex h-screen items-center justify-center bg-[#F8FAFB]">
                <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            </div>
        );
    }

    return (
        <div className="min-h-screen font-sans text-slate-900 pb-24 text-left animate-in fade-in duration-500">
            <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-8">
                <div className="lg:col-span-8 space-y-6">
                    <header className="flex items-center justify-between mb-4">
                        <div>
                            <p className="text-slate-400 text-[12px] font-bold uppercase tracking-[0.2em]">
                                Actividad de tu círculo literario
                            </p>
                        </div>

                        <button
                            onClick={fetchFeed}
                            className="p-2.5 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-teal-600 transition-all shadow-sm"
                        >
                            <RefreshCw
                                size={17}
                                className={loading ? 'animate-spin' : ''}
                            />
                        </button>
                    </header>

                    <div className="bg-white rounded-[2rem] p-5 shadow-lg shadow-slate-200/50 border border-slate-100 space-y-4">
                        <div className="flex gap-3">
                            <img
                                src={
                                    user?.avatarUrl ||
                                    `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`
                                }
                                className="w-10 h-10 rounded-full border border-slate-50 shadow-sm shrink-0 object-cover"
                                alt="Avatar"
                            />

                            <div className="flex-1">
                                <textarea
                                    value={postText}
                                    onChange={(e) =>
                                        setPostText(e.target.value)
                                    }
                                    placeholder="¿Qué tienes en mente?"
                                    className="w-full bg-transparent border-none text-base font-medium outline-none resize-none min-h-[40px] placeholder:text-slate-300 py-2"
                                />

                                {imagePreview && (
                                    <div className="relative inline-block mt-2">
                                        <img
                                            src={imagePreview}
                                            className="max-h-48 rounded-xl border border-slate-100 shadow-sm"
                                            alt=""
                                        />
                                        <button
                                            onClick={() =>
                                                setImagePreview(null)
                                            }
                                            className="absolute -top-2 -right-2 bg-slate-900 text-white rounded-full p-1"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                )}

                                {selectedBook && (
                                    <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-xl border border-slate-100 w-fit">
                                        <img
                                            src={selectedBook.urlPortada || undefined}
                                            className="w-6 h-9 object-cover rounded"
                                            alt=""
                                        />
                                        <div>
                                            <p className="text-[9px] font-black uppercase">
                                                {selectedBook.title}
                                            </p>
                                            <p className="text-[8px] text-slate-400">
                                                {selectedBook.author}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() =>
                                                setSelectedBook(null)
                                            }
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                )}

                                {showPoll && (
                                    <div className="space-y-2 bg-teal-50/30 p-3 rounded-xl border border-teal-100 mt-2">
                                        {pollOptions.map((opt, idx) => (
                                            <input
                                                key={idx}
                                                value={opt}
                                                onChange={(e) => {
                                                    const copy = [...pollOptions];
                                                    copy[idx] =
                                                        e.target.value;
                                                    setPollOptions(copy);
                                                }}
                                                placeholder={`Opción ${idx + 1}`}
                                                className="w-full bg-white border border-teal-100 rounded-lg px-3 py-2 text-xs"
                                            />
                                        ))}

                                        {pollOptions.length < 4 && (
                                            <button
                                                onClick={() =>
                                                    setPollOptions([
                                                        ...pollOptions,
                                                        ''
                                                    ])
                                                }
                                                className="text-[8px] font-black text-teal-600 uppercase"
                                            >
                                                + Opción
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                                {/* Botón Foto */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Subir foto" 
                                    className="p-3 bg-white hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 rounded-2xl border border-slate-100 transition-all shadow-sm"
                                >
                                    <ImageIcon size={13} />
                                </button>
                                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />

                                {/* Botón Libro */}
                                <button
                                    onClick={() => setShowBookPicker(!showBookPicker)}
                                    title="Vincular libro"
                                    className="p-3 bg-white hover:bg-blue-50 text-slate-400 hover:text-blue-600 rounded-2xl border border-slate-100 transition-all shadow-sm"
                                >
                                    <BookIcon size={13} />
                                </button>

                                {/* Botón Encuesta */}
                                <button
                                    onClick={() => setShowPoll(!showPoll)}
                                    title="Crear encuesta"
                                    className="p-3 bg-white hover:bg-amber-50 text-slate-400 hover:text-amber-600 rounded-2xl border border-slate-100 transition-all shadow-sm"
                                >
                                    <BarChart2 size={13} />
                                </button>
                            </div>

                            {/* Publicar */}
                            <div className="relative group">
                                <div className="absolute -top-10 right-0 bg-teal-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-xl">
                                    Publicar
                                </div>
                                <button
                                    onClick={handlePublish}
                                    disabled={isPublishing}
                                    className="px-5 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase hover:bg-teal-600 transition-all"
                                >
                                    {isPublishing ? <Loader2 className="animate-spin" size={12} /> : <Send size={12} />}
                                </button>
                            </div>
                        </div>

                        {showBookPicker && (
                            <div className="mt-2 p-3 bg-slate-50 rounded-xl border max-h-40 overflow-y-auto">
                                {myBooks.map(book => (
                                    <button
                                        key={book.id}
                                        onClick={() => {
                                            setSelectedBook(book);
                                            setShowBookPicker(false);
                                        }}
                                        className="flex items-center gap-2 p-2 w-full"
                                    >
                                        <img
                                            src={book.urlPortada || undefined}
                                            className="w-5 h-7 object-cover"
                                            alt=""
                                        />
                                        <span className="text-[9px] font-bold uppercase">
                                            {book.title}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="space-y-6">
                        {activities.map(activity => (
                            <ActivityCard
                                key={activity.id}
                                activity={activity}
                                onLike={handleToggleLike}
                                onIgnore={handleIgnoreActivity}
                                onComment={handleCommentAdded}
                                onUpdate={handleUpdateActivity}
                                onDelete={handleDeleteActivity}
                                onVote={(index) =>
                                    handleVotePoll(activity.id, index)
                                }
                            />
                        ))}
                    </div>
                </div>

                <aside className="lg:col-span-4 space-y-8 hidden lg:block">

                    <section className="bg-white rounded-[2rem] p-6 border border-slate-100 transition-all duration-300 shadow-xl shadow-emerald-200/30 hover:shadow-2xl hover:shadow-emerald-300/50 hover:-translate-y-2">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-600 mb-6 flex items-center gap-2">
                            <Flame size={12} />
                            Libros en tendencia
                        </h3>

                        <div className="space-y-6">
                            {trendingBooks.slice(0, 4).map((book: any) => (
                                <div
                                    key={book.id}
                                    className="flex gap-4 items-center group cursor-pointer"
                                >
                                    <img
                                        src={book.urlPortada || undefined}
                                        className="w-8 h-12 object-cover rounded"
                                        alt=""
                                    />

                                    <div>
                                        <p className="text-[11px] font-black uppercase text-slate-800">
                                            {book.title}
                                        </p>
                                        <p className="text-[9px] text-slate-400 font-bold">
                                            {book.author}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section className="bg-white rounded-[2rem] p-6 border border-slate-100 transition-all duration-300 shadow-xl shadow-emerald-200/30 hover:shadow-2xl hover:shadow-emerald-300/50 hover:-translate-y-2">
                        <h3 className="font-black text-[10px] uppercase tracking-[0.2em] text-amber-600 mb-6 flex items-center gap-2">
                            <TrendingUp size={12} /> Tu actividad
                        </h3>

                        <div className="space-y-4">
                            <div className="flex justify-between">
                                <span className="text-xs">Posts</span>
                                <span className="font-black">
                                    {activities.length}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-xs">Mis libros</span>
                                <span className="font-black">
                                    {myBooks.length}
                                </span>
                            </div>

                            <div className="flex justify-between">
                                <span className="text-xs">Tendencias</span>
                                <span className="font-black">
                                    {trendingBooks.length}
                                </span>
                            </div>

                            <div className="pt-3 border-t">
                                <div className="flex items-center gap-2 text-teal-600">
                                    <BookOpen size={14} />
                                    <span className="text-[10px] font-black uppercase">
                                        Sigue leyendo hoy
                                    </span>
                                </div>
                            </div>
                        </div>
                    </section>

                </aside>
            </div>
        </div>
    );
};