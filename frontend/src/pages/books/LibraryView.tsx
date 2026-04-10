import { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { bookService, Book } from '../../books/services/book.service';
import { AddBookModal } from '../../books/components/AddBookModal';
import {
    Search, Clock, CheckCircle, Plus,
    BookMarked, Edit2, Trash2, AlertTriangle, Sparkles, Star,
    BookOpen, MessageSquare, SortAsc // <--- Usaremos SortAsc
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
        } catch (e) { console.error(e); } finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

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

        const dateA = new Date(a.updatedAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.updatedAt || b.createdAt || 0).getTime();
        
        return dateB - dateA; 
    });

    if (loading) return (
        <div className="min-h-screen bg-[#F0F9F9] flex items-center justify-center">
            <div className="w-10 h-10 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Mi Biblioteca</h1>
                    <p className="text-slate-500 font-medium italic">Hola {user?.fullName?.split(' ')[0]}, consulta tu catálogo personal.</p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                    <StatCard label="Total" value={books.length} color="from-slate-600 to-slate-700" />
                    <StatCard label="Leyendo" value={books.filter(b => b.status === 'Reading').length} color="from-sky-600 to-cyan-600" />
                    <StatCard label="Completados" value={books.filter(b => b.status === 'Read').length} color="from-emerald-600 to-teal-600" />
                    <StatCard label="Pendientes" value={books.filter(b => b.status === 'Want to Read').length} color="from-amber-500 to-orange-500" />
                </div>

                <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2 no-scrollbar">
                    {[
                        { id: "todos", label: "Todos" },
                        { id: "Reading", label: "Leyendo" },
                        { id: "Read", label: "Completados" },
                        { id: "Want to Read", label: "Pendientes" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilterStatus(tab.id)}
                            className={`px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${filterStatus === tab.id
                                ? "bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white shadow-lg shadow-teal-500/30"
                                : "bg-white/80 backdrop-blur-xl text-slate-400 border border-slate-200/50 hover:text-teal-600"
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-8">
                    <div className="flex flex-1 w-full gap-3">
                        <div className="relative flex-1 md:max-w-md group">
                            <Search className="absolute z-10 left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 pointer-events-none transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar ejemplar..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="relative z-0 w-full pl-11 pr-4 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-sm focus:ring-4 focus:ring-teal-500/10 transition-all outline-none"
                            />
                        </div>

                        <div className="relative group">
                            <SortAsc className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                            <select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value as 'title' | 'author' | 'recent')}
                                className="pl-11 pr-8 py-3 bg-white/80 backdrop-blur-xl border border-slate-200/50 rounded-2xl text-xs font-bold uppercase tracking-tighter outline-none appearance-none cursor-pointer hover:border-teal-500 transition-colors"
                            >
                                <option value="recent">Recientes</option>
                                <option value="title">Título</option>
                                <option value="author">Autor</option>
                            </select>
                        </div>
                    </div>

                    <button
                        onClick={() => { setSelectedBook(null); setIsModalOpen(true); }}
                        className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white rounded-xl font-bold hover:shadow-lg hover:shadow-teal-500/50 transition-all active:scale-95"
                    >
                        <Plus size={20} />
                        <span>Añadir Libro</span>
                    </button>
                </div>

                {filteredBooks.length > 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                        {filteredBooks.map((book) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                onEdit={() => { setSelectedBook(book); setIsModalOpen(true); }}
                                onDelete={(e) => {
                                    e.preventDefault();
                                    setSelectedBook(book);
                                    setIsDeleteModalOpen(true);
                                }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-[2rem] border-2 border-dashed border-slate-200">
                        <BookMarked className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">El estante está vacío</p>
                    </div>
                )}
            </div>

            <AddBookModal
                isOpen={isModalOpen}
                book={selectedBook}
                onClose={() => { setIsModalOpen(false); setSelectedBook(null); }}
                onSuccess={loadData}
                createBook={async (data: BookFormData) => {
                    if (selectedBook) return await bookService.update(selectedBook.id, data as any);
                    return await bookService.create(data as any);
                }}
            />

            <ConfirmDeleteModal
                isOpen={isDeleteModalOpen}
                title={selectedBook?.title || ''}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedBook(null); }}
                onConfirm={async () => {
                    if (selectedBook) {
                        await bookService.remove(selectedBook.id);
                        setIsDeleteModalOpen(false);
                        loadData();
                    }
                }}
            />
        </div>
    );
};

const StatCard = ({ label, value, color }: { label: string, value: number, color: string }) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-2xl p-6 border border-slate-200/50 hover:shadow-lg transition-all">
        <div className={`w-12 h-12 bg-gradient-to-br ${color} rounded-xl mb-4 flex items-center justify-center shadow-sm`}>
            <BookOpen className="w-6 h-6 text-white" />
        </div>
        <div className="text-3xl font-bold text-slate-900 mb-1">{value}</div>
        <div className="text-xs text-slate-400 font-bold uppercase tracking-widest">{label}</div>
    </div>
);

const BookCard = ({ book, onEdit, onDelete }: { book: Book, onEdit: () => void, onDelete: (e: any) => void }) => {
    const ratingValue = (book as any).rating || 0;
    const hasReview = !!(book as any).review; // Comprobamos si tiene review

    return (
        <div className="group flex flex-col h-full animate-in fade-in duration-500">
            <div className="relative mb-3 aspect-[2/3] rounded-2xl overflow-hidden shadow-lg group-hover:shadow-2xl transition-all bg-slate-100">
                {book.urlPortada ? (
                    <img src={book.urlPortada} alt={book.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center p-4 text-center bg-slate-200 text-slate-400 font-bold">
                        {book.title.charAt(0)}
                    </div>
                )}

                <div className="absolute top-2 right-2">
                    {book.status === "Reading" && (
                        <div className="w-8 h-8 bg-sky-500/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                            <Clock className="w-4 h-4 text-white" />
                        </div>
                    )}
                    {book.status === "Read" && (
                        <div className="w-8 h-8 bg-emerald-500/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                        </div>
                    )}
                    {book.status === "Want to Read" && (
                        <div className="w-8 h-8 bg-amber-500/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-lg">
                            <Sparkles className="w-4 h-4 text-white" />
                        </div>
                    )}
                </div>

                {hasReview && (
                    <div className="absolute top-2 left-2 w-8 h-8 bg-white/90 backdrop-blur-md rounded-full flex items-center justify-center text-teal-600 shadow-sm border border-teal-100">
                        <MessageSquare size={14} />
                    </div>
                )}

                <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center p-4 gap-2">
                    <button onClick={onEdit} className="w-full bg-white text-slate-900 py-2.5 rounded-xl text-xs font-bold hover:bg-teal-50 transition-all flex items-center justify-center gap-2">
                        <Edit2 size={14} /> Editar
                    </button>
                    <button onClick={onDelete} className="w-full bg-rose-500 text-white py-2.5 rounded-xl text-xs font-bold hover:bg-rose-600 transition-all flex items-center justify-center gap-2">
                        <Trash2 size={14} /> Eliminar
                    </button>
                </div>
            </div>

            <div className="flex-1 flex flex-col">
                <h3 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 uppercase tracking-tight group-hover:text-teal-600 transition-colors">
                    {book.title}
                </h3>
                <p className="text-[10px] text-slate-500 mb-2 font-semibold">{book.author}</p>

                {book.status === "Read" && (
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star 
                                key={s} 
                                size={12} 
                                className={`${s <= ratingValue ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} 
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

interface DeleteModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onConfirm: () => void;
}

const ConfirmDeleteModal = ({ isOpen, title, onClose, onConfirm }: DeleteModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight">¿Eliminar lectura?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">
                    Estás a punto de borrar <span className="font-bold text-slate-800 italic">"{title}"</span>. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase text-xs tracking-widest">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-bold shadow-lg hover:bg-rose-600 transition-all uppercase text-xs tracking-widest">Eliminar</button>
                </div>
            </div>
        </div>
    );
};