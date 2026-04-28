import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { X, BookPlus, Loader2, Sparkles, Tag, Check, AlertCircle } from 'lucide-react';
import api from '../../services/api';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export const CreateStoreBookModal: React.FC<Props> = ({ isOpen, onClose, onSuccess }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [isbn, setIsbn] = useState('');
    const [submitError, setSubmitError] = useState<string | null>(null);

    const { register, handleSubmit, setValue, watch, reset } = useForm({
        defaultValues: {
            title: '', author: '', genre: '', description: '',
            pageCount: 0, urlPortada: '', isbn: '',
            price: 0, inStock: true
        }
    });

    useEffect(() => {
        if (isOpen) {
            reset({
                title: '', author: '', genre: '', description: '',
                pageCount: 0, urlPortada: '', isbn: '',
                price: 0, inStock: true
            });
            setIsbn('');
            setSubmitError(null);
        }
    }, [isOpen, reset]);

    const currentPortada = watch('urlPortada');

    const triggerIsbnSearch = async (targetIsbn: string) => {
        const cleanIsbn = targetIsbn.replace(/[-\s]/g, "");
        if (cleanIsbn.length < 10) return;
        setIsSearching(true);
        setSubmitError(null);
        try {
            const res = await api.get(`/books/search/${cleanIsbn}`);
            const b = res.data;
            setValue('title', b.title);
            setValue('author', Array.isArray(b.authors) ? b.authors.join(', ') : b.authors);
            setValue('description', b.description);
            setValue('urlPortada', b.urlPortada);
            setValue('pageCount', b.pageCount);
            setValue('isbn', cleanIsbn);
        } catch {
            console.error("No encontrado");
        } finally {
            setIsSearching(false);
        }
    };

    const handleOnSubmit = async (data: any) => {
        setSubmitError(null);
        try {
            const { price, inStock, ...bookData } = data;

            const bookRes = await api.post('/books', {
                ...bookData,
                isbn: bookData.isbn || isbn,
                pageCount: Number(bookData.pageCount) || 0,
                status: 'Want to Read' 
            });

            await api.post(`/librero/inventory/${bookRes.data.id}`, {
                price: Number(price),
                inStock: Boolean(inStock)
            });

            onSuccess();
            onClose();
        } catch (e: any) {
            const message = e.response?.data?.message || "Error al publicar el ejemplar";
            setSubmitError(Array.isArray(message) ? message[0] : message);
            console.error("Error capturado:", e.response?.data);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[250] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-300 text-left">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">
                <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-teal-600 text-white">
                    <div className="flex items-center gap-4">
                        <BookPlus size={24} />
                        <h2 className="text-xl font-black uppercase tracking-tight">Alta de Nuevo Libro</h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
                </header>

                <form onSubmit={handleSubmit(handleOnSubmit)} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 flex gap-2 items-end">
                        <div className="flex-1">
                            <label className="flex items-center gap-2 text-[10px] font-black text-teal-600 uppercase mb-2"><Sparkles size={14} /> ISBN</label>
                            <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978..." className="w-full bg-white border border-slate-200 rounded-xl px-4 py-2 text-sm font-bold shadow-sm outline-none" />
                        </div>
                        <button type="button" onClick={() => triggerIsbnSearch(isbn)} className="h-10 px-6 bg-slate-900 text-white rounded-xl font-black text-xs uppercase hover:bg-teal-600 transition-all">
                            {isSearching ? <Loader2 size={16} className="animate-spin" /> : "BUSCAR"}
                        </button>
                    </div>

                    <div className="flex gap-6">
                        <div className="w-24 aspect-[2/3] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shrink-0 shadow-inner">
                            {currentPortada ? <img src={currentPortada} className="w-full h-full object-cover" alt="Portada" /> : <div className="h-full flex items-center justify-center text-[10px] font-black text-slate-300">SIN FOTO</div>}
                        </div>
                        <div className="flex-1 space-y-3">
                            <input {...register('title', { required: true })} placeholder="Título" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold" />
                            <input {...register('author', { required: true })} placeholder="Autor" className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
                            <label className="flex items-center gap-2 text-[10px] font-black text-emerald-700 uppercase tracking-widest mb-2"><Tag size={14} /> Precio (€)</label>
                            <input type="number" step="0.01" {...register('price', { required: true })} className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 text-lg font-black text-emerald-900 outline-none" />
                        </div>
                        <div className="p-4 bg-teal-50 border border-teal-100 rounded-2xl flex flex-col justify-center">
                            <label className="text-[10px] font-black text-teal-700 uppercase tracking-widest mb-2">Stock</label>
                            <label className="flex items-center gap-3 cursor-pointer">
                                <input type="checkbox" {...register('inStock')} className="w-5 h-5 rounded border-teal-300 text-teal-600 focus:ring-teal-500" />
                                <span className="text-xs font-bold text-teal-800">Disponible</span>
                            </label>
                        </div>
                    </div>

                    {submitError && (
                        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 animate-in slide-in-from-bottom-2">
                            <AlertCircle size={20} className="shrink-0" />
                            <p className="text-xs font-black uppercase tracking-tight leading-tight">
                                {submitError}
                            </p>
                        </div>
                    )}

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2">
                        <Check size={18} /> Publicar y añadir al catálogo
                    </button>
                </form>
            </div>
        </div>
    );
};