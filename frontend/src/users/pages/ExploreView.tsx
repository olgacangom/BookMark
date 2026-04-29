import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { bookService } from '../../books/services/book.service';
import { UserCard } from '../components/UserCard';
import {
    Search, Loader2, TrendingUp, Bookmark,
    MapPin, Store, X, ShoppingBag, Book as BookIcon,
    UserIcon, CheckCircle2, Clock, ChevronRight,
    Leaf, Tag, HandHelping, Check
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { JoinEventModal } from './JoinEventModal';

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

                    {/* SECCIÓN COMUNIDAD */}
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

                                                <button
                                                    onClick={() => onRequest(item.id, isRequested)}
                                                    className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 ${isRequested
                                                        ? 'bg-amber-500 text-white hover:bg-amber-600 ring-4 ring-amber-500/10'
                                                        : 'bg-slate-900 text-white hover:bg-teal-600'
                                                        }`}
                                                >
                                                    {isRequested ? 'Solicitado' : 'Solicitar'}
                                                </button>
                                            </div>

                                            {/* DETALLES DE OFERTA (PRECIO / TIPO / DÍAS) */}
                                            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-50">
                                                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl shadow-sm ${Config.color}`}>
                                                    <Config.icon size={12} strokeWidth={3} />
                                                    <span className="text-[10px] font-black uppercase">
                                                        {item.type === 'sale' ? `${item.price}€` : Config.label}
                                                    </span>
                                                </div>

                                                {item.type === 'loan' && (
                                                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 font-black">
                                                        <Clock size={12} strokeWidth={3} />
                                                        <span className="text-[10px] uppercase tracking-tight">Tiempo: {item.maxLoanDays} días</span>
                                                    </div>
                                                )}

                                                {item.description && (
                                                    <p className="text-[10px] text-slate-400 font-medium italic truncate max-w-[150px] ml-2">"{item.description}"</p>
                                                )}
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

                    {/* SECCIÓN LIBRERÍAS */}
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

// --- VISTA PRINCIPAL ---
export const ExploreView = () => {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState<any[]>([]);
    const [bookResults, setBookResults] = useState<any[]>([]);
    const [featuredBook, setFeaturedBook] = useState<any | null>(null);
    const [events, setEvents] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [myBookKeys, setMyBookKeys] = useState<string[]>([]);

    const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
    const [availableStores, setAvailableStores] = useState([]);
    const [availableListings, setAvailableListings] = useState([]);
    const [selectedBookForStores, setSelectedBookForStores] = useState<string>('');

    const [mySentRequestIds, setMySentRequestIds] = useState<string[]>([]);
    const [feedback, setFeedback] = useState<{ isOpen: boolean, type: 'success' | 'cancel' }>({ isOpen: false, type: 'success' });

    const loadExploreData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [usersRes, booksRes, myBooksRes, eventsRes, reqRes] = await Promise.allSettled([
                api.get('/users'),
                api.get('/books'),
                bookService.getMyBooks(),
                api.get('/librero/events/all'),
                api.get('/sustainability/requests/me')
            ]);

            if (usersRes.status === 'fulfilled') {
                const lectores = usersRes.value.data
                    .filter((u: any) => u.id !== currentUser.id && u.role === 'user')
                    .map((u: any) => {
                        const myRel = u.followerRelations?.find((f: any) =>
                            (f.followerId === currentUser.id || f.follower?.id === currentUser.id)
                        );
                        return { ...u, followStatus: myRel ? myRel.status : null };
                    });
                setUsers(lectores);
            }

            if (booksRes.status === 'fulfilled' && booksRes.value.data.length > 0) {
                const found = booksRes.value.data.find((b: any) => b.title.toLowerCase().includes("viento"));
                setFeaturedBook(found || booksRes.value.data[0]);
            }

            if (myBooksRes.status === 'fulfilled') {
                setMyBookKeys(myBooksRes.value.map(b => `${b.title}-${b.author}`.toLowerCase()));
            }

            if (eventsRes.status === 'fulfilled') {
                setEvents(eventsRes.value.data);
            }

            if (reqRes.status === 'fulfilled') {
                // Guardamos solo los IDs de los anuncios que el lector ha solicitado
                const sent = reqRes.value.data.filter((r: any) => !r.isOwner && r.status === 'pending');
                setMySentRequestIds(sent.map((r: any) => r.listing.id));
            }
        } finally { setLoading(false); }
    }, [currentUser]);

    useEffect(() => { loadExploreData(); }, [loadExploreData]);

    useEffect(() => {
        const delayDebounceFn = setTimeout(async () => {
            if (searchTerm.length > 2) {
                setIsSearching(true);
                try {
                    const res = await api.get(`/books/search?query=${searchTerm}`);
                    const groupedBooks = new Map();
                    res.data.forEach((book: any) => {
                        const key = `${book.title}-${book.author}`.toLowerCase().trim();
                        if (!groupedBooks.has(key)) groupedBooks.set(key, book);
                    });
                    setBookResults(Array.from(groupedBooks.values()));
                } catch (e) { console.error(e); } finally { setIsSearching(false); }
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
                // Si ya está solicitado, cancelamos (DELETE)
                await api.delete(`/sustainability/requests/cancel/${listingId}`);
                setMySentRequestIds(prev => prev.filter(id => id !== listingId));
                setFeedback({ isOpen: true, type: 'cancel' });
            } else {
                // Si no, solicitamos (POST)
                await api.post('/sustainability/requests', { listingId });
                setMySentRequestIds(prev => [...prev, listingId]);
                setFeedback({ isOpen: true, type: 'success' });
            }
        } catch (e: any) {
            console.error("Error en toggle request", e);
        }
    };

    const isAlreadyInLibrary = (book: any) => {
        return myBookKeys.includes(`${book.title}-${book.author}`.toLowerCase());
    };

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

    if (loading) return <div className="flex h-[80vh] items-center justify-center bg-[#F0F9F9]"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>;

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-32 text-left animate-in fade-in duration-500">
            {/* TENDENCIA */}
            {!searchTerm && featuredBook && (
                <section className="max-w-7xl mx-auto px-6 pt-8 animate-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest">Tendencia actual</h2>
                    </div>
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white overflow-hidden p-8 md:p-12 flex flex-col md:flex-row gap-12 group">
                        <div className="relative aspect-[3/4] w-full max-w-[240px] rounded-2xl overflow-hidden shadow-2xl shrink-0 mx-auto md:mx-0">
                            <img src={featuredBook.urlPortada} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                        </div>
                        <div className="flex flex-col justify-center text-left">
                            <div className="flex gap-2 mb-4">
                                <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-[10px] font-black uppercase shadow-sm">Recomendado</span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">{featuredBook.genre}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 leading-none uppercase tracking-tighter italic">{featuredBook.title}</h1>
                            <p className="text-lg text-slate-400 font-medium mb-8 italic">por {featuredBook.author}</p>
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => checkAvailability(featuredBook)} className="flex-1 px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg flex items-center justify-center gap-2 active:scale-95">
                                    <ShoppingBag size={18} /> Ver disponibilidad
                                </button>
                                <button onClick={() => handleAddToMyLibrary(featuredBook)} disabled={isAdding || isAlreadyInLibrary(featuredBook)} className={`flex-1 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg active:scale-95 ${isAlreadyInLibrary(featuredBook) ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                                    {isAdding ? <Loader2 className="animate-spin" size={18} /> : isAlreadyInLibrary(featuredBook) ? <><CheckCircle2 size={18} /> En tu biblioteca</> : <><Bookmark size={18} /> Mi Biblioteca</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* EVENTOS */}
            {!searchTerm && events.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200">
                    <div className="flex items-end justify-between mb-8 px-2">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Eventos Próximos</h3>
                            <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-2">Quedadas presenciales en librerías</p>
                        </div>
                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-teal-600 transition-colors">Ver Agenda →</button>
                    </div>
                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6">
                        {events.map((event) => (
                            <div key={event.id} onClick={() => setSelectedEvent(event)} className="min-w-[280px] md:min-w-[340px] bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group cursor-pointer flex flex-col">
                                <div className="flex items-center gap-2 mb-4 text-left">
                                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors"><Store size={14} /></div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{event.organizer?.libraryName}</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 uppercase leading-tight mb-4 group-hover:text-teal-600 transition-colors line-clamp-2 min-h-[3rem] text-left">{event.title}</h4>
                                <div className="space-y-3 mt-auto pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-teal-500" size={14} />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                                            {new Date(event.eventDate).toLocaleDateString([], { day: '2-digit', month: 'long' })}
                                        </span>
                                    </div>
                                    <button className="w-full mt-2 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center gap-2">
                                        Más Información <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* BUSCADOR */}
            <header className="max-w-7xl mx-auto px-6 mt-16 mb-8 text-left">
                <h2 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Explorar</h2>
                <div className="relative w-full md:max-w-md group mt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-teal-500 transition-colors" />
                    <input type="text" placeholder="Busca por título o usuario..." className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold focus:ring-8 focus:ring-teal-500/5 outline-none shadow-sm transition-all" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-teal-600" />}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 space-y-16">
                {bookResults.length > 0 && (
                    <section className="animate-in fade-in duration-500">
                        <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2"><BookIcon size={14} /> Catálogo de Libros</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookResults.map((book) => (
                                <div key={book.id} className="bg-white p-4 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-all group">
                                    <div className="w-16 h-24 rounded-xl overflow-hidden shadow-sm shrink-0 group-hover:scale-105 transition-transform duration-500 border border-slate-50">
                                        <img src={book.urlPortada} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="font-black text-slate-800 text-sm uppercase truncate mb-0.5">{book.title}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{book.author}</p>
                                        <button onClick={() => checkAvailability(book)} className="px-4 py-2 bg-teal-50 text-teal-600 rounded-xl font-black text-[9px] uppercase border border-teal-100 hover:bg-teal-600 hover:text-white transition-all shadow-sm active:scale-95">Ver disponibilidad</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                <section className="animate-in fade-in duration-700 delay-300">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-2 flex items-center gap-2"><UserIcon size={14} /> Comunidad de Lectores</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {users.filter(u => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => <UserCard key={u.id} user={u} />)}
                    </div>
                </section>
            </main>

            {/* MODALES */}
            <AvailabilityModal
                isOpen={isAvailabilityOpen}
                onClose={() => setIsAvailabilityOpen(false)}
                stores={availableStores}
                listings={availableListings}
                bookTitle={selectedBookForStores}
                onRequest={handleToggleRequest}
                myRequests={mySentRequestIds}
            />

            <FeedbackModal
                isOpen={feedback.isOpen}
                onClose={() => setFeedback({ ...feedback, isOpen: false })}
                type={feedback.type}
            />

            <JoinEventModal isOpen={!!selectedEvent} event={selectedEvent} onClose={() => setSelectedEvent(null)} onStatusChange={loadExploreData} />
        </div>
    );
};