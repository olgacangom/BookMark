import { Book } from "../books/book.service";

export const BookCard = ({ book }: { book: Book }) => {
  // 🎨 Mapeo de colores según el estado
  const badgeStyles = {
    'Read': 'bg-green-100 text-green-700 border-green-200',
    'Reading': 'bg-blue-100 text-blue-700 border-blue-200',
    'Want to Read': 'bg-amber-100 text-amber-700 border-amber-200'
  };

  return (
    <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
      <div>
        <h3 className="font-bold text-gray-900 text-lg leading-tight mb-1">{book.title}</h3>
        <p className="text-gray-500 text-sm mb-4">{book.author}</p>
      </div>
      
      <div className="flex items-center">
        <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeStyles[book.status]}`}>
          {book.status}
        </span>
      </div>
    </div>
  );
};