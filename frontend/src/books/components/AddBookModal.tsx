import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, BookPlus, Loader2, Save, Star, AlertCircle, Camera } from 'lucide-react';
import { BookFormData, bookSchema, BOOK_GENRES } from '../schemas/books.shema';
import axios from 'axios';
import { Book } from '../services/book.service';
import { ScannerModal } from './ScannerModal';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    onError: (message: string) => void;
    createBook: (data: BookFormData) => Promise<any>;
    book?: Book | null;
}

export const AddBookModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, onError, createBook, book }) => {
    const [isSearching, setIsSearching] = useState(false);
    const [isbn, setIsbn] = useState('');
    const [searchError, setSearchError] = useState<string | null>(null);
    const [isScannerOpen, setIsScannerOpen] = useState(false);

    const isEditing = !!book;

    const { register, handleSubmit, reset, setValue, watch } = useForm<BookFormData>({
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
        } catch (error: any) {
            const msg = error.response?.data?.message || "No se pudo registrar el libro";
            onError(Array.isArray(msg) ? msg[0] : msg);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-3 animate-in fade-in duration-300">

            <div className="bg-white rounded-[2.2rem] shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden border border-slate-200">

                {/* HEADER */}
                <header className="px-5 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/60 shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-600 rounded-xl flex items-center justify-center text-white">
                            {isEditing ? <Save size={16} /> : <BookPlus size={16} />}
                        </div>

                        <div>
                            <h2 className="text-base font-bold text-slate-900">
                                {isEditing ? 'Editar Libro' : 'Añadir Libro'}
                            </h2>
                            <p className="text-[10px] text-slate-400">Colección</p>
                        </div>
                    </div>

                    <button onClick={onClose} className="p-2 hover:bg-slate-200/50 rounded-full">
                        <X size={18} />
                    </button>
                </header>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                    {/* ISBN */}
                    {!isEditing && (
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
                            <label className="text-[10px] font-bold text-teal-600 uppercase">
                                ISBN
                            </label>

                            <div className="flex gap-2">
                                <input
                                    value={isbn}
                                    onChange={(e) => setIsbn(e.target.value)}
                                    placeholder="978..."
                                    className="flex-1 bg-white border border-slate-200 rounded-xl px-3 py-2 text-sm"
                                />
                                <button
                                    type="button"
                                    onClick={() => setIsScannerOpen(true)}
                                    className="p-2 bg-white border border-slate-200 rounded-xl"
                                >
                                    <Camera size={18} />
                                </button>

                                <button
                                    type="button"
                                    onClick={() => triggerIsbnSearch(isbn)}
                                    className="px-4 bg-slate-900 text-white rounded-xl text-xs font-bold"
                                >
                                    {isSearching ? <Loader2 size={14} className="animate-spin" /> : "Buscar"}
                                </button>
                            </div>

                            {searchError && (
                                <p className="text-[10px] text-rose-500 font-bold flex gap-1 items-center">
                                    <AlertCircle size={12} /> {searchError}
                                </p>
                            )}
                        </div>
                    )}

                    {/* LIBRO */}
                    <div className="flex gap-4">

                        {/* PORTADA (FIJA, NO CRECE) */}
                        <div className="w-20 shrink-0">
                            <div className="aspect-[2/3] bg-slate-100 rounded-xl overflow-hidden border">
                                {currentPortada ? (
                                    <img src={currentPortada} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="h-full flex items-center justify-center text-[8px] text-slate-300">
                                        SIN FOTO
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* CAMPOS */}
                        <div className="flex-1 space-y-2">
                            <input
                                {...register('title')}
                                placeholder="Título"
                                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm font-bold"
                            />

                            <input
                                {...register('author')}
                                placeholder="Autor"
                                className="w-full bg-slate-50 border rounded-xl px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    {/* GRID */}
                    <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl border">

                        <select {...register('status')} className="text-xs font-bold p-2 rounded-lg border">
                            <option value="Want to Read">Pendiente</option>
                            <option value="Reading">Leyendo</option>
                            <option value="Read">Leído</option>
                        </select>

                        <select {...register('genre')} className="text-xs font-bold p-2 rounded-lg border">
                            <option value="">Género</option>
                            {BOOK_GENRES.map(g => <option key={g}>{g}</option>)}
                        </select>

                        <input
                            type="number"
                            {...register('pageCount', { valueAsNumber: true })}
                            placeholder="Pág"
                            className="text-xs font-bold p-2 rounded-lg border"
                        />
                    </div>

                    {/* DESCRIPCIÓN */}
                    <textarea
                        {...register('description')}
                        rows={3}
                        placeholder="Sinopsis..."
                        className="w-full bg-slate-50 border rounded-xl p-3 text-sm"
                    />

                    {/* RATING */}
                    {currentStatus === 'Read' && (
                        <div className="bg-teal-50 border border-teal-100 rounded-xl p-4 space-y-3">

                            <div className="flex justify-center gap-1">
                                {[1, 2, 3, 4, 5].map(s => (
                                    <button key={s} type="button" onClick={() => handleSetRating(s)}>
                                        <Star
                                            size={24}
                                            className={s <= currentRating ? 'text-amber-400 fill-amber-400' : 'text-slate-300'}
                                        />
                                    </button>
                                ))}
                            </div>

                            <textarea
                                {...register('review')}
                                rows={2}
                                placeholder="Opinión..."
                                className="w-full bg-white border rounded-xl p-3 text-sm"
                            />
                        </div>
                    )}

                </div>

                {/* FOOTER */}
                <footer className="p-4 border-t bg-white shrink-0">
                    <button
                        type="submit"
                        onClick={handleSubmit(handleOnSubmit)}
                        className="w-full py-3 bg-slate-900 text-white rounded-xl font-bold text-xs uppercase"
                    >
                        {isEditing ? 'GUARDAR' : 'AÑADIR LIBRO'}
                    </button>
                </footer>
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