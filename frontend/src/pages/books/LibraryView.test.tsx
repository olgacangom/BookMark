import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LibraryView } from './LibraryView';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { bookService, Book } from '../../books/services/book.service';

vi.mock('../../books/services/book.service', () => ({
  bookService: { 
    getMyBooks: vi.fn(),
    create: vi.fn().mockResolvedValue({ id: 123 })
  }
}));

vi.mock('../../books/components/AddBookModal', () => ({
  AddBookModal: (props: any) => {
    if (!props.isOpen) return null;
    return (
      <div data-testid="mock-modal">
        <h2 role="heading">Nuevo Libro</h2>
        <button onClick={props.onClose}>Cerrar Modal</button>
        <button onClick={() => props.onSuccess()}>Éxito Modal</button>
        <button onClick={() => props.createBook({ title: 'Test' })}>Mock Create</button>
      </div>
    );
  }
}));

describe('LibraryView Coverage 100%', () => {
  const mockBooks: Book[] = [
    { id: 1, title: 'B-Libro', author: 'Autor B', status: 'Reading', updatedAt: '2026-01-01', genre: 'Fantasía', coverUrl: '' },
    { id: 2, title: 'A-Libro', author: 'Autor A', status: 'Read', updatedAt: '2026-01-02', genre: 'Aventura', coverUrl: '' },
    { id: 3, title: 'C-Libro', author: 'Autor C', status: 'Want to Read', updatedAt: '2026-01-03', genre: 'Terror', coverUrl: '' },
    { id: 4, title: 'D-Libro', author: 'Autor D', status: 'Unknown' as any, updatedAt: '2026-01-04', genre: '', coverUrl: '' }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(bookService.getMyBooks).mockResolvedValue(mockBooks);
  });

  const renderView = () => render(
    <AuthProvider>
      <BrowserRouter>
        <LibraryView />
      </BrowserRouter>
    </AuthProvider>
  );

  it('debe renderizar estados y el género por defecto', async () => {
    renderView();
    
    const leyendoTags = await screen.findAllByText(/Leyendo/i);
    expect(leyendoTags.length).toBeGreaterThan(0);
    
    expect(screen.getByText(/Sin estado/i)).toBeInTheDocument();

    expect(screen.getByText('Otros')).toBeInTheDocument();
  });

  it('debe filtrar por búsqueda y por estado', async () => {
    renderView();
    await screen.findByText(/Mi Biblioteca/i);

    const searchInput = screen.getByPlaceholderText(/Buscar por título/i);
    fireEvent.change(searchInput, { target: { value: 'A-Libro' } });
    expect(screen.getByText('A-Libro')).toBeInTheDocument();
    expect(screen.queryByText('B-Libro')).not.toBeInTheDocument();

    fireEvent.change(searchInput, { target: { value: '' } });
    const filterSelect = screen.getByDisplayValue(/Todos los estados/i);
    fireEvent.change(filterSelect, { target: { value: 'Read' } });
    expect(screen.queryByText('B-Libro')).not.toBeInTheDocument();
  });

  it('debe ejecutar la ordenación', async () => {
    renderView();
    await screen.findByText(/Mi Biblioteca/i);
    const sortSelect = screen.getByDisplayValue(/Añadidos recientemente/i);
    
    fireEvent.change(sortSelect, { target: { value: 'title' } });
    expect(sortSelect).toHaveValue('title');

    fireEvent.change(sortSelect, { target: { value: 'author' } });
    expect(sortSelect).toHaveValue('author');
  });

  it('debe manejar el ciclo de vida del modal y la prop createBook ', async () => {
    renderView();
    await screen.findByText(/Mi Biblioteca/i);
    const openBtn = screen.getByRole('button', { name: /Añadir Nuevo Libro/i });
    
    fireEvent.click(openBtn);
    
    fireEvent.click(screen.getByText('Mock Create'));
    expect(bookService.create).toHaveBeenCalled();

    fireEvent.click(screen.getByText('Éxito Modal'));
    await waitFor(() => {
      expect(bookService.getMyBooks).toHaveBeenCalledTimes(2);
    });

    fireEvent.click(openBtn);
    fireEvent.click(screen.getByText('Cerrar Modal'));
    expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();
  });

  it('debe mostrar el EmptyState y sus ramas', async () => {
    vi.mocked(bookService.getMyBooks).mockResolvedValue([]);
    renderView();
    expect(await screen.findByText(/Tu estantería te espera/i)).toBeInTheDocument();
    
    const addBtn = screen.getByText(/Añadir mi primer libro/i);
    fireEvent.click(addBtn);
    expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
  });

  it('debe mostrar EmptyState con búsqueda fallida', async () => {
    renderView();
    await screen.findByText(/Mi Biblioteca/i);
    const searchInput = screen.getByPlaceholderText(/Buscar por título/i);
    fireEvent.change(searchInput, { target: { value: 'Inexistente' } });

    expect(screen.getByText(/Búsqueda sin éxito/i)).toBeInTheDocument();
  });

  it('debe capturar errores de la API', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(bookService.getMyBooks).mockRejectedValue(new Error('Fail'));
    renderView();
    await waitFor(() => expect(consoleSpy).toHaveBeenCalled());
    consoleSpy.mockRestore();
  });
});