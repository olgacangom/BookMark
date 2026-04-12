import { BookOpen, Star, Trash2 } from "lucide-react";
import { JSX } from "react";
import { Book } from "../services/book.service";

interface BookCardProps {
  book: Book;
  onEdit: (book: Book) => void;
  onDelete: (e: React.MouseEvent, book: Book) => void;
  statusInfo: { label: string; icon: JSX.Element; color: string };
  onOpenNotes: (book: Book) => void;
}

export const BookCard = ({ book, onEdit, onDelete, statusInfo, onOpenNotes }: BookCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Reading': return 'bg-sky-500/90';
      case 'Read': return 'bg-emerald-500/90';
      case 'Want to Read': return 'bg-amber-500/90';
      default: return 'bg-slate-500/90';
    }
  };

  const currentRating = Number(book.rating) || 0;

  return (
    <article className="group bg-white/80 backdrop-blur-xl rounded-2xl p-4 shadow-lg border border-slate-200/50 hover:shadow-xl transition-all flex flex-col h-full relative">
      <button
        type="button"
        onClick={() => onEdit(book)}
        className="absolute inset-0 w-full h-full cursor-pointer z-0 border-none bg-transparent"
      />

      <div className="relative aspect-[2/3] bg-slate-100 rounded-xl mb-4 overflow-hidden shadow-md group-hover:scale-[1.02] transition-transform duration-500 pointer-events-none">
        {book.urlPortada ? (
          <img src={book.urlPortada} alt={book.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-slate-200 text-slate-400 font-bold text-2xl">
            {book.title.charAt(0)}
          </div>
        )}
        <div className="absolute top-2 right-2 z-10">
          <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-lg backdrop-blur-md text-white ${getStatusColor(book.status)}`}>
             {statusInfo.icon}
          </div>
        </div>
      </div>

      <div className="flex-1 px-1 pointer-events-none">
        <div className="mb-2">
          <span className="bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border border-teal-100">
            {book.genre || 'General'}
          </span>
        </div>
        <h2 className="font-bold text-sm text-slate-900 leading-tight mb-1 line-clamp-2 uppercase group-hover:text-teal-600 transition-colors">
          {book.title}
        </h2>
        <p className="text-slate-500 text-xs font-medium mb-3">{book.author}</p>
      </div>

      <div className="mt-auto pt-3 border-t border-slate-100 flex items-center justify-between pointer-events-none">
        {book.pageCount ? (
          <div className="flex items-center gap-1.5 text-slate-400">
            <BookOpen className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold">{book.pageCount} PP.</span>
          </div>
        ) : <div />}
        
        {book.status === 'Read' && (
           <div className="flex items-center gap-0.5">
             {[1, 2, 3, 4, 5].map((star) => (
               <Star 
                 key={star} 
                 size={10} 
                 className={`${star <= currentRating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
               />
             ))}
           </div>
        )}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onDelete(e, book);
          onOpenNotes(book);
        }}
        className="absolute top-2 left-2 z-20 bg-white/90 text-slate-400 p-2 rounded-full shadow-md opacity-0 group-hover:opacity-100 hover:text-rose-500 hover:bg-rose-50 transition-all duration-200"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </article>
  );
};