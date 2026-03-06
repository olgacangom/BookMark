import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { bookService, Book } from '../../books/services/book.service';
import { AddBookModal } from '../../books/components/AddBookModal';
import {
    Search,
    BookOpen,
    CheckCircle,
    Heart,
    Sparkles,
    Clock
} from 'lucide-react';

export const LibraryView = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('todos');
    const [sortBy, setSortBy] = useState<'title' | 'author' | 'recent'>('recent');
    const [isModalOpen, setIsModalOpen] = useState(false);

    const { user } = useAuth();
    const navigate = useNavigate();

    useEffect(() => {
        const loadData = async () => {
            try {
                const data = await bookService.getMyBooks();
                setBooks(data);
            } catch (e) {
                console.error("Error al cargar biblioteca:", e);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    const filteredBooks = books
        .filter(book => {
            const matchesSearch = book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                book.author.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = filterStatus === 'todos' || book.status === filterStatus;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            if (sortBy === 'title') return a.title.localeCompare(b.title);
            if (sortBy === 'author') return a.author.localeCompare(b.author);
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

    const stats = {
        reading: books.filter(b => b.status === 'Reading').length,
        read: books.filter(b => b.status === 'Read').length,
        want: books.filter(b => b.status === 'Want to Read').length,
    };

    const getStatusInfo = (status: string) => {
        switch (status) {
            case 'Reading': return { label: 'Reading', icon: <BookOpen className="w-4 h-4" />, color: 'bg-blue-100/80 text-blue-700 border-blue-200' };
            case 'Read': return { label: 'Read', icon: <CheckCircle className="w-4 h-4" />, color: 'bg-emerald-100/80 text-emerald-700 border-emerald-200' };
            case 'Want to Read': return { label: 'Want to Read', icon: <Heart className="w-4 h-4" />, color: 'bg-primary/20 text-primary border-primary/30' };
            default: return { label: 'Sin estado', icon: <Clock className="w-4 h-4" />, color: 'bg-slate-100 text-slate-600' };
        }
    };

    if (loading) return <div className="p-20 text-center animate-pulse text-primary font-bold">Cargando tu colección...</div>;

    function loadBooks() {
        throw new Error('Function not implemented.');
    }

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-24 md:pb-8 animate-in fade-in duration-700">
            {/* Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-3">
                    <div className="bg-primary p-2.5 rounded-xl shadow-lg shadow-primary/20">
                        <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight">Mi Biblioteca</h1>
                </div>
                <p className="text-muted-foreground text-lg">Gestiona tu colección personal de {books.length} libros</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
                <StatCard
                    icon={<BookOpen />}
                    label="Leyendo"
                    value={stats.reading}
                    color="blue"
                    gradient="from-blue-50 to-indigo-50"
                />
                <StatCard
                    icon={<CheckCircle />}
                    label="Leídos"
                    value={stats.read}
                    color="emerald"
                    gradient="from-emerald-50 to-teal-50"
                />
                <StatCard
                    icon={<Heart />}
                    label="Pendientes"
                    value={stats.want}
                    color="primary"
                    gradient="from-primary/10 to-secondary/10"
                />
            </div>

            <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 shadow-xl shadow-neutral-200/50 mb-8 border border-border">
                <div className="grid md:grid-cols-3 gap-6">
                    <FilterGroup label="Buscar">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Título o autor..."
                            className="w-full pl-12 pr-4 py-3 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary transition-all outline-none"
                        />
                    </FilterGroup>

                    <FilterGroup label="Estado">
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="w-full px-4 py-3 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                        >
                            <option value="todos">Todos los libros</option>
                            <option value="Reading"> Leyendo</option>
                            <option value="Read"> Leído</option>
                            <option value="Want to Read">Quiero leer</option>
                        </select>
                    </FilterGroup>

                    <FilterGroup label="Ordenar por">
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value as any)}
                            className="w-full px-4 py-3 bg-muted/50 border-none rounded-xl focus:ring-2 focus:ring-primary outline-none appearance-none cursor-pointer"
                        >
                            <option value="recent">🕐 Más reciente</option>
                            <option value="title">🔤 Título</option>
                            <option value="author">✍️ Autor</option>
                        </select>
                    </FilterGroup>
                </div>
            </div>

            {filteredBooks.length === 0 ? (
                <EmptyState
                    hasSearch={!!searchTerm}
                    onAddClick={() => setIsModalOpen(true)}
                />
            ) : (
                <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {filteredBooks.map(book => (
                        <Link key={book.id} to={`/libro/${book.id}`} className="...">
                        </Link>
                    ))}
                </div>
            )}

            <AddBookModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={() => { loadBooks(); }}
                createBook={(data) => bookService.create(data)}
            />
        </div>
    );
};

// Componentes Auxiliares
const StatCard = ({ icon, label, value, color, gradient }: any) => (
    <div className={`bg-gradient-to-br ${gradient} p-6 rounded-[2rem] border border-${color}-100 shadow-sm flex items-center gap-5 transition-transform hover:scale-[1.02]`}>
        <div className={`p-3 bg-white/60 rounded-2xl text-${color}-600 shadow-sm`}>{icon}</div>
        <div>
            <p className="text-3xl font-black text-slate-800 leading-none mb-1">{value}</p>
            <p className={`text-xs font-bold uppercase tracking-widest text-${color}-600/70`}>{label}</p>
        </div>
    </div>
);

const FilterGroup = ({ label, children }: any) => (
    <div className="flex-1">
        <label className="block text-xs font-black uppercase tracking-widest text-primary mb-2 ml-2">{label}</label>
        <div className="relative">{children}</div>
    </div>
);

const EmptyState = ({ hasSearch, onAddClick }: { hasSearch: boolean; onAddClick: () => void }) => (
    <div className="bg-white rounded-[3rem] p-20 text-center border-2 border-dashed border-border flex flex-col items-center">
        <div className="w-20 h-20 bg-muted rounded-[2rem] flex items-center justify-center text-4xl mb-6 shadow-sm">📖</div>

        <h3 className="text-2xl font-black text-foreground mb-2 tracking-tight">
            {hasSearch ? 'Sin resultados' : 'Tu estantería está vacía'}
        </h3>

        <p className="text-muted-foreground mb-8 font-medium max-w-xs mx-auto">
            {hasSearch
                ? 'No encontramos libros que coincidan con tu búsqueda. Prueba con otros términos.'
                : 'Parece que aún no has añadido ninguna joya literaria a tu colección.'}
        </p>

        <button
            onClick={onAddClick}
            className="bg-primary text-white px-8 py-4 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-105 transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
        >
            <Sparkles className="w-5 h-5" />
            {hasSearch ? 'Añadir este libro manualmente' : 'Registrar mi primer libro'}
        </button>
    </div>
);