import { useEffect, useState, useCallback } from 'react';
import {
    Search, Plus, Trash2, Loader2,
    CheckCircle2, Tag, AlertTriangle, X, Check, AlertCircle
} from 'lucide-react';
import api from '../../services/api';

import { AddStoreBookModal } from './AddStoreBookModal';
import { CreateStoreBookModal } from './CreateStoreBookModal';

const FeedbackModal = ({ isOpen, onClose, type, title, message }: any) => {
    if (!isOpen) return null;
    const isSuccess = type === 'success';

    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300 text-center">
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 max-w-sm w-full shadow-2xl border-4 md:border-8 border-white animate-in zoom-in-95 relative">
                <button onClick={onClose} className="absolute top-6 right-6 text-slate-300 hover:text-slate-500 transition-colors">
                    <X size={20} />
                </button>
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-lg ${isSuccess ? 'bg-teal-500 shadow-teal-100' : 'bg-rose-500 shadow-rose-100'}`}>
                    {isSuccess ? <Check size={32} className="text-white" strokeWidth={3} /> : <AlertCircle size={32} className="text-white" strokeWidth={3} />}
                </div>
                <h3 className={`text-xl md:text-2xl font-black mb-2 uppercase tracking-tighter leading-none ${isSuccess ? 'text-slate-900' : 'text-rose-600'}`}>
                    {title}
                </h3>
                <p className="text-slate-500 text-xs md:text-sm mb-8 font-medium leading-relaxed">{message}</p>
                <button onClick={onClose} className={`w-full py-4 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 ${isSuccess ? 'bg-slate-900 hover:bg-teal-600' : 'bg-rose-600 hover:bg-rose-700'}`}>
                    Entendido
                </button>
            </div>
        </div>
    );
};

const ConfirmDeleteStoreModal = ({ isOpen, onClose, onConfirm, title }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300 text-center">
            <div className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-sm w-full shadow-2xl border border-slate-100 relative animate-in zoom-in-95">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">¿Retirar libro?</h3>
                <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium px-2">Vas a eliminar <span className="font-bold text-slate-800 italic">"{title}"</span> del catálogo.</p>
                <div className="flex gap-3 mt-4">
                    <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg hover:bg-rose-600">Confirmar</button>
                </div>
            </div>
        </div>
    );
};

export const LibreroCatalogView = () => {
    const [searchTerm, setSearchTerm] = useState('');
    const [myStock, setMyStock] = useState<any[]>([]);
    const [searchResults, setSearchResults] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSearching, setIsSearching] = useState(false);

    const [isAddStoreModalOpen, setIsAddStoreModalOpen] = useState(false);
    const [isCreateNewModalOpen, setIsCreateNewModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    const [feedback, setFeedback] = useState({ isOpen: false, type: 'success', title: '', message: '' });

    const [selectedItem, setSelectedItem] = useState<any | null>(null);
    const [itemToDelete, setItemToDelete] = useState<any | null>(null);
    const [isEditing, setIsEditing] = useState(false);

    const fetchInventory = useCallback(async () => {
        try {
            const res = await api.get('/librero/inventory');
            setMyStock(res.data);
        } catch { console.error("Error al cargar inventario"); } 
        finally { setIsLoading(false); }
    }, []);

    useEffect(() => { fetchInventory(); }, [fetchInventory]);

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
                    setSearchResults(Array.from(groupedBooks.values()));
                } finally { setIsSearching(false); }
            } else { setSearchResults([]); }
        }, 500);
        return () => clearTimeout(delayDebounceFn);
    }, [searchTerm]);

    const handleOpenAdd = (book: any) => { setIsEditing(false); setSelectedItem(book); setIsAddStoreModalOpen(true); };
    const handleOpenEdit = (inventoryItem: any) => { setIsEditing(true); setSelectedItem(inventoryItem); setIsAddStoreModalOpen(true); };
    
    const handleOpenDelete = (e: React.MouseEvent, item: any) => { 
        e.stopPropagation(); 
        setItemToDelete(item); 
        setIsDeleteModalOpen(true); 
    };

    const confirmAction = async (formData: { price: number; inStock: boolean }) => {
        try {
            if (isEditing) {
                await api.patch(`/librero/inventory/${selectedItem.id}`, formData);
                setFeedback({ isOpen: true, type: 'success', title: '¡Actualizado!', message: 'Los cambios se han guardado correctamente.' });
            } else {
                await api.post(`/librero/inventory/${selectedItem.id}`, formData);
                setFeedback({ isOpen: true, type: 'success', title: '¡Añadido!', message: 'El libro ya está disponible en tu catálogo.' });
            }
            setIsAddStoreModalOpen(false);
            setSelectedItem(null);
            setSearchTerm('');
            setSearchResults([]);
            fetchInventory();
        } catch (error: any) {
            const msg = error.response?.data?.message || "No se ha podido procesar la solicitud.";
            setFeedback({ isOpen: true, type: 'error', title: 'Error de inventario', message: Array.isArray(msg) ? msg[0] : msg });
        }
    };

    const confirmDelete = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/librero/inventory/${itemToDelete.id}`);
            setIsDeleteModalOpen(false);
            setItemToDelete(null);
            fetchInventory();
            setFeedback({ isOpen: true, type: 'success', title: 'Retirado', message: 'El libro ha sido eliminado de tu catálogo.' });
        } catch { 
            setFeedback({ isOpen: true, type: 'error', title: 'Error', message: 'No se pudo eliminar el ejemplar.' });
        }
    };

    if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

    return (
        <div className="py-6 md:py-8 animate-in fade-in duration-700 text-left px-4">
            
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
                <div className="flex items-center gap-4">
                    <div className="min-w-0">
                        <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-none mb-1">Mi Catálogo</h2>
                        <p className="text-slate-400 text-xs md:text-sm font-medium italic">Gestiona tus existencias</p>
                    </div>
                </div>
                <button 
                    onClick={() => { setIsEditing(false); setIsCreateNewModalOpen(true); }} 
                    className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-4 md:py-3 bg-[#0f172a] text-white rounded-2xl font-bold text-xs uppercase hover:bg-teal-600 transition-all shadow-lg active:scale-95"
                >
                    <Plus size={18} /> Añadir Libro Nuevo
                </button>
            </div>

            {/* BUSCADOR */}
            <div className="relative mb-10 text-left">
                <div className="bg-white p-5 md:p-6 rounded-[2rem] md:rounded-[2.5rem] shadow-sm border border-slate-100 relative z-30">
                    <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-3 block ml-2">Buscador rápido global</label>
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300" size={20} />
                        <input type="text" placeholder="Busca por título o autor..." className="w-full pl-14 pr-4 py-4 md:py-5 bg-slate-50 border border-slate-100 rounded-2xl md:rounded-3xl focus:outline-none focus:border-teal-500 text-sm font-semibold transition-all shadow-inner" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                        {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-teal-600" size={20} />}
                    </div>
                </div>

                {searchResults.length > 0 && (
                    <div className="absolute top-[90%] left-0 right-0 pt-10 pb-6 px-4 md:px-6 bg-white rounded-b-[2rem] md:rounded-b-[2.5rem] shadow-2xl border-x border-b border-slate-100 z-20 animate-in slide-in-from-top-5">
                        <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                            {searchResults.map((book) => {
                                const inStock = myStock.some(s => s.book.id === book.id);
                                return (
                                    <div key={book.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all">
                                        <div className="flex items-center gap-3 md:gap-4 text-left min-w-0">
                                            <img src={book.urlPortada} className="w-10 h-14 object-cover rounded-lg shadow-sm shrink-0" alt="" />
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 text-xs md:text-sm leading-tight truncate">{book.title}</p>
                                                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase truncate">{book.author}</p>
                                            </div>
                                        </div>
                                        {inStock ? (
                                            <span className="text-teal-600 font-black text-[8px] md:text-[9px] uppercase bg-teal-50 px-2 md:px-3 py-1.5 md:py-2 rounded-xl flex items-center gap-1 shrink-0"><CheckCircle2 size={12} /> Stock</span>
                                        ) : (
                                            <button onClick={() => handleOpenAdd(book)} className="px-3 md:px-4 py-1.5 md:py-2 bg-slate-900 text-white rounded-xl text-[9px] md:text-[10px] font-black uppercase hover:bg-teal-600 transition-all shrink-0">Añadir</button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}
            </div>

            <h3 className="text-lg md:text-xl font-black text-slate-900 uppercase tracking-tight mb-6 md:mb-8 ml-2">Artículos a la venta ({myStock.length})</h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 md:gap-6">
                {myStock.map((item) => (
                    <div 
                        key={item.id} 
                        onClick={() => handleOpenEdit(item)}
                        className="group bg-white p-3 md:p-5 rounded-[2rem] md:rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col hover:shadow-2xl hover:scale-[1.02] hover:border-teal-500/30 transition-all duration-300 relative overflow-hidden cursor-pointer"
                    >
                        <button 
                            onClick={(e) => handleOpenDelete(e, item)}
                            className="absolute top-4 right-4 z-20 p-2.5 bg-white/90 backdrop-blur-md text-rose-500 rounded-xl opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-rose-500 hover:text-white transition-all shadow-md border border-slate-100"
                        >
                            <Trash2 size={18} />
                        </button>

                        <div className="relative w-full aspect-[2/3] rounded-2xl overflow-hidden shadow-sm bg-slate-50 mb-3 md:mb-4">
                            <img src={item.book.urlPortada} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />
                            {!item.inStock && (
                                <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[2px] flex items-center justify-center">
                                    <span className="bg-rose-500 text-white px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">Agotado</span>
                                </div>
                            )}
                            <div className="absolute bottom-2 right-2 px-2 py-1 bg-white/90 backdrop-blur-md rounded-xl shadow-lg border border-slate-100 flex items-center gap-1">
                                <Tag size={10} className="text-teal-600" />
                                <span className="text-[10px] sm:text-xs font-black text-slate-900">{Number(item.price).toFixed(2)}€</span>
                            </div>
                        </div>

                        <div className="flex-1 flex flex-col justify-between text-left">
                            <div>
                                <h4 className="font-black text-slate-900 leading-tight mb-0.5 uppercase text-[11px] md:text-sm break-words whitespace-normal group-hover:text-teal-600 transition-colors">
                                    {item.book.title}
                                </h4>
                                <p className="text-[9px] md:text-[10px] text-slate-400 font-bold uppercase truncate">
                                    {item.book.author}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            <AddStoreBookModal isOpen={isAddStoreModalOpen} onClose={() => setIsAddStoreModalOpen(false)} book={selectedItem} onConfirm={confirmAction} isEditing={isEditing} />
            <CreateStoreBookModal isOpen={isCreateNewModalOpen} onClose={() => setIsCreateNewModalOpen(false)} onSuccess={fetchInventory} />
            <ConfirmDeleteStoreModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={confirmDelete} title={itemToDelete?.book?.title || ''} />

            <FeedbackModal 
                isOpen={feedback.isOpen} 
                onClose={() => setFeedback({ ...feedback, isOpen: false })} 
                type={feedback.type} 
                title={feedback.title} 
                message={feedback.message} 
            />
        </div>
    );
};