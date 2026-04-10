import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { bookService, Book } from '../../books/services/book.service';
import { UserCard } from '../components/UserCard';
import {
    Search, Loader2, TrendingUp, Bookmark, Star, CheckCircle2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const ExploreView = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [featuredBook, setFeaturedBook] = useState<Book | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    
    const [myBookIds, setMyBookIds] = useState<string[]>([]);

    const loadExploreData = useCallback(async () => {
        setLoading(true);
        try {
            const [usersRes, featuredRes, myBooks] = await Promise.allSettled([
                api.get('/users'),
                api.get('/books/featured/trending'),
                bookService.getMyBooks() 
            ]);

            if (usersRes.status === 'fulfilled') {
                const others = usersRes.value.data
                    .filter((u: any) => u.id !== currentUser?.id)
                    .map((u: any) => {
                        const myRel = u.followerRelations?.find(
                            (f: any) => f.followerId === currentUser?.id || f.follower?.id === currentUser?.id
                        );
                        return { ...u, followStatus: myRel ? myRel.status : null };
                    });
                setUsers(others);
            }

            if (featuredRes.status === 'fulfilled') {
                setFeaturedBook(featuredRes.value.data);
            } else {
                setFeaturedBook({
                    title: "El Nombre del Viento",
                    author: "Patrick Rothfuss",
                    urlPortada: "https://images.unsplash.com/photo-1762970783061-1b8b2248d9e5?q=80&w=800",
                    rating: 4.9,
                    description: "Una crónica magistral sobre la vida de Kvothe. Una historia de magia y música que redefine la épica fantástica moderna.",
                    genre: "Fantasía"
                } as any);
            }

            if (myBooks.status === 'fulfilled') {
                const existingKeys = myBooks.value.map(b => `${b.title}-${b.author}`.toLowerCase());
                setMyBookIds(existingKeys);
            }

        } catch (error) {
            console.error("Error crítico en exploración:", error);
        } finally {
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (currentUser) loadExploreData();
    }, [loadExploreData, currentUser]);

    const isAlreadyInLibrary = featuredBook 
        ? myBookIds.includes(`${featuredBook.title}-${featuredBook.author}`.toLowerCase())
        : false;

    const handleAddToMyLibrary = async () => {
        if (!featuredBook || isAlreadyInLibrary) return;
        
        setIsAdding(true);
        try {
            await bookService.create({
                title: featuredBook.title,
                author: featuredBook.author,
                status: 'Want to Read',
                urlPortada: featuredBook.urlPortada,
                genre: featuredBook.genre,
                description: featuredBook.description,
                pageCount: featuredBook.pageCount
            });
            
            setMyBookIds(prev => [...prev, `${featuredBook.title}-${featuredBook.author}`.toLowerCase()]);
        } catch (error) {
            console.error("Error al añadir libro", error);
        } finally {
            setIsAdding(false);
        }
    };

    const filteredUsers = users.filter((u: any) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex h-[80vh] flex-col items-center justify-center bg-[#F0F9F9]">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-32">
            {!searchTerm && featuredBook && (
                <section className="max-w-7xl mx-auto px-6 pt-8 animate-in fade-in slide-in-from-top-4 duration-1000">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-teal-600" />
                            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-widest">Tendencia</h2>
                        </div>
                    </div>

                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] shadow-xl border border-white overflow-hidden group">
                        <div className="grid md:grid-cols-2 gap-8 p-8 md:p-12">
                            <div className="relative flex justify-center">
                                <div className="relative aspect-[3/4] w-full max-w-[280px] rounded-2xl overflow-hidden shadow-2xl transition-transform duration-700 group-hover:scale-[1.03]">
                                    <img src={featuredBook.urlPortada} className="w-full h-full object-cover" alt={featuredBook.title} />
                                    <div className="absolute -bottom-2 -right-2 w-20 h-20 bg-gradient-to-br from-orange-400 to-orange-600 rounded-full flex flex-col items-center justify-center shadow-xl border-4 border-white transform rotate-12">
                                        <span className="text-xl font-black text-white">{featuredBook.rating || '4.9'}</span>
                                        <div className="flex gap-0.5">
                                            {[...Array(5)].map((_, i) => <Star key={i} size={6} className="fill-white text-white" />)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col justify-center">
                                <div className="flex gap-2 mb-4">
                                    <span className="px-3 py-1 bg-teal-600 text-white rounded-full text-[10px] font-bold uppercase tracking-tighter shadow-md">Libro del Mes</span>
                                    <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-tighter">{featuredBook.genre}</span>
                                </div>
                                <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 mb-2 leading-none uppercase">{featuredBook.title}</h1>
                                <p className="text-lg text-slate-400 font-medium mb-6">de {featuredBook.author}</p>
                                <p className="text-slate-500 leading-relaxed mb-8 line-clamp-4 italic">"{featuredBook.description}"</p>

                                <div className="flex gap-3">
                                    <button
                                        onClick={handleAddToMyLibrary}
                                        disabled={isAdding || isAlreadyInLibrary}
                                        className={`flex-1 px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-[0.1em] transition-all flex items-center justify-center gap-3 shadow-lg active:scale-95 ${
                                            isAlreadyInLibrary
                                                ? 'bg-emerald-500 text-white cursor-default opacity-100'
                                                : 'bg-slate-900 text-white hover:bg-teal-600'
                                        }`}
                                    >
                                        {isAdding ? <Loader2 className="animate-spin" size={18} /> : (
                                            isAlreadyInLibrary 
                                                ? <><CheckCircle2 size={18} /> Añadido a tu biblioteca</> 
                                                : <><Bookmark size={18} /> Añadir a mi biblioteca</>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
            )}

            <header className="max-w-7xl mx-auto px-6 pt-24 pb-8">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h2 className="text-4xl font-black text-slate-900 tracking-tighter leading-none uppercase">
                            Descubrir <span className="text-teal-600 font-serif italic font-normal lowercase">lectores.</span>
                        </h2>
                        <p className="text-slate-400 mt-2 font-bold text-[10px] uppercase tracking-[0.2em]">Comunidad BookMark • {users.length} miembros</p>
                    </div>

                    <div className="relative w-full md:max-w-xs group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-teal-600" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold text-slate-700 focus:ring-4 focus:ring-teal-500/5 transition-all outline-none shadow-sm"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6 py-10">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map((u) => (
                        <UserCard key={u.id} user={u} />
                    ))}
                </div>
            </main>
        </div>
    );
};