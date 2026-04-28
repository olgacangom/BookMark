import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { X, Store, Tag, Check } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    book: any; 
    onConfirm: (data: { price: number; inStock: boolean }) => void;
    isEditing?: boolean;
}

export const AddStoreBookModal: React.FC<Props> = ({ isOpen, onClose, book, onConfirm, isEditing = false }) => {
    const { register, handleSubmit, reset } = useForm({
        defaultValues: { price: 0, inStock: true }
    });

    useEffect(() => {
        if (isOpen) {
            if (isEditing && book) {
                reset({
                    price: Number(book.price),
                    inStock: book.inStock
                });
            } else {
                reset({ price: 0, inStock: true });
            }
        }
    }, [isOpen, book, reset, isEditing]);

    if (!isOpen || !book) return null;

    const displayBook = isEditing ? book.book : book;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300 text-left">
            <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-md overflow-hidden border border-slate-100 animate-in zoom-in-95">
                
                <header className="px-8 py-6 border-b border-slate-50 flex justify-between items-center bg-teal-600 text-white">
                    <div className="flex items-center gap-3">
                        <Store size={20} />
                        <h2 className="text-lg font-bold uppercase tracking-tight">
                            {isEditing ? 'Editar Existencias' : 'Añadir al Inventario'}
                        </h2>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/20 rounded-full transition-colors"><X size={20}/></button>
                </header>

                <div className="p-8">
                    <div className="flex items-center gap-4 mb-8 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <img src={displayBook.urlPortada} className="w-12 h-16 object-cover rounded-lg shadow-sm" alt="" />
                        <div>
                            <p className="font-bold text-slate-800 text-sm leading-tight">{displayBook.title}</p>
                            <p className="text-[10px] text-slate-400 font-bold uppercase">{displayBook.author}</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit(onConfirm)} className="space-y-6">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-teal-600 uppercase ml-2 tracking-widest">Precio de Venta (€)</label>
                            <div className="relative">
                                <Tag className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                                <input 
                                    type="number" 
                                    step="0.01"
                                    {...register('price', { required: true, min: 0 })}
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:border-teal-500 outline-none font-bold text-slate-700"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100">
                            <div>
                                <p className="text-xs font-black text-slate-700 uppercase">Stock disponible</p>
                                <p className="text-[10px] text-slate-400 font-medium italic">¿Disponible para compra hoy?</p>
                            </div>
                            <input 
                                type="checkbox" 
                                {...register('inStock')}
                                className="w-6 h-6 rounded-lg border-slate-200 text-teal-600"
                            />
                        </div>

                        <button type="submit" className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-teal-600 transition-all flex items-center justify-center gap-2">
                            <Check size={18} /> {isEditing ? 'Guardar Cambios' : 'Confirmar Alta'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};