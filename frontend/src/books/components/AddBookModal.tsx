import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, BookPlus, Bookmark, ChevronDown, User, Type, Tag, Sparkles } from 'lucide-react';
import { BookFormData, bookSchema, BOOK_GENRES } from '../schemas/books.shema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createBook: (data: BookFormData) => Promise<any>;
}

export const AddBookModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, createBook }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: {
      status: 'Want to Read',
      title: '',   // Es mejor inicializar todo
      author: '',
      genre: '' as any
    }
  });

  if (!isOpen) return null;

  // Esta función SOLO se ejecuta si el formulario es VÁLIDO
  const onSubmit = async (data: BookFormData) => {
    console.log("🚀 Datos enviados al backend:", data);
    try {
      await createBook(data);
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("❌ Error en la petición:", error);
    }
  };

  // Esta función se ejecuta si el formulario es INVÁLIDO
  const onInvalid = (formErrors: any) => {
    console.log("⚠️ Errores de validación:", formErrors);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-primary/10 backdrop-blur-xl p-4 animate-in fade-in duration-300">
      <div className="bg-[#fcfaf8] rounded-[3rem] shadow-2xl shadow-primary/20 w-full max-w-md overflow-hidden border border-white animate-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="p-8 pb-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-xl text-primary">
              <BookPlus className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-black text-foreground tracking-tight">Nuevo Libro</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-full text-muted-foreground hover:text-primary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* CAMBIO AQUÍ: Añadimos onInvalid para ver qué falla en la consola */}
        <form onSubmit={handleSubmit(onSubmit, onInvalid)} className="p-8 pt-4 space-y-5">

          {/* Campo Título */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Título del libro</label>
            <input
              {...register('title')}
              className={`w-full px-5 py-4 rounded-2xl bg-white border-2 ${errors.title ? 'border-destructive' : 'border-transparent'} focus:border-primary outline-none shadow-sm`}
              placeholder="Ej: El nombre del viento"
            />
            {errors.title && <p className="text-destructive text-[10px] font-bold ml-4 uppercase">{errors.title.message}</p>}
          </div>

          {/* Campo Autor */}
          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Autor</label>
            <input
              {...register('author')}
              className={`w-full px-5 py-4 rounded-2xl bg-white border-2 ${errors.author ? 'border-destructive' : 'border-transparent'} focus:border-primary outline-none shadow-sm`}
              placeholder="Ej: Patrick Rothfuss"
            />
            {errors.author && <p className="text-destructive text-[10px] font-bold ml-4 uppercase">{errors.author.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Campo Estado */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Estado</label>
              <div className="relative">
                <select
                  {...register('status')}
                  className="w-full pl-4 pr-10 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-primary outline-none shadow-sm appearance-none font-medium text-sm"
                >
                  <option value="Want to Read">Pendiente</option>
                  <option value="Reading">Leyendo</option>
                  <option value="Read">Leído</option>
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              </div>
            </div>

            {/* Campo Género */}
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Género</label>
              <div className="relative">
                <select
                  {...register('genre')}
                  className={`w-full pl-4 pr-10 py-4 rounded-2xl bg-white border-2 transition-all outline-none shadow-sm appearance-none font-medium text-sm
                    ${errors.genre ? 'border-destructive' : 'border-transparent focus:border-primary'}`}
                >
                  <option value="" disabled>Elegir...</option>
                  {BOOK_GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary/40" />
              </div>
            </div>
          </div>
          {errors.genre && <p className="text-destructive text-[10px] font-bold ml-4 uppercase">{errors.genre.message}</p>}

          <div className="pt-6 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 font-bold text-muted-foreground">Cancelar</button>
            <button
              type="submit"
              className="flex-[2] px-4 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Sparkles className="w-5 h-5" />
              Guardar Libro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};