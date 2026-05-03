import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { bookService } from '../../books/services/book.service';
import { UserCard } from '../components/UserCard';
import {
    Search, Loader2, Bookmark, MapPin, Store, X,
    ShoppingBag, CheckCircle2,
    Clock, ChevronRight, Leaf, Tag, HandHelping, Check,
    Flame, LayoutGrid, MessageCircle
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { JoinEventModal } from './JoinEventModal';
import { clubsService, Club } from '../../club/service/club.service';

const FALLBACK_EVENT_IMAGE = "https://images.unsplash.com/photo-1512820663732-2d1410f44bb1?q=80&w=600";

const FeedbackModal = ({ isOpen, onClose, type }: any) => {
    if (!isOpen) return null;
    const isSuccess = type === 'success';
    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl border-4 border-white text-center animate-in zoom-in-95">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isSuccess ? <Check size={32} strokeWidth={3} /> : <X size={32} strokeWidth={3} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">
                    {isSuccess ? '¡Enviado!' : 'Cancelado'}
                </h3>
                <p className="text-slate-500 text-xs font-medium italic mb-6">
                    {isSuccess ? 'Tu petición ya está en el buzón del dueño.' : 'Has retirado la solicitud de este libro.'}
                </p>
                <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-600 transition-all">Cerrar</button>
            </div>
        </div>
    );
};

const AvailabilityModal = ({ isOpen, onClose, stores, listings, bookTitle, onRequest, myRequests }: any) => {
    if (!isOpen) return null;
    const badgeConfig: any = {
        sale: { color: 'bg-emerald-500 text-white', icon: Tag, label: 'Venta' },
        loan: { color: 'bg-blue-600 text-white', icon: HandHelping, label: 'Préstamo' }
    };
    const conditionStyles: any = {
        new: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        like_new: 'bg-teal-50 text-teal-700 border-teal-200',
        good: 'bg-sky-50 text-sky-700 border-sky-200',
        worn: 'bg-orange-50 text-orange-700 border-orange-200'
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 text-left">
            <div className="bg-[#F0F9F9] rounded-[3.5rem] w-full max-w-lg overflow-hidden shadow-2xl border-[12px] border-white animate-in zoom-in-95 flex flex-col max-h-[90vh]">
                <header className="p-8 bg-white border-b border-slate-100 flex justify-between items-center shrink-0">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">{bookTitle}</h3>
                        <p className="text-[10px] text-teal-600 font-black uppercase tracking-[0.2em] mt-1">Opciones de adquisición</p>
                    </div>
                    <button onClick={onClose} className="p-2 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors text-slate-400">
                        <X size={20} />
                    </button>
                </header>
                <div className="p-6 overflow-y-auto custom-scrollbar space-y-8">
                    <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                            <Leaf size={14} className="text-teal-500" /> Comunidad Rincón Circular
                        </h4>
                        <div className="space-y-4">
                            {listings && listings.length > 0 ? (
                                listings.map((item: any) => {
                                    const Config = badgeConfig[item.type];
                                    const isRequested = myRequests.includes(item.id);
                                    return (
                                        <div key={item.id} className="bg-white p-5 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col gap-4 group hover:shadow-md transition-all">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3 text-left">
                                                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-teal-50 shadow-sm shrink-0">
                                                        <img src={item.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user.email}`} alt="" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-black text-slate-900 uppercase leading-none mb-1">@{item.user.fullName.split(' ')[0]}</p>
                                                        <span className={`px-2 py-0.5 rounded-lg border text-[8px] font-black uppercase inline-block ${conditionStyles[item.condition] || 'bg-slate-50'}`}>
                                                            {item.condition === 'good' ? '👍 Buen Estado' : item.condition.toUpperCase().replace('_', ' ')}
                                                        </span>
                                                    </div>
                                                </div>
                                                <button onClick={() => onRequest(item.id, isRequested)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isRequested ? 'bg-amber-500 text-white hover:bg-amber-600 ring-4 ring-amber-500/10' : 'bg-slate-900 text-white hover:bg-teal-600'}`}>
                                                    {isRequested ? 'Solicitado' : 'Solicitar'}
                                                </button>
                                            </div>
                                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm ${Config.color}`}>
                                                    <Config.icon size={12} strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase">{item.type === 'sale' ? `${item.price}€` : Config.label}</span>
                                                </div>
                                                {item.type === 'loan' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-black">
                                                        <Clock size={12} strokeWidth={3} />
                                                        <span className="text-[10px] uppercase tracking-tight">Tiempo: {item.maxLoanDays} días</span>
                                                    </div>
                                                )}
                                                {item.description && <p className="text-[10px] text-slate-400 font-medium italic truncate max-w-[150px] ml-2">"{item.description}"</p>}
                                            </div>
                                        </div>
                                    );
                                })
                            ) : (
                                <div className="p-8 text-center bg-white/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em] leading-loose">Ningún lector ofrece este ejemplar ahora mismo.</p>
                                </div>
                            )}
                        </div>
                    </section>
                    <section>
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 ml-2 flex items-center gap-2">
                            <Store size={14} className="text-teal-500" /> Stock en librerías
                        </h4>
                        <div className="space-y-3">
                            {stores && stores.length > 0 ? (
                                stores.map((item: any) => (
                                    <div key={item.inventoryId} className="bg-slate-50/50 p-4 rounded-[2rem] flex justify-between items-center border border-slate-100/50">
                                        <div className="text-left flex-1 min-w-0 px-2">
                                            <p className="font-black text-slate-700 text-[11px] uppercase tracking-tight truncate">{item.store.libraryName}</p>
                                            <p className="text-[9px] text-slate-400 flex items-center gap-1 truncate"><MapPin size={10} /> {item.store.libraryAddress}</p>
                                        </div>
                                        <div className="text-right pl-4 border-l border-slate-200 ml-4 shrink-0">
                                            <p className="text-base font-black text-teal-600 tracking-tighter">{Number(item.price).toFixed(2)}€</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="p-8 text-center bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">No disponible en tiendas físicas.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </div>
                <footer className="p-6 bg-white shrink-0 border-t border-slate-50">
                    <button onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-lg hover:bg-teal-600 transition-all active:scale-95">Cerrar buscador</button>
                </footer>
            </div>
        </div>
    );
};

export const ExploreView = () => {
    const { user: currentUser } = useAuth();
    const navigate = useNavigate();

    const [users, setUsers] = useState<any[]>([]);
    const [bookResults, setBookResults] = useState<any[]>([]);
    const [featuredBook, setFeaturedBook] = useState<any | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [myClubs, setMyClubs] = useState<Club[]>([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [myBookKeys, setMyBookKeys] = useState<string[]>([]);
    const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
    const [availableStores, setAvailableStores] = useState([]);
    const [availableListings, setAvailableListings] = useState([]);
    const [selectedBookForStores, setSelectedBookForStores] = useState<string>('');
    const [mySentRequestIds, setMySentRequestIds] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ isOpen: boolean, type: 'success' | 'cancel' }>({ isOpen: false, type: 'success' });

    const handleStartChat = async (targetUserId: string) => {
        try {
            const { data } = await api.post(`/chat/conversation/${targetUserId}`);
            if (data) {
                navigate('/chat');
            }
        } catch (error: any) {
            if (error.response?.status === 403) {
                alert("No puedes iniciar un chat con este usuario (posiblemente no os seguís).");
            } else {
                alert("Error al iniciar chat.");
            }
        }
    };

    const loadExploreData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [usersRes, booksRes, myBooksRes, eventsRes, reqRes, clubsRes] = await Promise.allSettled([
                api.get('/users'),
                api.get('/books'),
                bookService.getMyBooks(),
                api.get('/librero/events/all'),
                api.get('/sustainability/requests/me'),
                clubsService.getClubs()
            ]);

            if (usersRes.status === 'fulfilled') {
                const lectores = usersRes.value.data
                    .filter((u: any) => u.id !== currentUser.id && u.role === 'user')
                    .map((u: any) => {
                        const myRel = u.followerRelations?.find((f: any) =>
                            (f.followerId === currentUser.id || f.follower?.id === currentUser.id)
                        );
                        const iFollowThem = myRel?.status === 'accepted';
                        const theyFollowMe = u.followingRelations?.some((f: any) =>
                            (f.followingId === currentUser.id || f.following?.id === currentUser.id) && f.status === 'accepted'
                        );

                        return { ...u, followStatus: myRel ? myRel.status : null, isReciprocal: iFollowThem && theyFollowMe };
                    });
                setUsers(lectores);
            }
            if (booksRes.status === 'fulfilled' && booksRes.value.data.length > 0) {
                const found = booksRes.value.data.find((b: any) => b.title.toLowerCase().includes("viento"));
                setFeaturedBook(found || booksRes.value.data[0]);
            }
            if (myBooksRes.status === 'fulfilled') setMyBookKeys(myBooksRes.value.map(b => `${b.title}-${b.author}`.toLowerCase()));
            if (eventsRes.status === 'fulfilled') setEvents(eventsRes.value.data);
            if (reqRes.status === 'fulfilled') {
                const sent = reqRes.value.data.filter((r: any) => !r.isOwner && r.status === 'pending');
                setMySentRequestIds(sent.map((r: any) => r.listing.id));
            }
            if (clubsRes.status === 'fulfilled') {
                const allClubs = clubsRes.value;
                const userClubs = allClubs.filter(c => c.creator?.id === currentUser.id || c.members?.some(m => m.id === currentUser.id));
                setMyClubs(userClubs.length > 0 ? userClubs.slice(0, 3) : []);
            }
        } finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => { loadExploreData(); }, [loadExploreData]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 2) {
                try {
                    const res = await api.get(`/books/search?query=${searchTerm}`);
                    const groupedBooks = new Map();
                    res.data.forEach((book: any) => {
                        const key = `${book.title}-${book.author}`.toLowerCase().trim();
                        if (!groupedBooks.has(key)) groupedBooks.set(key, book);
                    });
                    setBookResults(Array.from(groupedBooks.values()));
                } catch (e) { console.error(e); } 
            } else { setBookResults([]); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const checkAvailability = async (book: any) => {
        try {
            const [storesRes, listingsRes] = await Promise.all([
                api.get(`/librero/find-stores/${book.id}`),
                api.get(`/sustainability/listings/book/${book.id}`)
            ]);
            setAvailableStores(storesRes.data);
            setAvailableListings(listingsRes.data.filter((l: any) => l.user.id !== currentUser?.id));
            setSelectedBookForStores(book.title);
            setIsAvailabilityOpen(true);
        } catch { console.error("Error disponibilidad"); }
    };

    const handleToggleRequest = async (listingId: string, isRequested: boolean) => {
        try {
            if (isRequested) {
                await api.delete(`/sustainability/requests/cancel/${listingId}`);
                setMySentRequestIds(prev => prev.filter(id => id !== listingId));
                setFeedback({ isOpen: true, type: 'cancel' });
            } else {
                await api.post('/sustainability/requests', { listingId });
                setMySentRequestIds(prev => [...prev, listingId]);
                setFeedback({ isOpen: true, type: 'success' });
            }
        } catch (e: any) { console.error("Error en toggle request", e); }
    };

    const isAlreadyInLibrary = (book: any) => myBookKeys.includes(`${book.title}-${book.author}`.toLowerCase());

    const handleAddToMyLibrary = async (book: any) => {
        if (!book || isAlreadyInLibrary(book)) return;
        setIsAdding(true);
        try {
            await bookService.create({
                title: book.title, author: book.author, status: 'Want to Read',
                urlPortada: book.urlPortada, genre: book.genre, description: book.description, pageCount: book.pageCount
            });
            setMyBookKeys(prev => [...prev, `${book.title}-${book.author}`.toLowerCase()]);
        } finally { setIsAdding(false); }
    };

    if (loading) return <div className="flex h-screen items-center justify-center bg-[#F8FAFB]"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20 animate-in fade-in duration-500 text-left">
            <div className="relative z-10 px-8 py-4">
                <div className="max-w-[1400px] mx-auto flex justify-between items-center gap-8">
                    <div className="relative flex-1 max-w-2xl">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        <input
                            type="text"
                            placeholder="Busca libros, autores, usuarios o clubes..."
                            className="w-full bg-slate-100 border-none rounded-xl py-3 pl-12 pr-4 text-sm focus:ring-2 focus:ring-teal-500/20 outline-none transition-all"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <div className="max-w-[1400px] mx-auto px-8 pt-8 flex flex-col lg:flex-row gap-8">
                <div className="flex-1 space-y-10 min-w-0">
                    {!searchTerm && (
                        <header className="text-left">
                            <h1 className="text-3xl font-black text-slate-900 tracking-tight">¡Hola, {currentUser?.fullName?.split(' ')[0]}! 👋</h1>
                            <p className="text-slate-500 text-sm mt-1 font-medium">Explora, conecta y comparte tu pasión por la lectura.</p>
                        </header>
                    )}

                    {searchTerm && bookResults.length > 0 && (
                        <section className="animate-in fade-in duration-500">
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2 tracking-tight text-left"><Search size={20} className="text-teal-600" /> Resultados del Catálogo</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {bookResults.map((book) => (
                                    <div key={book.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all group">
                                        <div className="w-16 h-24 rounded-xl overflow-hidden shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-500 border border-slate-50"><img src={book.urlPortada} className="w-full h-full object-cover" alt="" /></div>
                                        <div className="flex-1 min-w-0 text-left">
                                            <p className="font-black text-slate-800 text-sm uppercase truncate mb-0.5">{book.title}</p>
                                            <p className="text-[10px] text-slate-400 font-bold uppercase mb-4 truncate">{book.author}</p>
                                            <button onClick={() => checkAvailability(book)} className="px-4 py-2 bg-teal-50 text-teal-600 rounded-xl font-black text-[9px] uppercase border border-teal-100 hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95">Ver disponibilidad</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {!searchTerm && featuredBook && (
                        <section className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100 flex flex-col md:flex-row gap-8 items-center md:items-start group hover:shadow-md transition-all">
                            <div className="relative w-48 h-72 md:w-56 md:h-80 shrink-0"><img src={featuredBook.urlPortada} className="w-full h-full object-cover rounded-2xl shadow-xl group-hover:scale-105 transition-transform duration-700" alt="" /></div>
                            <div className="text-left flex-1 flex flex-col justify-center h-full pt-2">
                                <div className="flex gap-2 mb-4">
                                    <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm">Recomendado</span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase tracking-widest">{featuredBook.genre || "Fantasía"}</span>
                                </div>
                                <h2 className="text-4xl lg:text-5xl font-black text-slate-900 mb-2 leading-none tracking-tight">{featuredBook.title}</h2>
                                <p className="text-slate-500 font-bold mb-6 italic text-sm">por {featuredBook.author}</p>
                                <p className="text-slate-600 text-sm leading-relaxed mb-8 line-clamp-3">{featuredBook.description || "La historia de un músico legendario que busca respuestas sobre su pasado..."}</p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button onClick={() => checkAvailability(featuredBook)} className="px-6 py-3.5 bg-teal-600 text-white rounded-2xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-teal-700 transition-all shadow-lg active:scale-95"><ShoppingBag size={18} /> Ver disponibilidad</button>
                                    <button onClick={() => handleAddToMyLibrary(featuredBook)} disabled={isAdding || isAlreadyInLibrary(featuredBook)} className={`px-6 py-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${isAlreadyInLibrary(featuredBook) ? 'bg-slate-100 text-slate-400 border border-slate-200' : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm'}`}>{isAdding ? <Loader2 className="animate-spin" size={18} /> : isAlreadyInLibrary(featuredBook) ? <><CheckCircle2 size={18} /> En tu biblioteca</> : <><Bookmark size={18} /> Guardar en biblioteca</>}</button>
                                </div>
                            </div>
                        </section>
                    )}

                    <section>
                        <div className="flex justify-between items-end mb-6 text-left">
                            <h3 className="text-xl font-black flex items-center gap-2 tracking-tight text-slate-900"><LayoutGrid size={20} className="text-slate-400" /> Explorar comunidad</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {users.filter(u => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => (
                                <div key={u.id} className="relative group">
                                    <UserCard user={u} />
                                    {u.isReciprocal && (
                                        <div className="absolute bottom-6 right-6 z-20">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleStartChat(u.id);
                                                }}
                                                className="p-3 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-teal-100"
                                                title="Enviar mensaje"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </section>

                    {!searchTerm && events.length > 0 && (
                        <section>
                            <div className="flex justify-between items-end mb-6 text-left mt-10">
                                <h3 className="text-xl font-black flex items-center gap-2 tracking-tight text-slate-900"><Clock size={20} className="text-slate-400" /> Eventos próximos</h3>
                                <button onClick={() => navigate('/events')} className="text-[11px] font-bold text-teal-600 hover:underline flex items-center gap-1">Ver agenda <ChevronRight size={14} /></button>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {events.slice(0, 2).map((event) => (
                                    <div key={event.id} onClick={() => setSelectedEvent(event)} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 flex flex-col sm:flex-row items-center gap-6 cursor-pointer hover:shadow-md hover:border-teal-100 transition-all group">
                                        <div className="w-full sm:w-40 h-40 sm:h-28 rounded-[1.5rem] overflow-hidden shrink-0">
                                            <img 
                                                src={event.imageUrl && event.imageUrl.trim().length > 0 
                                                    ? event.imageUrl 
                                                    : `https://picsum.photos/seed/${event.id}/600/400`
                                                } 
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" 
                                                alt={event.title}
                                                onError={(e: any) => { e.target.src = FALLBACK_EVENT_IMAGE }} 
                                            />
                                        </div>
                                        <div className="flex-1 text-left w-full py-2">
                                            <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                                <span className="text-[10px] font-black text-teal-600 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100/50">{new Date(event.eventDate).toLocaleDateString([], { day: '2-digit', month: 'short' }).toUpperCase()}</span>
                                                <h4 className="font-black text-slate-900 text-base leading-tight line-clamp-1 group-hover:text-teal-600 transition-colors uppercase tracking-tight">{event.title}</h4>
                                            </div>
                                            <p className="text-[11px] text-slate-500 mb-4 italic truncate">Organizado por {event.organizer?.libraryName || 'Búho Sabio'}</p>
                                            <div className="flex flex-wrap items-center justify-between gap-4">
                                                <div className="flex items-center gap-5 text-[11px] text-slate-500 font-bold uppercase tracking-widest">
                                                    <span className="flex items-center gap-1.5"><Clock size={12} className="text-teal-600" /> {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}h</span>
                                                    <span className="flex items-center gap-1.5 truncate max-w-[150px]"><MapPin size={12} className="text-rose-500" /> {event.organizer?.libraryAddress?.split(',')[0] || 'Local'}</span>
                                                </div>
                                                <button className="px-5 py-2.5 bg-slate-50 text-slate-600 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-colors">Ver Detalles</button>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}
                </div>

                <aside className="w-full lg:w-80 space-y-6 shrink-0 pb-10">
                    <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-left">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-black text-sm tracking-tight text-slate-900">Mi actividad</h4>
                            <button onClick={() => navigate('/myprofile')} className="text-[10px] font-bold text-teal-600 hover:underline flex items-center">Ver todo <ChevronRight size={12} /></button>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
                                <svg className="w-full h-full transform -rotate-90">
                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" className="text-slate-100" />
                                    <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="6" fill="transparent" strokeDasharray={175} strokeDashoffset={175 * 0.4} className="text-teal-500 transition-all duration-1000" />
                                </svg>
                                <span className="absolute font-black text-lg text-slate-800">3</span>
                            </div>
                            <div className="flex-1">
                                <p className="text-xs font-bold text-slate-900 mb-1">Libros leídos este mes</p>
                                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400"><span>de 5 objetivo</span><span className="text-teal-600">60%</span></div>
                            </div>
                        </div>
                        <div className="space-y-4 pt-4 border-t border-slate-50">
                            <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-2 text-slate-500 font-bold"><Clock size={14} className="text-slate-400" /> Reseñas escritas</span><span className="font-black text-slate-800">2</span></div>
                            <div className="flex justify-between items-center text-xs"><span className="flex items-center gap-2 text-slate-500 font-bold"><Flame size={14} className="text-orange-400" /> Días de racha</span><span className="font-black text-slate-800 flex items-center gap-1">7 <Flame size={12} className="text-orange-500 fill-orange-500" /></span></div>
                        </div>
                    </section>

                    <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 text-left">
                        <div className="flex justify-between items-center mb-6">
                            <h4 className="font-black text-sm tracking-tight text-slate-900">Tus Clubes</h4>
                            <button onClick={() => navigate('/clubs')} className="text-[10px] font-bold text-teal-600 hover:underline flex items-center">Explorar Clubes<ChevronRight size={12} /></button>
                        </div>
                        <div className="space-y-4">
                            {myClubs.length > 0 ? (
                                myClubs.map((club) => (
                                    <div key={club.id} onClick={() => navigate(`/clubs/${club.id}`)} className="flex items-center gap-4 group cursor-pointer p-2 hover:bg-slate-50 rounded-xl transition-colors -mx-2">
                                        <div className="w-12 h-12 rounded-[1rem] bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100/50">
                                            <LayoutGrid size={20} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight truncate group-hover:text-teal-600 transition-colors">{club.name}</p>
                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{club.members?.length || 0} miembros</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200">
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">No perteneces a ningún club aún.</p>
                                </div>
                            )}
                        </div>
                    </section>
                </aside>
            </div>

            <button onClick={() => navigate('/bookstore')} className="fixed bottom-8 right-8 w-14 h-14 bg-teal-600 text-white rounded-full shadow-[0_10px_25px_-5px_rgba(13,148,136,0.5)] flex items-center justify-center hover:bg-teal-700 hover:scale-110 transition-all z-[100] active:scale-95" title="Explorar Mapa">
                <MapPin size={24} strokeWidth={3} />
            </button>

            <AvailabilityModal isOpen={isAvailabilityOpen} onClose={() => setIsAvailabilityOpen(false)} stores={availableStores} listings={availableListings} bookTitle={selectedBookForStores} onRequest={handleToggleRequest} myRequests={mySentRequestIds} />
            <FeedbackModal isOpen={feedback.isOpen} onClose={() => setFeedback({ ...feedback, isOpen: false })} type={feedback.type} />
            <JoinEventModal isOpen={!!selectedEvent} event={selectedEvent} onClose={() => setSelectedEvent(null)} onStatusChange={loadExploreData} />
        </div>
    );
};