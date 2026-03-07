import { BookOpen, Trash2, Edit3 } from "lucide-react";
import { Book } from "../services/book.service";
import { JSX } from "react";

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (e: React.MouseEvent, book: Book) => void;
  statusInfo: { label: string; icon: JSX.Element; color: string };
}

export const BookCard = ({ book, onEdit, onDelete, statusInfo }: BookCardProps) => {
  return (
    <div
      onClick={() => onEdit(book)}
      className="cursor-pointer group bg-white rounded-[3rem] p-5 shadow-sm hover:shadow-2xl hover:shadow-primary/10 transition-all border border-transparent hover:border-primary/10 flex flex-col h-full relative overflow-hidden"
    >
      {/* Badge de Género */}
      <div className="absolute top-8 left-8 z-10 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.15em] text-primary shadow-sm border border-primary/5">
        {book.genre || 'Otros'}
      </div>

      {/* Botón Borrar */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(e, book)}
        }
        aria-label="Eliminar libro"
        className="absolute top-7 right-7 z-20 bg-rose-500 text-white p-2.5 rounded-2xl shadow-lg opacity-0 group-hover:opacity-100 hover:scale-110 active:scale-90 transition-all duration-300"
      >
        <Trash2 className="w-4 h-4" />
      </button>

      {/* Portada */}
      <div className="relative aspect-[3/4] bg-neutral-100 rounded-[2.5rem] mb-6 flex items-center justify-center group-hover:scale-[1.03] transition-transform duration-500 overflow-hidden shadow-inner">
        {book.urlPortada ? (
          <img src={book.urlPortada} alt={book.title} className="w-full h-full object-cover transition-all duration-500" />
        ) : (
          <span className="text-5xl opacity-30">📖</span>
        )}
        <div className="absolute inset-0 bg-primary/20 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <div className="bg-white/90 p-3 rounded-2xl shadow-xl transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300 text-primary">
            <Edit3 className="w-6 h-6" aria-label="Icono editar"/>
          </div>
        </div>
      </div>

      {/* Info Título y Autor */}
      <div className="px-2 flex-grow">
        <h2 className="font-bold text-l text-foreground leading-[1.2] mb-2 group-hover:text-primary transition-colors line-clamp-2 uppercase tracking-tight">
          {book.title}
        </h2>
        <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mb-2 opacity-60">
          {book.author}
        </p>
        
        {book.pageCount !== undefined && book.pageCount > 0 && (
          <div className="flex items-center gap-1.5 text-gray-400 mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[11px] font-bold tracking-tight">{book.pageCount} PÁGINAS</span>
          </div>
        )}
      </div>

      {/* Badge de Estado */}
      <div className={`flex items-center gap-2.5 px-5 py-3 rounded-2xl border transition-colors ${statusInfo.color}`}>
        {statusInfo.icon}
        <span className="text-[10px] font-black uppercase tracking-widest">{statusInfo.label}</span>
      </div>
    </div>
  );
};