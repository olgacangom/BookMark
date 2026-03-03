import { useEffect, useState } from 'react';
import { bookService, Book, BookStatus } from '../../books/services/book.service';
import { BookCard } from '../../books/components/BookCard';
import { AddBookModal } from '../../books/components/AddBookModal';

export const DashboardView = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState<BookStatus | 'All'>('All');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadBooks = async () => {
    try {
      const data = await bookService.getMyBooks();
      setBooks(data);
    } catch (error) {
      console.error("Error cargando biblioteca:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBooks(); }, []);

  const filteredBooks = activeFilter === 'All' 
    ? books 
    : books.filter(b => b.status === activeFilter);

  if (loading) return (
    <div className="flex h-screen items-center justify-center bg-gray-50">
      <div className="animate-pulse text-indigo-600 font-medium">Abriendo tu biblioteca...</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-12">
      {/* 1. Header / Navbar Simple */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-500 p-1.5 rounded-lg">
            <span className="text-white text-xl">📖</span>
          </div>
          <span className="font-bold text-gray-800 text-lg">Biblioteca Virtual</span>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setIsModalOpen(true)}
            className="hidden md:block bg-indigo-600 text-white px-5 py-2 rounded-xl font-semibold hover:bg-indigo-700 transition-all shadow-md shadow-indigo-100"
          >
            + Añadir Libro
          </button>
          <div className="w-10 h-10 bg-gray-200 rounded-full border-2 border-white shadow-sm overflow-hidden">
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 pt-8">
        
        {/* 2. Banner de Bienvenida (Estilo Imagen 2) */}
        <div className="relative overflow-hidden bg-gradient-to-r from-blue-400 to-cyan-300 rounded-[2rem] p-8 mb-8 text-white shadow-lg shadow-blue-100">
          <div className="relative z-10">
            <h1 className="text-4xl font-extrabold mb-2">¡Hola, Usuario! ✨</h1>
            <p className="opacity-90 text-lg">Tu espacio literario te espera</p>
          </div>
          {/* Decoración abstracta de fondo */}
          <div className="absolute top-[-20%] right-[-5%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
        </div>

        {/* 3. Stats Rápidas */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <StatCard icon="🔥" label="Días seguidos" value="5" color="bg-orange-50 text-orange-600" />
          <StatCard icon="📚" label="Libros en total" value={books.length.toString()} color="bg-blue-50 text-blue-600" />
          <StatCard icon="🏆" label="Logros" value="1" color="bg-yellow-50 text-yellow-600" />
        </div>

        {/* 4. Sección de Filtros y Contenido Principal */}
        <div className="flex flex-col lg:flex-row gap-8">
          
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-800">Tu Colección</h2>
              {/* Filtros estilo chips */}
              <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                {['All', 'Reading', 'Read', 'Want to Read'].map((f) => (
                  <button
                    key={f}
                    onClick={() => setActiveFilter(f as any)}
                    className={`px-4 py-1.5 rounded-full text-sm font-bold whitespace-nowrap transition-all ${
                      activeFilter === f 
                        ? 'bg-indigo-600 text-white shadow-md' 
                        : 'bg-white text-gray-500 hover:bg-gray-100'
                    }`}
                  >
                    {f === 'All' ? 'Todos' : f}
                  </button>
                ))}
              </div>
            </div>

            {/* Grid de Libros */}
            {filteredBooks.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredBooks.map(book => (
                  <BookCard key={book.id} book={book} />
                ))}
              </div>
            ) : (
              /* Empty State (Estilo Imagen 2 "Leyendo Ahora") */
              <div className="bg-white rounded-[2rem] p-12 text-center border border-gray-100 shadow-sm flex flex-col items-center justify-center">
                <div className="bg-purple-50 text-purple-400 p-6 rounded-3xl mb-4 text-5xl">📖</div>
                <p className="text-gray-400 text-lg font-medium">No hay libros aquí todavía</p>
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="mt-4 text-indigo-600 font-bold hover:underline"
                >
                  Explorar libros →
                </button>
              </div>
            )}
          </div>

          {/* 5. Sidebar Derecha (Estilo Imagen 2) */}
          <aside className="w-full lg:w-80 space-y-6">
            <div className="bg-white rounded-[2rem] p-6 shadow-sm border border-gray-50">
              <h3 className="font-bold text-gray-800 mb-4 flex justify-between items-center">
                Retos Activos <span className="text-indigo-600 text-xs cursor-pointer">Ver todos →</span>
              </h3>
              <div className="space-y-4">
                <ChallengeItem title="Reto 2026" progress={25} target="Lee 12 libros" />
                <ChallengeItem title="Racha de Lectura" progress={50} target="Lee 30 días" />
              </div>
            </div>
          </aside>
        </div>
      </main>

      <AddBookModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={loadBooks}
        createBook={(data) => bookService.create(data)}
      />

      {/* Botón flotante para móvil */}
      <button 
        onClick={() => setIsModalOpen(true)}
        className="md:hidden fixed bottom-6 right-6 bg-indigo-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center text-2xl z-20"
      >
        +
      </button>
    </div>
  );
};

// Componentes auxiliares para el diseño
const StatCard = ({ icon, label, value, color }: any) => (
  <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-gray-50 flex items-center gap-4 transition-transform hover:scale-[1.02]">
    <div className={`w-12 h-12 ${color} rounded-2xl flex items-center justify-center text-2xl`}>
      {icon}
    </div>
    <div>
      <div className="text-2xl font-black text-gray-800">{value}</div>
      <div className="text-gray-400 text-xs font-medium uppercase tracking-wider">{label}</div>
    </div>
  </div>
);

const ChallengeItem = ({ title, progress, target }: any) => (
  <div className="p-3 rounded-2xl bg-gray-50/50">
    <div className="flex justify-between text-sm mb-2">
      <span className="font-bold text-gray-700">{title}</span>
      <span className="text-indigo-600 font-bold">{progress}%</span>
    </div>
    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
      <div className="bg-indigo-500 h-full" style={{ width: `${progress}%` }}></div>
    </div>
    <p className="text-[10px] text-gray-400 mt-2 italic">{target}</p>
  </div>
);