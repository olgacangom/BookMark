import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { BookFormData, bookSchema } from '../schemas/books.shema';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  createBook: (data: BookFormData) => Promise<any>;
}

export const AddBookModal: React.FC<Props> = ({ isOpen, onClose, onSuccess, createBook }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<BookFormData>({
    resolver: zodResolver(bookSchema),
    defaultValues: { status: 'Want to Read' }
  });

  if (!isOpen) return null;

  const onSubmit = async (data: BookFormData) => {
    try {
      await createBook(data);
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al crear el libro:", error);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Añadir nuevo libro</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">✕</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
            <input 
              {...register('title')}
              className={`w-full px-4 py-2 rounded-lg border ${errors.title ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-500 outline-none`}
              placeholder="Ej: El nombre del viento"
            />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Autor</label>
            <input 
              {...register('author')}
              className={`w-full px-4 py-2 rounded-lg border ${errors.author ? 'border-red-500' : 'border-gray-200'} focus:ring-2 focus:ring-indigo-500 outline-none`}
              placeholder="Ej: Patrick Rothfuss"
            />
            {errors.author && <p className="text-red-500 text-xs mt-1">{errors.author.message}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Estado de lectura</label>
            <select 
              {...register('status')}
              className="w-full px-4 py-2 rounded-lg border border-gray-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
            >
              <option value="Want to Read">Pendiente (Want to Read)</option>
              <option value="Reading">Leyendo (Reading)</option>
              <option value="Read">Leído (Read)</option>
            </select>
          </div>

          <div className="pt-4 flex gap-3">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold shadow-lg shadow-indigo-100 transition-all"
            >
              Guardar Libro
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};