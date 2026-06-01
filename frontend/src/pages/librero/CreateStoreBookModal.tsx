import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, BookPlus, Loader2, Sparkles, Check, Tag, Camera } from 'lucide-react';
import api from '../../services/api';
import { BookFormData, bookSchema, BOOK_GENRES } from '../../books/schemas/books.shema';
import { ScannerModal } from '../../books/components/ScannerModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
}

export const CreateStoreBookModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, onError }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [isbn, setIsbn] = useState('');
    const [searchError, setSearchError] = useState<string | null>(null);

    const { register, handleSubmit, setValue, watch, reset } = useForm<BookFormData>({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            status: 'Read',
            price: 0,
            inStock: true,
            pageCount: 0,
            rating: 0
        }
    });

    const currentPortada = watch('urlPortada');

    const [isScannerOpen, setIsScannerOpen] = useState(false);


    useEffect(() => {
        if (isOpen) {
            reset({
                title: '', author: '', genre: '', description: '',
                pageCount: 0, urlPortada: '', isbn: '',
                price: 0, inStock: true, status: 'Read', rating: 0, review: ''
            });
            setIsbn('');
            setSearchError(null);
        }
    }, [isOpen, reset]);

    const triggerIsbnSearch = async (targetIsbn: string) => {
        const cleanIsbn = targetIsbn.replace(/[-\s]/g, "");
        if (cleanIsbn.length < 10) return;
        setIsSearching(true);
        setSearchError(null);
        try {
            const res = await api.get(`/books/search/${cleanIsbn}`);
            const b = res.data;
            setValue('title', b.title);
            setValue('author', Array.isArray(b.authors) ? b.authors.join(', ') : b.authors);
            setValue('description', b.description);
            setValue('urlPortada', b.urlPortada);
            setValue('pageCount', Number(b.pageCount) || 0);
        } catch {
            setSearchError("Libro no encontrado en base de datos.");
        } finally {
            setIsSearching(false);
        }
    };

    const handleOnSubmit = async (data: BookFormData) => {
        try {
            const { price, inStock, ...bookData } = data;
            const bookRes = await api.post('/books', { ...bookData, isbn: bookData.isbn || isbn });
            await api.post(`/librero/inventory/${bookRes.data.id}`, { price, inStock });
            onSuccess();
            onClose();
        } catch (error: any) {
            const msg = error.response?.data?.message || "No se pudo registrar el libro";
            onError(Array.isArray(msg) ? msg[0] : msg);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
                <header className="px-8 py-6 bg-teal-600 text-white flex justify-between items-center">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        <BookPlus size={24} /> Registrar en Catálogo
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full"><X size={20} /></button>
                </header>

                <form onSubmit={handleSubmit(handleOnSubmit)} className="p-8 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
                    {/* ISBN */}
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase mb-2"><Sparkles size={14} /> ISBN</label>
                            <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none" />
                        </div>
                        <button
                            type="button"
                            onClick={() => setIsScannerOpen(true)}
                            className="p-2 bg-white border border-slate-200 rounded-xl"
                        >
                            <Camera size={18} />
                        </button>
                        <button type="button" onClick={() => triggerIsbnSearch(isbn)} className="h-10 px-6 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-teal-600">
                            {isSearching ? <Loader2 size={16} className="animate-spin" /> : "BUSCAR"}
                        </button>
                    </div>

                    {searchError && (
                        <p className="text-[10px] font-bold text-rose-500 uppercase px-1">
                            {searchError}
                        </p>
                    )}

                    <div className="flex gap-6">
                        <div className="w-24 aspect-[2/3] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner shrink-0">
                            {currentPortada ? <img src={currentPortada} className="w-full h-full object-cover" /> : <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300">SIN FOTO</div>}
                        </div>
                        <div className="flex-1 space-y-3">
                            <input {...register('title')} placeholder="Título" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold" required />
                            <input {...register('author')} placeholder="Autor" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold" required />
                            <select {...register('genre')} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold">
                                <option value="">Seleccionar Género...</option>
                                {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* PRECIO Y STOCK */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <label className="text-[10px] font-black text-emerald-700 uppercase block mb-1"><Tag size={12} className="inline mr-1" /> Precio (€)</label>
                            <input type="number" min="0" step="0.01" {...register('price', { valueAsNumber: true })} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-lg font-black text-emerald-900 outline-none" />
                        </div>
                        <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col justify-center">
                            <label className="text-[10px] font-black text-teal-700 uppercase mb-2">Disponibilidad</label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" {...register('inStock')} className="w-5 h-5 rounded border-teal-300 text-teal-600" />
                                <span className="text-xs font-bold text-teal-800">En stock</span>
                            </label>
                        </div>
                    </div>

                    <textarea {...register('description')} rows={3} placeholder="Sinopsis..." className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium" />

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2">
                        <Check size={18} /> Publicar y añadir al catálogo
                    </button>
                </form>
                <ScannerModal
                    isOpen={isScannerOpen}
                    onClose={() => setIsScannerOpen(false)}
                    onScanSuccess={(code) => {
                        setIsbn(code);
                        triggerIsbnSearch(code);
                        setIsScannerOpen(false);
                    }}
                />
            </div>
        </div>


    );
};