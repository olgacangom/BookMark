import { useEffect, useState } from 'react';
import { bookService, Book, BookStatus } from '../../books/book.service';
import { BookCard } from '../../components/BookCard';

export const DashboardView = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<BookStatus | 'All'>('All');

  // 1. Cargar los libros al montar el componente
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const data = await bookService.getMyBooks();
        setBooks(data);
      } catch (error) {
        console.error("Error cargando biblioteca:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchBooks();
  }, []);

  // 2. Lógica de filtrado (en memoria, ¡super rápido!)
  const filteredBooks = activeFilter === 'All' 
    ? books 
    : books.filter(b => b.status === activeFilter);

  if (loading) return <div className="p-10 text-center text-gray-500">Abriendo tu biblioteca...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 mb-6">Mi Biblioteca</h1>
          
          {/* 🔍 Barra de Filtros */}
          <nav className="flex flex-wrap gap-3">
            {['All', 'Reading', 'Read', 'Want to Read'].map((status) => (
              <button
                key={status}
                onClick={() => setActiveFilter(status as any)}
                className={`px-6 py-2 rounded-xl text-sm font-bold transition-all border ${
                  activeFilter === status
                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-200'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-indigo-400 hover:text-indigo-600'
                }`}
              >
                {status === 'All' ? 'Todos' : status}
                <span className="ml-2 opacity-60">
                  ({status === 'All' ? books.length : books.filter(b => b.status === status).length})
                </span>
              </button>
            ))}
          </nav>
        </header>

        {/* 📚 Grid de Libros */}
        {filteredBooks.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredBooks.map(book => (
              <BookCard key={book.id} book={book} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-200">
            <p className="text-gray-400 text-lg">No hay libros en esta categoría.</p>
          </div>
        )}
      </div>
    </main>
  );
};