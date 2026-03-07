import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookService, Book } from '../../books/services/book.service';
import { AddBookModal } from '../../books/components/AddBookModal';
import { BookCard } from '../../books/components/BookCard';
import {
    Search,
    BookOpen,
    CheckCircle,
    Heart,
    Sparkles,
    Clock,
    ChevronDown,
    Filter,
    AlertTriangle
} from 'lucide-react';
import { BookFormData } from '../../books/schemas/books.shema';

export const LibraryView = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('todos');
    const [sortBy, setSortBy] = useState<'title' | 'author' | 'recent'>('recent');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);

    const { user } = useAuth();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await bookService.getMyBooks();
            setBooks(data);
        } catch (e) {
            console.error("Error al cargar biblioteca:", e);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleEditClick = (book: Book) => {
        setSelectedBook(book);
        setIsModalOpen(true);
    };

    const handleAddNewClick = () => {
        setSelectedBook(null);
        setIsModalOpen(true);
    };

    const openDeleteConfirm = (e: React.MouseEvent, book: Book) => {
        e.preventDefault();
        e.stopPropagation();
        setSelectedBook(book);
        setIsDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!selectedBook) return;
        try {
            await bookService.remove(selectedBook.id);
            setIsDeleteModalOpen(false);
            setSelectedBook(null);
            loadData();
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    };

    const filteredBooks = books
        .filter(book => {
            const matchesSearch =
                book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
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
            case 'Reading':
                return { label: 'Leyendo', icon: <Clock className="w-3.5 h-3.5" />, color: 'bg-blue-50 text-blue-600 border-blue-100' };
            case 'Read':
                return { label: 'Leído', icon: <CheckCircle className="w-3.5 h-3.5" />, color: 'bg-emerald-50 text-emerald-600 border-emerald-100' };
            case 'Want to Read':
                return { label: 'Pendiente', icon: <Heart className="w-3.5 h-3.5" />, color: 'bg-rose-50 text-rose-600 border-rose-100' };
            default:
                return { label: 'Sin estado', icon: <BookOpen className="w-3.5 h-3.5" />, color: 'bg-slate-50 text-slate-600 border-slate-100' };
        }
    };

    if (loading) {
        return (
            <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-primary font-black uppercase tracking-widest text-xs animate-pulse">Organizando estanterías...</p>
            </div>
        );
    }
    const CustomDropdown = ({ value, onChange, options, icon: Icon, align = 'left' }: any) => {
        const [isOpen, setIsOpen] = useState(false);
        const selectedOption = options.find((o: any) => o.value === value);

        return (
            <div className="relative">
                {/* Botón Principal */}
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-[#f8f6f4] border-2 border-transparent hover:border-primary/10 rounded-[1.5rem] transition-all shadow-sm active:scale-95"
                >
                    <div className="flex items-center gap-3">
                        {Icon && <Icon className="w-4 h-4 text-primary/50" />}
                        <span className="font-black text-[10px] uppercase tracking-widest text-[#564e4e]">
                            {selectedOption?.label}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-primary/30 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Menú Desplegable */}
                {isOpen && (
                    <>
                        <div
                            data-testid="dropdown-backdrop"
                            className="fixed inset-0 z-[90] bg-transparent"
                            onClick={() => setIsOpen(false)}
                        />
                        
                        {/* Backdrop Invisible - Z-INDEX ALTO */}
                        <div className="fixed inset-0 z-[90] bg-transparent" onClick={() => setIsOpen(false)} />

                        {/* El Menú - Z-INDEX MÁS ALTO AÚN */}
                        <div className={`absolute z-[100] mt-2 w-full min-w-[200px] bg-white rounded-[2rem] shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-primary/5 p-2 animate-in fade-in zoom-in-95 duration-200 ${align === 'right' ? 'right-0' : 'left-0'}`}>                            {options.map((opt: any) => (
                            <button
                                key={opt.value}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                                className={`w-full text-left px-5 py-3 rounded-[1.2rem] font-bold text-[10px] uppercase tracking-widest transition-colors ${value === opt.value
                                    ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                    : 'text-[#564e4e] hover:bg-primary/5'
                                    }`}
                            >
                                {opt.label}
                            </button>
                        ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    return (
        <div className="max-w-7xl mx-auto px-4 py-8 pb-32 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <img src="favicon.png" alt="Icono" className="w-10 h-10" />
                        <h1 className="text-4xl font-black text-[#564e4e] tracking-tight">Mi Biblioteca</h1>
                    </div>
                    <p className="text-muted-foreground text-lg font-medium">
                        Hola <span className="text-primary font-bold">{user?.fullName?.split(' ')[0] || 'Lector'}</span>, tienes {books.length} libros en tu colección.
                    </p>
                </div>
                <button
                    onClick={handleAddNewClick}
                    className="bg-primary text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-95 transition-all flex items-center justify-center gap-3"
                >
                    <Sparkles className="w-4 h-4" />
                    Añadir Nuevo Libro
                </button>
            </div>

            {/* Stats Section */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-10">
                <StatCard icon={<Clock />} label="Leyendo" value={stats.reading} color="blue" />
                <StatCard icon={<CheckCircle />} label="Finalizados" value={stats.read} color="emerald" />
                <StatCard icon={<Heart />} label="Por leer" value={stats.want} color="rose" />
            </div>

            {/* Barra de Búsqueda y Filtros Recuperada */}
            <div className="relative z-50 bg-white/80 backdrop-blur-md rounded-[2.5rem] p-4 mb-10 border border-white shadow-xl shadow-neutral-200/40">
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    {/* Búsqueda */}
                    <div className="md:col-span-5 relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-primary group-focus-within:scale-110 transition-transform" />
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Buscar por título o autor..."
                            className="w-full pl-14 pr-6 py-4 bg-neutral-50 border-2 border-transparent focus:border-primary/20 focus:bg-white rounded-[1.5rem] transition-all outline-none font-medium"
                        />
                    </div>

                    {/* Filtro de Estado */}
                    <div className="md:col-span-3">
                        <CustomDropdown
                            value={filterStatus}
                            onChange={setFilterStatus}
                            icon={Filter}
                            options={[
                                { value: 'todos', label: 'Todos los estados' },
                                { value: 'Reading', label: 'En progreso' },
                                { value: 'Read', label: 'Leídos' },
                                { value: 'Want to Read', label: 'Pendientes' }
                            ]}
                        />
                    </div>

                    {/* Ordenación */}
                    <div className="md:col-span-4">
                        <CustomDropdown
                            value={sortBy}
                            onChange={setSortBy}
                            align="right"
                            options={[
                                { value: 'recent', label: 'Añadidos recientemente' },
                                { value: 'title', label: 'Orden alfabético (Título)' },
                                { value: 'author', label: 'Orden alfabético (Autor)' }
                            ]}
                        />
                    </div>
                </div>
            </div>

            {/* Listado de Libros con BookCard */}
            {filteredBooks.length === 0 ? (
                <EmptyState hasSearch={!!searchTerm} onAddClick={handleAddNewClick} />
            ) : (
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                    {filteredBooks.map(book => (
                        <BookCard
                            key={book.id}
                            book={book}
                            onEdit={handleEditClick}
                            onDelete={openDeleteConfirm}
                            statusInfo={getStatusInfo(book.status)}
                        />
                    ))}
                </div>
            )}

            {/* Modal de Creación/Edición */}
            <AddBookModal
                isOpen={isModalOpen}
                book={selectedBook}
                onClose={() => {
                    setIsModalOpen(false);
                    setSelectedBook(null);
                }}
                onSuccess={loadData}
                createBook={async (data: BookFormData) => {
                    if (selectedBook) {
                        return await bookService.update(selectedBook.id, data as any);
                    } else {
                        return await bookService.create(data as any);
                    }
                }}
            />

            {/* Modal de Confirmación de Borrado */}
            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                onClose={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedBook(null);
                }}
                onConfirm={confirmDelete}
                title={selectedBook?.title}
            />
        </div>
    );
};


const ConfirmDeleteModal = ({ isOpen, onClose, onConfirm, title }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-primary/10 backdrop-blur-xl p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-sm overflow-hidden border border-white animate-in zoom-in-95 duration-200">
                <div className="p-8 text-center">
                    <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center text-rose-500 mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-800 mb-3 tracking-tight">¿Eliminar libro?</h3>
                    <p className="text-slate-500 font-medium leading-relaxed mb-8">
                        Vas a quitar <span className="text-slate-800 font-bold italic">"{title}"</span> de tu biblioteca. Esta acción no se puede deshacer.
                    </p>
                    <div className="flex gap-4">
                        <button
                            onClick={onClose}
                            className="flex-1 py-4 font-bold text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="flex-[2] py-4 bg-rose-500 text-white rounded-2xl font-bold shadow-lg shadow-rose-200 hover:bg-rose-600 hover:scale-[1.02] active:scale-95 transition-all"
                        >
                            Sí, eliminar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};


const StatCard = ({ icon, label, value, color }: any) => {
    const colors: any = {
        blue: "bg-blue-50/50 text-blue-600 border-blue-100",
        emerald: "bg-emerald-50/50 text-emerald-600 border-emerald-100",
        rose: "bg-rose-50/50 text-rose-600 border-rose-100"
    };

    return (
        <div className={`${colors[color]} p-7 rounded-[2.5rem] border shadow-sm flex items-center gap-6 hover:translate-y-[-4px] transition-all duration-300`}>
            <div className="p-4 bg-white rounded-2xl shadow-sm scale-110">{icon}</div>
            <div>
                <p className="text-4xl font-black text-slate-800 leading-none mb-1 tracking-tighter">{value}</p>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">{label}</p>
            </div>
        </div>
    );
};

const EmptyState = ({ hasSearch, onAddClick }: { hasSearch: boolean; onAddClick: () => void }) => (
    <div className="bg-white/50 backdrop-blur-sm rounded-[4rem] p-20 text-center border-4 border-dashed border-neutral-200 flex flex-col items-center animate-in zoom-in-95">
        <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center text-5xl mb-8 shadow-xl shadow-neutral-200">
            {hasSearch ? '🕵️‍♂️' : '📚'}
        </div>
        <h3 className="text-3xl font-black text-foreground mb-4 tracking-tight italic">
            {hasSearch ? 'Búsqueda sin éxito' : 'Tu estantería te espera'}
        </h3>
        <p className="text-muted-foreground mb-10 font-medium max-w-sm mx-auto leading-relaxed">
            {hasSearch
                ? 'No hemos encontrado ningún libro con esos criterios. Prueba a buscar por el nombre del autor.'
                : 'Parece que aún no has registrado ninguna lectura. ¡Es un buen momento para empezar!'}
        </p>
        <button
            onClick={onAddClick}
            className="bg-foreground text-white px-10 py-5 rounded-[2rem] font-black uppercase tracking-[0.15em] text-[10px] shadow-2xl hover:bg-primary transition-all active:scale-95"
        >
            Añadir mi primer libro
        </button>
    </div>
);