import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { bookService } from '../../books/services/book.service';
import { UserCard } from '../components/UserCard';
import {
    Search, Loader2, TrendingUp, Bookmark, 
    MapPin, Store, X, ShoppingBag, Book as BookIcon,
    UserIcon, CheckCircle2, Clock, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { JoinEventModal } from './JoinEventModal'; 

const AvailabilityModal = ({ isOpen, onClose, stores, bookTitle }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 text-left">
            <div className="bg-white rounded-[3rem] w-full max-w-md overflow-hidden shadow-2xl border-8 border-white animate-in zoom-in-95">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h3 className="text-xl font-black text-slate-900 uppercase leading-tight">{bookTitle}</h3>
                            <p className="text-[10px] text-teal-600 font-black uppercase tracking-[0.2em] mt-1">Existencias en tiendas</p>
                        </div>
                        <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full transition-colors"><X size={20} /></button>
                    </div>

                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                        {stores.length > 0 ? (
                            stores.map((item: any) => (
                                <div key={item.inventoryId} className="bg-slate-50 border border-slate-100 p-5 rounded-[2rem] flex justify-between items-center group hover:bg-white hover:shadow-md transition-all">
                                    <div className="text-left flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <Store size={14} className="text-teal-600" />
                                            <p className="font-black text-slate-800 text-sm uppercase tracking-tight leading-tight">{item.store.libraryName}</p>
                                        </div>
                                        <div className="flex items-start gap-1.5 text-slate-400">
                                            <MapPin size={12} className="shrink-0 mt-0.5" />
                                            <p className="text-[10px] font-medium leading-tight">{item.store.libraryAddress}</p>
                                        </div>
                                    </div>
                                    <div className="text-right pl-4 border-l border-slate-200">
                                        <p className="text-xl font-black text-teal-600 leading-none mb-1">{Number(item.price).toFixed(2)}€</p>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-12 text-center bg-slate-50 rounded-[2.5rem] border border-dashed border-slate-200">
                                <ShoppingBag className="mx-auto text-slate-200 mb-3" size={32} />
                                <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest px-6 text-center">No disponible en tiendas físicas actualmente.</p>
                            </div>
                        )}
                    </div>
                    <button onClick={onClose} className="w-full mt-6 py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-lg hover:bg-teal-600 transition-all">Cerrar</button>
                </div>
            </div>
        </div>
    );
};

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
    const [selectedBookForStores, setSelectedBookForStores] = useState<string>('');

    const loadExploreData = useCallback(async () => {
        if (!currentUser) return;
        setLoading(true);
        try {
            const [usersRes, booksRes, myBooksRes, eventsRes] = await Promise.allSettled([
                api.get('/users'),
                api.get('/books'),
                bookService.getMyBooks(),
                api.get('/librero/events/all')
            ]);

            if (usersRes.status === 'fulfilled') {
                const lectores = usersRes.value.data
                    .filter((u: any) => u.id !== currentUser.id && u.role === 'user')
                    .map((u: any) => {
                        const myRel = u.followerRelations?.find((f: any) => f.followerId === currentUser.id || f.follower?.id === currentUser.id);
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
        } finally {
            setLoading(false);
        }
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
            const res = await api.get(`/librero/find-stores/${book.id}`);
            setAvailableStores(res.data);
            setSelectedBookForStores(book.title);
            setIsAvailabilityOpen(true);
        } catch { alert("Error al consultar stock"); }
    };

    const isAlreadyInLibrary = (book: any) => {
        if (!book) return false;
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
        } catch (error) { console.error("Error al añadir", error); } finally { setIsAdding(false); }
    };

    if (loading) return <div className="flex h-[80vh] items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>;

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-32 text-left">
            
            {!searchTerm && featuredBook && (
                <section className="max-w-7xl mx-auto px-6 pt-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center gap-3 mb-6">
                        <TrendingUp className="w-5 h-5 text-teal-600" />
                        <h2 className="text-sm font-black text-slate-800 uppercase tracking-widest leading-none">Tendencia actual</h2>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white overflow-hidden p-8 md:p-12 flex flex-col md:flex-row gap-12 group">
                        <div className="relative aspect-[3/4] w-full max-w-[240px] rounded-2xl overflow-hidden shadow-2xl shrink-0 mx-auto md:mx-0">
                            <img src={featuredBook.urlPortada} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
                        </div>
                        <div className="flex flex-col justify-center text-left">
                            <div className="flex gap-2 mb-4">
                                <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-[10px] font-black uppercase">Recomendado</span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">{featuredBook.genre}</span>
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black text-slate-900 mb-2 leading-none uppercase tracking-tighter">{featuredBook.title}</h1>
                            <p className="text-lg text-slate-400 font-medium mb-8">por {featuredBook.author}</p>
                            
                            <div className="flex flex-col sm:flex-row gap-4">
                                <button onClick={() => checkAvailability(featuredBook)} className="flex-1 px-8 py-4 bg-teal-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all shadow-lg flex items-center justify-center gap-2">
                                    <ShoppingBag size={18} /> ¿Dónde comprarlo?
                                </button>
                                
                                <button 
                                    onClick={() => handleAddToMyLibrary(featuredBook)}
                                    disabled={isAdding || isAlreadyInLibrary(featuredBook)}
                                    className={`flex-1 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg ${
                                        isAlreadyInLibrary(featuredBook) ? 'bg-emerald-500 text-white' : 'bg-slate-900 text-white hover:bg-slate-800'
                                    }`}
                                >
                                    {isAdding ? <Loader2 className="animate-spin" size={18} /> : 
                                     isAlreadyInLibrary(featuredBook) ? <><CheckCircle2 size={18} /> En tu biblioteca</> : <><Bookmark size={18} /> Mi Biblioteca</>}
                                </button>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* --- SECCIÓN DE EVENTOS --- */}
            {!searchTerm && events.length > 0 && (
                <section className="max-w-7xl mx-auto px-6 mt-16 animate-in fade-in slide-in-from-bottom-4 duration-1000 delay-200 text-left">
                    <div className="flex items-end justify-between mb-8 px-2">
                        <div>
                            <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Eventos Próximos</h3>
                            <p className="text-[10px] text-teal-600 font-black uppercase tracking-widest mt-2">Quedadas presenciales en librerías</p>
                        </div>
                        <button className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-teal-600 transition-colors">Ver Agenda →</button>
                    </div>

                    <div className="flex gap-6 overflow-x-auto pb-8 no-scrollbar -mx-6 px-6">
                        {events.map((event) => (
                            <div 
                                key={event.id} 
                                onClick={() => setSelectedEvent(event)} 
                                className="min-w-[280px] md:min-w-[340px] bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 group cursor-pointer flex flex-col"
                            >
                                <div className="flex items-center gap-2 mb-4 text-left">
                                    <div className="p-2 bg-teal-50 text-teal-600 rounded-xl group-hover:bg-teal-600 group-hover:text-white transition-colors">
                                        <Store size={14} />
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest truncate">{event.organizer?.libraryName}</span>
                                </div>
                                <h4 className="text-xl font-black text-slate-900 uppercase text-left leading-tight mb-4 group-hover:text-teal-600 transition-colors line-clamp-2 min-h-[3rem]">{event.title}</h4>
                                
                                <div className="space-y-3 mt-auto pt-6 border-t border-slate-50">
                                    <div className="flex items-center gap-3">
                                        <Clock className="text-teal-500" size={14} />
                                        <span className="text-[10px] font-bold text-slate-600 uppercase">
                                            {new Date(event.eventDate).toLocaleDateString([], { day: '2-digit', month: 'long' })} • {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    {/* BOTÓN CONECTADO AL MODAL */}
                                    <button 
                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); }} 
                                        className="w-full mt-2 py-3 bg-slate-50 text-slate-400 rounded-xl font-black text-[9px] uppercase tracking-widest group-hover:bg-slate-900 group-hover:text-white transition-all flex items-center justify-center gap-2"
                                    >
                                        Más Información <ChevronRight size={12} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            <header className="max-w-7xl mx-auto px-6 mt-16 mb-8 text-left">
                <h2 className="text-4xl font-black text-slate-900 uppercase italic leading-none">Explorar</h2>
                <div className="relative w-full md:max-w-md group mt-6">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300" />
                    <input type="text" placeholder="Busca por título o @lector..." className="w-full bg-white border border-slate-200 rounded-[1.5rem] py-4 pl-12 pr-4 text-sm font-bold focus:ring-8 focus:ring-teal-500/5 outline-none shadow-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                    {isSearching && <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-teal-600" />}
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 space-y-12">
                {/* Book Results */}
                {bookResults.length > 0 && (
                    <section>
                        <h3 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mb-6 ml-2 flex items-center gap-2"><BookIcon size={14} /> Catálogo de Libros</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {bookResults.map((book) => (
                                <div key={book.id} className="bg-white p-4 rounded-[2rem] border border-slate-100 shadow-sm flex items-center gap-6 hover:shadow-md transition-all">
                                    <div className="w-16 h-24 rounded-xl overflow-hidden shadow-sm shrink-0"><img src={book.urlPortada} className="w-full h-full object-cover" alt="" /></div>
                                    <div className="flex-1 min-w-0 text-left">
                                        <p className="font-black text-slate-800 text-sm uppercase truncate mb-0.5">{book.title}</p>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase mb-4">{book.author}</p>
                                        <button onClick={() => checkAvailability(book)} className="px-4 py-2 bg-teal-50 text-teal-600 rounded-xl font-black text-[9px] uppercase border border-teal-100 hover:bg-teal-600 hover:text-white transition-all">Ver disponibilidad</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>
                )}

                {/* Users list */}
                <section>
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 ml-2 flex items-center gap-2"><UserIcon size={14} /> Comunidad de Lectores</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {users.filter(u => u.fullName?.toLowerCase().includes(searchTerm.toLowerCase())).map((u) => <UserCard key={u.id} user={u} />)}
                    </div>
                </section>
            </main>

            <AvailabilityModal isOpen={isAvailabilityOpen} onClose={() => setIsAvailabilityOpen(false)} stores={availableStores} bookTitle={selectedBookForStores} />

            <JoinEventModal 
                isOpen={!!selectedEvent} 
                event={selectedEvent} 
                onClose={() => setSelectedEvent(null)} 
                onStatusChange={loadExploreData} 
            />
        </div>
    );
};