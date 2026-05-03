import { useEffect, useState, useCallback, JSX } from 'react';
import { bookService, Book } from '../../books/services/book.service';
import { AddBookModal } from '../../books/components/AddBookModal';
import {
    Search, Clock, CheckCircle, Plus,
    BookMarked, Edit2, Trash2, AlertTriangle, Sparkles, Star,
    BookOpen, StickyNote, LayoutGrid, List, SlidersHorizontal,
    ChevronDown, X
} from 'lucide-react';
import { BookFormData } from '../../books/schemas/books.shema';
import { BookNotes } from './BooksNotes';

export const LibraryView = () => {
    const [books, setBooks] = useState<Book[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('todos');
    const [sortBy, setSortBy] = useState<'title' | 'author' | 'recent'>('recent');
    const [gridCols, setGridCols] = useState<4 | 6>(6);

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedBook, setSelectedBook] = useState<Book | null>(null);
    const [isNotesOpen, setIsNotesOpen] = useState(false);
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const data = await bookService.getMyBooks();
            setBooks(data);
        } catch (e) {
            console.error("Error cargando libros:", e);
        } finally {
            setLoading(false);
        }
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
        <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-teal-100 border-t-teal-600 rounded-full animate-spin" />
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                {/* HEADER */}
                <div className="mb-10">
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-1">Mi Biblioteca</h1>
                    <p className="text-slate-400 text-sm font-medium tracking-tight">Tu catálogo personal de libros.</p>
                </div>

                {/* STAT CARDS */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
                    <StatCard label="Total" value={books.length} icon={<BookMarked size={18}/>} color="bg-teal-500" />
                    <StatCard label="Leyendo" value={books.filter(b => b.status === 'Reading').length} icon={<BookOpen size={18}/>} color="bg-sky-500" />
                    <StatCard label="Completados" value={books.filter(b => b.status === 'Read').length} icon={<CheckCircle size={18}/>} color="bg-indigo-500" />
                    <StatCard label="Pendientes" value={books.filter(b => b.status === 'Want to Read').length} icon={<Clock size={18}/>} color="bg-orange-500" />
                </div>

                {/* FILTROS TABS */}
                <div className="flex items-center gap-2 mb-8 bg-slate-200/40 p-1.5 rounded-2xl w-fit">
                    {["todos", "Reading", "Read", "Want to Read"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setFilterStatus(status)}
                            className={`px-6 py-2 rounded-xl font-bold text-[10px] uppercase tracking-widest transition-all ${filterStatus === status
                                ? "bg-[#1A535C] text-white shadow-md"
                                : "text-slate-500 hover:text-[#1A535C]"
                                }`}
                        >
                            {status === 'todos' ? 'Todos' : status === 'Reading' ? 'Leyendo' : status === 'Read' ? 'Completados' : 'Pendientes'}
                        </button>
                    ))}
                </div>

                {/* BARRA DE BÚSQUEDA Y ACCIONES */}
                <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-12">
                    <div className="flex flex-1 w-full gap-3 relative">
                        <div className="relative flex-1 md:max-w-xl group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-teal-600 transition-colors" />
                            <input
                                type="text"
                                placeholder="Buscar por título o autor"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-100 rounded-2xl text-sm focus:ring-4 focus:ring-teal-500/5 transition-all outline-none shadow-sm"
                            />
                        </div>

                        {/* DESPLEGABLE DE FILTROS FUNCIONAL */}
                        <div className="relative">
                            <button 
                                onClick={() => setIsFilterOpen(!isFilterOpen)}
                                className={`flex items-center gap-2 px-5 py-3.5 bg-white border border-slate-100 rounded-2xl text-slate-600 font-bold text-xs hover:bg-slate-50 transition-all shadow-sm ${isFilterOpen ? 'border-teal-500 ring-2 ring-teal-500/10' : ''}`}
                            >
                                <SlidersHorizontal size={16} />
                                <span>Filtros</span>
                                <ChevronDown size={14} className={`transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
                            </button>

                            {isFilterOpen && (
                                <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-2 animate-in fade-in slide-in-from-top-2">
                                    <p className="px-3 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-1">Ordenar por</p>
                                    <button onClick={() => {setSortBy('recent'); setIsFilterOpen(false)}} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${sortBy === 'recent' ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-50'}`}>Más recientes</button>
                                    <button onClick={() => {setSortBy('title'); setIsFilterOpen(false)}} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${sortBy === 'title' ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-50'}`}>Título (A-Z)</button>
                                    <button onClick={() => {setSortBy('author'); setIsFilterOpen(false)}} className={`w-full text-left px-3 py-2 rounded-xl text-xs font-bold ${sortBy === 'author' ? 'bg-teal-50 text-teal-600' : 'text-slate-600 hover:bg-slate-50'}`}>Autor</button>
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-3 w-full md:w-auto">
                        <button
                            onClick={() => { setSelectedBook(null); setIsModalOpen(true); }}
                            className="flex-1 md:flex-none flex items-center justify-center gap-2 px-8 py-3.5 bg-[#1A535C] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#14424a] transition-all shadow-lg shadow-teal-900/20 active:scale-95"
                        >
                            <Plus size={18} strokeWidth={3} />
                            <span>Añadir libro</span>
                        </button>
                        
                        {/* SELECTOR DE CUADRÍCULA */}
                        <div className="flex items-center bg-white border border-slate-100 rounded-2xl p-1 shadow-sm h-[52px]">
                            <button 
                                onClick={() => setGridCols(6)} 
                                className={`p-2.5 rounded-xl transition-all ${gridCols === 6 ? 'bg-teal-50 text-teal-600 shadow-inner' : 'text-slate-300 hover:text-slate-400'}`}
                            >
                                <LayoutGrid size={20} />
                            </button>
                            <button 
                                onClick={() => setGridCols(4)} 
                                className={`p-2.5 rounded-xl transition-all ${gridCols === 4 ? 'bg-teal-50 text-teal-600 shadow-inner' : 'text-slate-300 hover:text-slate-400'}`}
                            >
                                <List size={20} />
                            </button>
                        </div>
                    </div>
                </div>

                {/* GRID DE LIBROS */}
                {filteredBooks.length > 0 ? (
                    <div className={`grid gap-x-6 gap-y-10 ${gridCols === 6 ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4'}`}>
                        {filteredBooks.map((book) => (
                            <BookCard
                                key={book.id}
                                book={book}
                                onEdit={() => { setSelectedBook(book); setIsModalOpen(true); }}
                                onDelete={(e: React.MouseEvent) => {
                                    e.preventDefault();
                                    setSelectedBook(book);
                                    setIsDeleteModalOpen(true);
                                }}
                                onOpenNotes={(b: Book) => { setSelectedBook(b); setIsNotesOpen(true); }}
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-32 bg-white rounded-[4rem] border border-slate-100 shadow-sm">
                        <BookMarked className="w-20 h-20 text-slate-100 mx-auto mb-6" />
                        <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-xs">Tu estantería está vacía</p>
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

            {isNotesOpen && selectedBook && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
                    <div className="bg-[#F8FAFB] rounded-[3.5rem] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border-[12px] border-white animate-in zoom-in-95">
                        <div className="p-7 bg-white border-b border-slate-50 flex justify-between items-center">
                            <div>
                                <h3 className="font-black text-slate-900 uppercase text-lg leading-tight tracking-tight">{selectedBook.title}</h3>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Notas Personales</p>
                            </div>
                            <button onClick={() => setIsNotesOpen(false)} className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-400 hover:text-slate-900 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                            <BookNotes bookId={selectedBook.id} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};


const StatCard = ({ label, value, icon, color }: { label: string, value: number, icon: JSX.Element, color: string }) => (
    <div className="bg-white rounded-[2.5rem] p-5 border border-slate-100 shadow-sm flex items-center gap-5 hover:shadow-md transition-all">
        <div className={`w-11 h-11 ${color} text-white rounded-full flex items-center justify-center shadow-inner`}>
            {icon}
        </div>
        <div>
            <div className="text-2xl font-black text-slate-900 leading-none mb-1">{value}</div>
            <div className="text-[10px] text-slate-400 font-black uppercase tracking-wider">{label}</div>
        </div>
    </div>
);

const BookCard = ({ book, onEdit, onDelete, onOpenNotes }: { 
    book: Book, 
    onEdit: () => void, 
    onDelete: (e: React.MouseEvent) => void, 
    onOpenNotes: (b: Book) => void 
}) => {
    const ratingValue = (book as any).rating || 0;
    return (
        <div className="group flex flex-col h-full animate-in fade-in duration-500">
            <div className="relative mb-4 aspect-[3/4.4] rounded-[2.5rem] overflow-hidden shadow-sm group-hover:shadow-2xl transition-all duration-500 border border-slate-100">
                {book.urlPortada ? (
                    <img src={book.urlPortada} alt={book.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-100 text-slate-300 font-black text-4xl">{book.title.charAt(0)}</div>
                )}
                
                <div className="absolute top-4 right-4">
                    {book.status === "Reading" && <div className="w-8 h-8 bg-sky-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"><Clock size={14} className="text-white" /></div>}
                    {book.status === "Read" && <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"><CheckCircle size={14} className="text-white" /></div>}
                    {book.status === "Want to Read" && <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg"><Sparkles size={14} className="text-white" /></div>}
                </div>

                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-5 gap-2.5">
                    <div className="flex gap-2">
                        <button onClick={onEdit} className="flex-1 bg-white text-slate-900 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-teal-50 transition-all flex items-center justify-center gap-1.5"><Edit2 size={12}/> Editar</button>
                        <button onClick={() => onOpenNotes(book)} className="flex-1 bg-[#1A535C] text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-[#14424a] flex items-center justify-center gap-1.5"><StickyNote size={12}/> Notas</button>
                    </div>
                    <button onClick={onDelete} className="w-full bg-rose-500 text-white py-2.5 rounded-xl text-[10px] font-black uppercase tracking-tighter hover:bg-rose-600 transition-all flex items-center justify-center gap-1.5"><Trash2 size={12}/> Eliminar</button>
                </div>
            </div>
            
            <div className="px-2">
                <h3 className="font-black text-slate-800 text-[11px] mb-0.5 line-clamp-2 uppercase leading-tight tracking-tight group-hover:text-teal-600 transition-colors">{book.title}</h3>
                <p className="text-[10px] text-slate-400 font-bold mb-3 truncate">{book.author}</p>
                <div className="flex items-center gap-2 mt-auto bg-slate-50 w-fit px-2 py-1 rounded-lg">
                    <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                            <Star key={s} size={10} className={`${s <= ratingValue ? "fill-amber-400 text-amber-400" : "text-slate-200"}`} />
                        ))}
                    </div>
                    <span className="text-[10px] font-black text-slate-500">{ratingValue.toFixed(1)}</span>
                </div>
            </div>
        </div>
    );
};

const ConfirmDeleteModal = ({ isOpen, title, onClose, onConfirm }: { isOpen: boolean, title: string, onClose: () => void, onConfirm: () => void }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                    <AlertTriangle size={28} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">¿Eliminar lectura?</h3>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Estás a punto de borrar <span className="font-black text-slate-800 italic">"{title}"</span> de tu biblioteca.</p>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200 hover:bg-rose-600 hover:shadow-rose-100 transition-all">Eliminar</button>
                </div>
            </div>
        </div>
    );
};