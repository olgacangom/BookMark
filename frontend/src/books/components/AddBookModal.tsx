import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, BookPlus, Search, Loader2, ChevronDown, Save, Camera } from 'lucide-react';
import { BookFormData, bookSchema, BOOK_GENRES } from '../schemas/books.shema';
import axios from 'axios';
import { Book } from '../services/book.service';
import { ScannerModal } from './ScannerModal';

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
      pageCount: 0,
      urlPortada: '',
      isbn:'',
    }
  });

  const currentPortada = watch('urlPortada');

  const handleScanSuccess = (decodedIsbn: string) => {
    const cleanIsbn = decodedIsbn.replace(/[^0-9X]/gi, "");
    setIsbn(cleanIsbn); 
    setValue('isbn', cleanIsbn); 
    setIsScannerOpen(false);
    triggerIsbnSearch(cleanIsbn);
  };

  useEffect(() => {
    if (isOpen) {
      setSearchError(null);
      if (book) {
        setValue('title', book.title);
        setValue('author', book.author);
        setValue('status', book.status as any);
        setValue('genre', (book as any).genre || '');
        setValue('description', (book as any).description || '');
        setValue('pageCount', book.pageCount || 0);
        setValue('urlPortada', (book as any).urlPortada || '');
        setValue('isbn', book.isbn || '');
      } else {
        reset({
          status: 'Want to Read' as any,
          title: '',
          author: '',
          genre: '' as any,
          description: '',
          pageCount: 0,
          urlPortada: ''
        });
        setIsbn('');
      }
    }
  }, [book, isOpen, setValue, reset]);

  if (!isOpen) return null;

  const triggerIsbnSearch = async (targetIsbn: string) => {
    if (!targetIsbn || targetIsbn.length < 10) return;

    setIsSearching(true);
    setSearchError(null);

    try {
      const rawToken = localStorage.getItem('token');
      const token = rawToken?.replace(/"/g, '');

      const response = await axios.get(`http://localhost:3000/books/search/${targetIsbn}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const bookData = response.data;

      setValue('title', bookData.title, { shouldValidate: true });
      const authorName = Array.isArray(bookData.authors) ? bookData.authors.join(', ') : bookData.authors;
      const pages = Number(bookData.pageCount);

      setValue('author', authorName, { shouldValidate: true });
      setValue('description', bookData.description, { shouldValidate: true });
      setValue('urlPortada', bookData.urlPortada, { shouldValidate: true });
      setValue('pageCount', isNaN(pages) ? 0 : pages, { shouldValidate: true });

      if (bookData.genre && BOOK_GENRES.includes(bookData.genre as any)) {
        setValue('genre', bookData.genre as any, { shouldValidate: true });
      }
    } catch (error: any) {
      console.error("Error buscando ISBN: ", error);
      if (error.response?.status === 404) {
        setSearchError("No se encontró ningún libro con ese ISBN");
      } else {
        setSearchError("Error al conectar con el servidor");
      }
    } finally {
      setIsSearching(false);
    }
  };

  const handleOnSubmit = async (data: BookFormData) => {
    try {
      const formattedData = {
        ...data,
        pageCount: Number(data.pageCount)
      };
      await createBook(formattedData);
      reset();
      setIsbn('');
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Error al procesar el libro:", error);
    }
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
            <h2 className="text-2xl font-black text-foreground tracking-tight">
              {isEditing ? 'Editar Libro' : 'Añadir Libro'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-primary/5 rounded-full text-muted-foreground hover:text-primary transition-all"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Búsqueda por ISBN + Cámara */}
        {!isEditing && (
          <div className="px-8 pt-2">
            <div className="flex gap-2 relative group">
              <div className="relative flex-grow">
                <input
                  type="text"
                  value={isbn}
                  onChange={(e) => {
                    setIsbn(e.target.value);
                    if (searchError) setSearchError(null);
                  }}
                  placeholder="ISBN (ej: 97884...)"
                  className={`w-full pl-5 pr-12 py-4 rounded-2xl bg-primary/5 border-2 border-dashed ${searchError ? 'border-destructive bg-destructive/5' : 'border-primary/20'
                    } focus:border-primary focus:bg-white outline-none transition-all text-sm font-medium`}
                />
                {/* Botón de Cámara integrado en el input */}
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-primary/10 text-primary rounded-xl hover:bg-primary hover:text-white transition-all shadow-sm"
                  title="Abrir cámara para escanear"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>

              <button
                type="button"
                onClick={() => triggerIsbnSearch(isbn)}
                disabled={isSearching}
                aria-label="Buscar por ISBN"
                className="p-4 bg-primary text-white rounded-2xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center shadow-lg shadow-primary/20"
              >
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </div>
            {searchError ? (
              <p className="text-destructive text-[10px] font-bold mt-2 ml-4 animate-in slide-in-from-top-1 uppercase italic">
                {searchError}
              </p>
            ) : (
              <p className="text-[10px] text-muted-foreground mt-2 ml-4 font-bold uppercase tracking-tighter italic">
                Búsqueda manual o mediante cámara
              </p>
            )}
          </div>
        )}

        <form onSubmit={handleSubmit(handleOnSubmit)} className="p-8 pt-4 space-y-4 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {currentPortada && (
            <div className="flex justify-center mb-2 animate-in zoom-in duration-300">
              <div className="w-24 h-36 rounded-xl overflow-hidden shadow-lg border-2 border-white">
                <img src={currentPortada} alt="Vista previa" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Título del libro</label>
            <input
              {...register('title')}
              className={`w-full px-5 py-4 rounded-2xl bg-white border-2 ${errors.title ? 'border-destructive' : 'border-transparent'} focus:border-primary outline-none shadow-sm transition-all`}
              placeholder="Ej: El nombre del viento"
            />
            {errors.title && <p className="text-destructive text-[10px] font-bold ml-4 uppercase">{errors.title.message}</p>}
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Autor</label>
            <input
              {...register('author')}
              className={`w-full px-5 py-4 rounded-2xl bg-white border-2 ${errors.author ? 'border-destructive' : 'border-transparent'} focus:border-primary outline-none shadow-sm transition-all`}
              placeholder="Ej: Patrick Rothfuss"
            />
            {errors.author && <p className="text-destructive text-[10px] font-bold ml-4 uppercase">{errors.author.message}</p>}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Estado</label>
              <div className="relative">
                <select
                  {...register('status')}
                  className="w-full pl-3 pr-8 py-4 rounded-2xl bg-white border-2 border-transparent focus:border-primary outline-none shadow-sm appearance-none font-medium text-[13px] transition-all"
                >
                  <option value="Want to Read">Pendiente</option>
                  <option value="Reading">Leyendo</option>
                  <option value="Read">Leído</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/40" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Páginas</label>
              <input
                type="number"
                {...register('pageCount', { valueAsNumber: true })}
                className={`w-full px-4 py-4 rounded-2xl bg-white border-2 ${errors.pageCount ? 'border-destructive' : 'border-transparent'} focus:border-primary outline-none shadow-sm transition-all text-[13px] font-medium`}
                placeholder="0"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Género</label>
              <div className="relative">
                <select
                  {...register('genre')}
                  className={`w-full pl-3 pr-8 py-4 rounded-2xl bg-white border-2 transition-all outline-none shadow-sm appearance-none font-medium text-[13px]
                    ${errors.genre ? 'border-destructive' : 'border-transparent focus:border-primary'}`}
                >
                  <option value="" disabled>Elegir...</option>
                  {BOOK_GENRES.map((g) => (
                    <option key={g} value={g}>{g}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3 h-3 text-primary/40" />
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-black uppercase tracking-widest text-primary ml-2 italic">Sinopsis</label>
            <textarea
              {...register('description')}
              rows={3}
              className="w-full px-5 py-3 rounded-2xl bg-white border-2 border-transparent focus:border-primary outline-none shadow-sm text-sm resize-none transition-all"
              placeholder="Sinopsis del libro..."
            />
          </div>

          <input type="hidden" {...register('urlPortada')} />

          <div className="pt-6 flex gap-4">
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar modal"
              className="flex-1 font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-[2] px-4 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              {isEditing && <Save className="w-4 h-4" />}
              {isEditing ? 'Guardar Cambios' : 'Guardar Libro'}
            </button>
          </div>
        </form>
      </div>

      {/* Modal del Escáner */}
      <ScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  );
};