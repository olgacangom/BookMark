import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Tag, Check, BookPlus } from 'lucide-react';
import { BookFormData, bookSchema, BOOK_GENRES } from '../../books/schemas/books.shema';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    book: any;
    onConfirm: (data: BookFormData) => void;
    isEditing?: boolean;
}

export const AddStoreBookModal: React.FC<Props> = ({ isOpen, onClose, book, onConfirm, isEditing = false }) => {
    const { register, handleSubmit, reset, watch } = useForm<BookFormData>({
        resolver: zodResolver(bookSchema),
        defaultValues: { price: 0, inStock: true, pageCount: 0 }
    });

    const currentPortada = watch('urlPortada');

    useEffect(() => {
        if (isOpen && book) {
            const b = isEditing ? book.book : book;
            reset({
                title: b.title,
                author: b.author,
                genre: b.genre || '',
                description: b.description || '',
                pageCount: b.pageCount || 0,
                urlPortada: b.urlPortada || '',
                isbn: b.isbn || '',
                price: Number(book.price || 0),
                inStock: book.inStock ?? true,
                status: b.status || 'Read'
            });
        }
    }, [isOpen, book, isEditing, reset]);

    if (!isOpen || !book) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300 text-left">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-200 animate-in zoom-in-95">

                <header className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-teal-600 text-white">
                    <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                        {isEditing ? <Check size={24} /> : <BookPlus size={24} />}
                        {isEditing ? 'Editar Inventario' : 'Añadir al Inventario'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20} /></button>
                </header>

                <form onSubmit={handleSubmit(onConfirm)} className="p-8 space-y-6 max-h-[75vh] overflow-y-auto custom-scrollbar">

                    <div className="flex gap-6">
                        <div className="w-24 aspect-[2/3] bg-slate-100 rounded-xl border border-slate-200 overflow-hidden shadow-inner shrink-0">
                            {currentPortada ? <img src={currentPortada} className="w-full h-full object-cover" alt="portada" /> : <div className="h-full flex items-center justify-center text-[8px] font-black text-slate-300">SIN FOTO</div>}
                        </div>
                        <div className="flex-1 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Título</label>
                                <input {...register('title')} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-bold text-slate-400 uppercase">Autor</label>
                                <input {...register('author')} required className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-bold" />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">URL Portada</label>
                            <input {...register('urlPortada')} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Género</label>
                            <select {...register('genre')} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold">
                                <option value="">Varios...</option>
                                {BOOK_GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Páginas</label>
                        <input type="number" {...register('pageCount', { valueAsNumber: true })} className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 text-sm font-bold" />
                    </div>

                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Descripción</label>
                        <textarea {...register('description')} rows={3} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-4 text-sm font-medium" />
                    </div>

                    {/* PRECIO Y STOCK */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100">
                            <label className="text-[10px] font-black text-emerald-700 uppercase block mb-1"><Tag size={12} className="inline" /> Precio (€)</label>
                            <input type="number" step="0.01" {...register('price', { valueAsNumber: true })} required className="w-full bg-white border border-emerald-200 rounded-xl px-4 py-2 font-black" />
                        </div>
                        <div className="p-4 bg-teal-50 rounded-2xl border border-teal-100 flex items-center justify-between">
                            <span className="text-[10px] font-black text-teal-700 uppercase">En Stock</span>
                            <input type="checkbox" {...register('inStock')} className="w-6 h-6 rounded border-teal-300 text-teal-600" />
                        </div>
                    </div>

                    <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase hover:bg-teal-600 transition-all">
                        {isEditing ? 'Guardar Cambios' : 'Confirmar Alta'}
                    </button>
                </form>
            </div>
        </div>
    );
};