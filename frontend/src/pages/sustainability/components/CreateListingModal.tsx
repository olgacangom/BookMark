import React, { useState, useEffect, useCallback } from 'react';
import { X, Search, Loader2, Tag, HandHelping, Check, BookOpen } from 'lucide-react';
import api from '../../../services/api';
import { bookService } from '../../../books/services/book.service';

export const CreateListingModal = ({ isOpen, onClose, onSuccess, listingToEdit = null }: any) => {
    const [step, setStep] = useState(1);
    const [searchTerm, setSearchTerm] = useState('');
    const [myBooks, setMyBooks] = useState<any[]>([]);
    const [loadingBooks, setLoadingBooks] = useState(false);
    const [selectedBook, setSelectedBook] = useState<any>(null);
    const [formData, setFormData] = useState({
        type: 'sale',
        condition: 'good',
        price: '',
        maxLoanDays: '15',
        description: ''
    });

    const isEditing = !!listingToEdit;

    const loadMyLibrary = useCallback(async () => {
        setLoadingBooks(true);
        try {
            const books = await bookService.getMyBooks();
            const { data: myListings } = await api.get('/sustainability/listings/me');
            const listedBookIds = new Set(myListings.map((l: any) => l.book.id));
            setMyBooks(books.filter(b => !listedBookIds.has(b.id)));
        } catch (error) { 
            console.error(error); 
        } finally { 
            setLoadingBooks(false); 
        }
    }, []);

    useEffect(() => {
        if (isOpen) {
            if (isEditing) {
                setSelectedBook(listingToEdit.book);
                setFormData({
                    type: listingToEdit.type,
                    condition: listingToEdit.condition,
                    price: listingToEdit.price.toString(),
                    maxLoanDays: listingToEdit.maxLoanDays?.toString() || '15',
                    description: listingToEdit.description || ''
                });
                setStep(2);
            } else {
                setStep(1);
                loadMyLibrary();
            }
        }
    }, [isOpen, listingToEdit, isEditing, loadMyLibrary]);

    const handleAction = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const payload = {
                ...formData,
                bookId: selectedBook.id,
                price: formData.type === 'sale' ? parseFloat(formData.price) : 0,
                maxLoanDays: formData.type === 'loan' ? parseInt(formData.maxLoanDays) : null
            };
            if (isEditing) await api.patch(`/sustainability/listings/${listingToEdit.id}`, payload);
            else await api.post('/sustainability/listings', payload);
            onSuccess();
            resetAndClose();
        } catch { 
            alert("Error al procesar la publicación."); 
        }
    };

    const resetAndClose = () => {
        setStep(1);
        setSelectedBook(null);
        setSearchTerm('');
        setFormData({ type: 'sale', condition: 'good', price: '', maxLoanDays: '15', description: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[700] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-[3.5rem] w-full max-w-xl overflow-hidden shadow-2xl border-[12px] border-white animate-in zoom-in-95 text-left flex flex-col max-h-[90vh]">

                <header className="p-8 bg-emerald-600 text-white flex justify-between items-center relative shrink-0">
                    <div className="z-10 text-left">
                        <h2 className="text-2xl font-black uppercase tracking-tighter italic leading-none">{isEditing ? 'Editar Anuncio' : 'Poner a circular'}</h2>
                        <p className="text-[10px] font-bold opacity-80 uppercase tracking-widest mt-2">{isEditing ? 'Actualiza los términos' : `Paso ${step} de 2`}</p>
                    </div>
                    <button onClick={resetAndClose} className="p-2 bg-black/10 hover:bg-black/20 rounded-full transition-all shrink-0"><X size={20} /></button>
                </header>

                <div className="p-8 overflow-y-auto custom-scrollbar text-left">
                    {step === 1 ? (
                        <div className="space-y-6">
                            <h3 className="text-lg font-black text-slate-900 uppercase flex items-center gap-2"><BookOpen size={20} className="text-emerald-500" /> Elige un libro de tu biblioteca</h3>
                            <div className="relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                <input type="text" placeholder="Filtra por título..." className="w-full pl-12 pr-6 py-4 bg-slate-50 rounded-2xl border-none outline-none font-bold text-sm" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                            </div>
                            <div className="grid gap-2">
                                {loadingBooks ? (
                                    <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
                                ) : myBooks.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).length > 0 ? (
                                    myBooks.filter(b => b.title.toLowerCase().includes(searchTerm.toLowerCase())).map(book => (
                                        <button key={book.id} onClick={() => { setSelectedBook(book); setStep(2); }} className="w-full p-4 flex items-center gap-4 bg-slate-50/50 hover:bg-emerald-50 rounded-[2rem] border border-slate-100 transition-all text-left group">
                                            <img
                                                src={book.urlPortada || undefined}
                                                className="w-12 h-16 object-cover rounded-xl shadow-sm group-hover:scale-105 transition-transform"
                                                alt={book.title}
                                            />
                                            <div className="min-w-0">
                                                <p className="font-black text-slate-800 uppercase text-[11px] truncate">{book.title}</p>
                                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{book.author}</p>
                                            </div>
                                        </button>
                                    ))
                                ) : (
                                    <div className="text-center py-10 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                                        <p className="text-slate-400 font-bold uppercase text-[9px] tracking-widest">No hay libros disponibles</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleAction} className="space-y-8 animate-in slide-in-from-right-4">
                            <div className="flex items-center gap-4 p-5 bg-emerald-50 rounded-[2.5rem] border border-emerald-100">
                                <img src={selectedBook?.urlPortada} className="w-16 h-24 object-cover rounded-2xl shadow-md shrink-0" alt="" />
                                <div className="min-w-0 text-left">
                                    <h3 className="font-black text-slate-900 uppercase text-sm leading-tight truncate">{selectedBook?.title}</h3>
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase mb-3">{selectedBook?.author}</p>
                                    {!isEditing && <button type="button" onClick={() => setStep(1)} className="text-[9px] font-black text-white bg-emerald-600 px-4 py-1.5 rounded-full shadow-md uppercase tracking-tighter hover:bg-emerald-700 transition-all">Cambiar libro</button>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {[{ id: 'sale', label: 'Venta', icon: Tag }, { id: 'loan', label: 'Préstamo', icon: HandHelping }].map(opt => (
                                    <button key={opt.id} type="button" onClick={() => setFormData({ ...formData, type: opt.id })} className={`flex flex-col items-center gap-3 p-6 rounded-[2.5rem] border-4 transition-all ${formData.type === opt.id ? 'border-emerald-500 bg-emerald-50 text-emerald-600 shadow-lg' : 'border-slate-50 bg-slate-50 text-slate-300'}`}>
                                        <opt.icon size={28} />
                                        <span className="text-[11px] font-black uppercase tracking-widest">{opt.label}</span>
                                    </button>
                                ))}
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1 text-left">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Condición</label>
                                    <select required className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-bold text-xs border border-slate-100" value={formData.condition} onChange={(e) => setFormData({ ...formData, condition: e.target.value })}>
                                        <option value="new">🌟 Nuevo</option>
                                        <option value="like_new">✨ Como nuevo</option>
                                        <option value="good">👍 Buen estado</option>
                                        <option value="worn">📖 Desgastado</option>
                                    </select>
                                </div>
                                {formData.type === 'sale' ? (
                                    <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Precio (€)</label>
                                        <input required type="number" min="0" step="0.01" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-slate-100 focus:bg-white transition-colors" value={formData.price} onChange={(e) => setFormData({ ...formData, price: e.target.value })} />
                                    </div>
                                ) : (
                                    <div className="space-y-1 text-left">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Días Máx.</label>
                                        <input required type="number" min="1" className="w-full p-4 bg-slate-50 rounded-2xl font-bold text-sm outline-none border border-slate-100 focus:bg-white transition-colors" value={formData.maxLoanDays} onChange={(e) => setFormData({ ...formData, maxLoanDays: e.target.value })} />
                                    </div>
                                )}
                            </div>

                            <div className="space-y-1 text-left">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Nota adicional</label>
                                <textarea className="w-full p-4 bg-slate-50 rounded-2xl outline-none font-medium text-xs resize-none border border-slate-100 focus:bg-white transition-colors" rows={2} placeholder="Detalles sobre el intercambio o estado..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
                            </div>

                            <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[2.5rem] font-black text-[11px] uppercase tracking-[0.3em] hover:bg-emerald-600 transition-all flex items-center justify-center gap-4 active:scale-95 shadow-xl shadow-slate-200">
                                <Check size={20} strokeWidth={3} /> {isEditing ? 'Guardar Cambios' : 'Confirmar Publicación'}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};