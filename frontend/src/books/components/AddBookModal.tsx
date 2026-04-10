import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, BookPlus, Loader2, Save, Camera, Sparkles, Star, AlertCircle } from 'lucide-react'; 
import { BookFormData, bookSchema, BOOK_GENRES } from '../schemas/books.shema';
import axios from 'axios';
import { Book } from '../services/book.service';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    createBook: (data: BookFormData) => Promise<any>;
    book?: Book | null;
}

export const AddBookModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, createBook, book }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [isbn, setIsbn] = useState('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const isEditing = !!book;

    const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<BookFormData>({
        resolver: zodResolver(bookSchema),
        defaultValues: {
            status: 'Want to Read' as any,
            title: '',
            author: '',
            genre: '' as any,
            description: '', 
            review: '',      
            pageCount: 0,
            urlPortada: '',
            isbn: '',
            rating: 0,
        }
    });

    const currentStatus = watch('status');
    const currentRating = watch('rating') || 0;
    const currentPortada = watch('urlPortada');

    useEffect(() => {
        if (isOpen) {
            setSearchError(null);
            if (book) {
                reset({
                    title: book.title,
                    author: book.author,
                    status: book.status as any,
                    genre: (book as any).genre || '',
                    description: (book as any).description || '',
                    review: (book as any).review || '',
                    pageCount: book.pageCount || 0,
                    urlPortada: (book as any).urlPortada || '',
                    isbn: book.isbn || '',
                    rating: (book as any).rating || 0,
                });
            } else {
                reset({
                    status: 'Want to Read' as any, title: '', author: '', genre: '' as any,
                    description: '', review: '', pageCount: 0, urlPortada: '', isbn: '', rating: 0
                });
                setIsbn('');
            }
        }
    }, [book, isOpen, reset]);

    const triggerIsbnSearch = async (targetIsbn: string) => {
        const cleanIsbn = targetIsbn.replace(/[-\s]/g, "");
        if (!cleanIsbn || cleanIsbn.length < 10) return;

        setIsSearching(true);
        setSearchError(null);

        try {
            const rawToken = localStorage.getItem('token');
            const token = rawToken?.replace(/"/g, '');

            const response = await axios.get(`${import.meta.env.VITE_API_URL}/books/search/${cleanIsbn}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });

            const bookData = response.data;
            setValue('title', bookData.title, { shouldValidate: true });
            setValue('author', Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors, { shouldValidate: true });
            setValue('description', bookData.description, { shouldValidate: true });
            setValue('urlPortada', bookData.urlPortada, { shouldValidate: true });
            setValue('pageCount', Number(bookData.pageCount) || 0, { shouldValidate: true });

            if (bookData.genre && BOOK_GENRES.includes(bookData.genre as any)) {
                setValue('genre', bookData.genre as any, { shouldValidate: true });
            }
        } catch (error: any) {
            if (error.response?.status === 404) {
                setSearchError("Este libro no figura en nuestro archivo.");
            } else {
                setSearchError("Error de conexión con el servidor.");
            }
        } finally {
            setIsSearching(false);
        }
    };

    const handleSetRating = (val: number) => {
        setValue('rating', val, { shouldValidate: true });
    };

    const handleOnSubmit = async (data: BookFormData) => {
        try {
            await createBook({
                ...data,
                pageCount: Number(data.pageCount),
                rating: data.status === 'Read' ? Number(data.rating) : 0
            });
            onSuccess();
            onClose();
        } catch (e) { console.error(e); }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-xl overflow-hidden border border-slate-200 animate-in zoom-in-95 duration-200">

                <header className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-11 h-11 bg-teal-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-teal-600/20">
                            {isEditing ? <Save size={20} /> : <BookPlus size={20} />}
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-900 leading-none">
                                {isEditing ? 'Editar Volumen' : 'Añadir a Biblioteca'}
                            </h2>
                            <p className="text-xs text-slate-400 font-medium mt-1">Colección Personal</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full text-slate-400 transition-colors">
                        <X size={20} />
                    </button>
                </header>

                <div className="p-8">
                    {isScannerOpen && (
                        <div className="mb-6 p-4 bg-slate-900 rounded-2xl text-white text-center animate-in slide-in-from-top-4">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold uppercase tracking-widest">Scanner Activo</span>
                                <button onClick={() => setIsScannerOpen(false)}><X size={14}/></button>
                            </div>
                            <div className="aspect-video bg-slate-800 rounded-lg border-2 border-dashed border-teal-500 flex items-center justify-center">
                                <Camera className="animate-pulse text-teal-500" />
                            </div>
                        </div>
                    )}

                    {!isEditing && (
                        <div className="mb-8">
                            <label className="flex items-center gap-2 text-[10px] font-bold text-teal-600 uppercase tracking-widest mb-3">
                                <Sparkles size={14} className="animate-pulse" /> Sincronización ISBN
                            </label>
                            <div className="flex gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200 focus-within:bg-white focus-within:border-teal-500 transition-all">
                                <input type="text" value={isbn} onChange={(e) => setIsbn(e.target.value)} placeholder="978..." className="flex-1 bg-transparent border-none focus:ring-0 text-sm font-bold px-3 text-slate-700" />
                                <button type="button" onClick={() => setIsScannerOpen(true)} className="p-2.5 bg-white text-slate-600 rounded-xl shadow-sm hover:text-teal-600 border border-slate-200"><Camera size={18} /></button>
                                <button type="button" onClick={() => triggerIsbnSearch(isbn)} disabled={isSearching || isbn.length < 10} className="px-5 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-teal-600 transition-all">
                                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : "BUSCAR"}
                                </button>
                            </div>
                            {searchError && (
                                <div className="mt-2 flex items-center gap-2 text-rose-500 text-[10px] font-bold animate-in fade-in">
                                    <AlertCircle size={12} /> {searchError}
                                </div>
                            )}
                        </div>
                    )}

                    <form onSubmit={handleSubmit(handleOnSubmit)} className="space-y-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">

                        <div className="flex flex-col sm:flex-row gap-6">
                            <div className="w-full sm:w-24 flex-shrink-0">
                                <div className="aspect-[2/3] w-full bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                    {currentPortada ? <img src={currentPortada} className="w-full h-full object-cover" alt="Portada" /> : <div className="h-full flex items-center justify-center text-slate-300 font-bold text-[8px]">SIN IMAGEN</div>}
                                </div>
                            </div>
                            <div className="flex-1 space-y-4">
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Título</label>
                                    <input {...register('title')} className={`w-full bg-white border ${errors.title ? 'border-rose-500' : 'border-slate-200'} rounded-xl py-2 px-4 text-sm font-bold text-slate-900 focus:border-teal-500 outline-none`} />
                                    {errors.title && <span className="text-[9px] text-rose-500 font-bold uppercase">{errors.title.message}</span>}
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[10px] font-bold text-slate-400 uppercase">Autor</label>
                                    <input {...register('author')} className={`w-full bg-white border ${errors.author ? 'border-rose-500' : 'border-slate-200'} rounded-xl py-2 px-4 text-sm font-semibold text-slate-600 focus:border-teal-500 outline-none`} />
                                    {errors.author && <span className="text-[9px] text-rose-500 font-bold uppercase">{errors.author.message}</span>}
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Estado</label>
                                <select {...register('status')} className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none">
                                    <option value="Want to Read">Pendiente</option>
                                    <option value="Reading">Leyendo</option>
                                    <option value="Read">Completado</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Género</label>
                                <select {...register('genre')} className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none">
                                    <option value="">Varios...</option>
                                    {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] font-bold text-slate-500 uppercase">Páginas</label>
                                <input type="number" {...register('pageCount', { valueAsNumber: true })} className="w-full bg-white border border-slate-200 rounded-lg text-xs font-bold p-2 outline-none" />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Descripción / Sinopsis</label>
                            <textarea
                                {...register('description')}
                                rows={3}
                                className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl text-sm font-medium text-slate-600 p-4 resize-none focus:bg-white focus:border-teal-500 transition-all shadow-inner"
                                placeholder="Resumen de la trama..."
                            />
                        </div>

                        {currentStatus === 'Read' && (
                            <div className="p-6 bg-teal-50/50 border border-teal-100 rounded-[2rem] space-y-6 animate-in slide-in-from-top-4 duration-500">
                                <div className="flex flex-col items-center gap-3">
                                    <label className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Tu Calificación</label>
                                    <div className="flex gap-2">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                type="button"
                                                onClick={() => handleSetRating(star)}
                                                className="transition-transform active:scale-90 hover:scale-110"
                                            >
                                                <Star
                                                    size={32}
                                                    className={`${star <= currentRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200 hover:text-amber-200'}`}
                                                    strokeWidth={star <= currentRating ? 1 : 2}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                    <span className="text-[10px] font-black text-teal-600 uppercase">
                                        {currentRating === 5 ? '¡Obra Maestra!' : currentRating === 4 ? 'Muy bueno' : currentRating === 3 ? 'Entretenido' : currentRating === 2 ? 'Pasable' : currentRating === 1 ? 'No me gustó' : 'Selecciona una puntuación'}
                                    </span>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-[10px] font-bold text-teal-700 uppercase tracking-widest">Comentario Personal / Crítica</label>
                                    <textarea
                                        {...register('review')}
                                        rows={3}
                                        className="w-full bg-white border border-teal-100 rounded-2xl text-sm font-medium text-slate-600 p-4 resize-none focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500 transition-all shadow-sm"
                                        placeholder="¿Qué te ha parecido el final? ¿Lo recomendarías?"
                                    />
                                </div>
                            </div>
                        )}

                        <footer className="pt-6 flex items-center justify-between border-t border-slate-100">
                            <button type="button" onClick={onClose} className="text-xs font-bold text-slate-400 hover:text-slate-600 uppercase tracking-widest px-4">Cancelar</button>
                            <button type="submit" className="px-8 py-3.5 bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white rounded-xl font-bold text-xs uppercase tracking-widest shadow-lg shadow-teal-500/30 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
                                {isEditing ? <Save size={18} /> : <BookPlus size={18} />}
                                {isEditing ? 'GUARDAR CAMBIOS' : 'AÑADIR LIBRO'}
                            </button>
                        </footer>
                    </form>
                </div>
            </div>
        </div>
    );
};