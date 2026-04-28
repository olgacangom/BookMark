import React, { useEffect, useState, useCallback } from 'react';
import { X, MapPin, Store, ExternalLink, ShoppingCart, Loader2, Info } from 'lucide-react';
import { Book } from '../services/book.service';
import api from '../../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    book: Book | null;
}

export const BookDetailsModal: React.FC<Props> = ({ isOpen, onClose, book }) => {
    const [stores, setStores] = useState<any[]>([]);
    const [isLoadingStores, setIsLoadingStores] = useState(false);

    const fetchAvailability = useCallback(async () => {
        if (!book) return;
        setIsLoadingStores(true);
        try {
            const res = await api.get(`/librero/find-stores/${book.id}`);
            setStores(res.data);
        } catch (error) {
            console.error("Error al buscar librerías", error);
        } finally {
            setIsLoadingStores(false);
        }
    }, [book]); 

    useEffect(() => {
        if (isOpen && book) {
            fetchAvailability();
        }
    }, [isOpen, book, fetchAvailability]);

    if (!isOpen || !book) return null;

    return (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-slate-900/50 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 animate-in zoom-in-95">
                
                <div className="relative h-48 bg-teal-600 overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                    <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 text-white rounded-full transition-all z-10">
                        <X size={20} />
                    </button>
                </div>

                <div className="px-10 pb-10 -mt-20 relative z-10">
                    <div className="flex flex-col md:flex-row gap-8">
                        <div className="w-40 flex-shrink-0 mx-auto md:mx-0">
                            <div className="aspect-[2/3] rounded-3xl shadow-2xl border-4 border-white overflow-hidden bg-slate-200">
                                <img src={book.urlPortada} alt={book.title} className="w-full h-full object-cover" />
                            </div>
                        </div>

                        <div className="flex-1 text-left pt-20 md:pt-24">
                            <h2 className="text-3xl font-black text-slate-900 leading-tight uppercase mb-1">{book.title}</h2>
                            <p className="text-teal-600 font-bold text-lg mb-4">{book.author}</p>
                            
                            <div className="flex flex-wrap gap-2 mb-6">
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">{book.genre || 'General'}</span>
                                <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black uppercase">{book.pageCount} Páginas</span>
                            </div>
                        </div>
                    </div>

                    <div className="mt-8 text-left">
                        <h3 className="flex items-center gap-2 text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-3">
                            <Info size={14} /> Sinopsis del libro
                        </h3>
                        <p className="text-slate-600 leading-relaxed text-sm italic">
                            {(book as any).description || 'No hay descripción disponible para este ejemplar.'}
                        </p>
                    </div>

                    <div className="mt-10 pt-8 border-t border-slate-100">
                        <div className="flex items-center justify-between mb-6">
                            <h3 className="text-lg font-black text-slate-900 uppercase">¿Dónde conseguirlo?</h3>
                            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-black uppercase">
                                <Store size={12} /> Compra Local
                            </div>
                        </div>

                        {isLoadingStores ? (
                            <div className="flex justify-center py-8"><Loader2 className="animate-spin text-teal-600" /></div>
                        ) : stores.length > 0 ? (
                            <div className="grid grid-cols-1 gap-3">
                                {stores.map((item) => (
                                    <div key={item.inventoryId} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-teal-200 transition-all">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-teal-600 shadow-sm"><Store size={20} /></div>
                                            <div>
                                                <p className="font-bold text-slate-800 text-sm">{item.store.libraryName}</p>
                                                <p className="text-[10px] text-slate-400 font-medium flex items-center gap-1"><MapPin size={10} /> {item.store.libraryAddress}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button 
                                                onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.store.libraryAddress)}`, '_blank')}
                                                className="p-2 text-slate-400 hover:text-teal-600 transition-colors"
                                            ><ExternalLink size={18} /></button>
                                            <button 
                                                onClick={() => window.location.href = `tel:${item.store.libraryPhone}`}
                                                className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase hover:bg-teal-600 transition-all"
                                            >Llamar</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="p-6 bg-slate-50 rounded-2xl border border-dashed border-slate-200 text-center">
                                <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest">No disponible en librerías cercanas</p>
                            </div>
                        )}

                        <a 
                            href={`https://www.amazon.es/s?k=${encodeURIComponent(book.title + ' ' + book.author)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="mt-6 w-full flex items-center justify-center gap-3 p-4 bg-[#FF9900]/10 text-[#FF9900] rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#FF9900] hover:text-white transition-all border border-[#FF9900]/20"
                        >
                            <ShoppingCart size={18} /> Ver disponibilidad en Amazon
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
};