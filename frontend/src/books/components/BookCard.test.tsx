import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { BookCard } from '../components/BookCard';
import { Book } from '../services/book.service';
import { CheckCircle } from 'lucide-react';

describe('BookCard', () => {
  const mockBook: Book = {
    id: 1,
    title: 'El Quijote',
    author: 'Cervantes',
    status: 'Reading',
    genre: 'Fantasía',
    updatedAt: '2023-10-01',
    urlPortada: 'https://ejemplo.com/portada.jpg',
    pageCount: 500,
  };

  const mockStatusInfo = {
    label: 'Leyendo',
    icon: <CheckCircle data-testid="status-icon" />,
    color: 'bg-blue-50 text-blue-600'
  };

  const mockOnEdit = vi.fn();
  const mockOnDelete = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar todos los datos del libro incluyendo género y páginas', () => {
    render(
      <BookCard 
        book={mockBook} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        statusInfo={mockStatusInfo} 
      />
    );
    
    expect(screen.getByText('El Quijote')).toBeInTheDocument();
    expect(screen.getByText('Cervantes')).toBeInTheDocument();
    expect(screen.getByText('Fantasía')).toBeInTheDocument();
    expect(screen.getByText('500 PÁGINAS')).toBeInTheDocument();
    expect(screen.getByText('Leyendo')).toBeInTheDocument();
    
    const img = screen.getByRole('img');
    expect(img).toHaveAttribute('src', mockBook.urlPortada);
  });

  it('debe mostrar el icono de libro (fallback) cuando no hay urlPortada', () => {
    const bookWithoutCover = { ...mockBook, urlPortada: undefined };
    render(
      <BookCard 
        book={bookWithoutCover} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        statusInfo={mockStatusInfo} 
      />
    );
    
    expect(screen.getByText('📖')).toBeInTheDocument();
    const fallbackIcon = screen.getByRole('img', { name: /Libro sin portada/i });
    expect(fallbackIcon).toBeInTheDocument();

    const images = screen.queryAllByRole('img');
    const hasHtmlImgTag = images.some(el => el.tagName === 'IMG');
    expect(hasHtmlImgTag).toBe(false);
  });

  it('debe mostrar "Otros" cuando el género no está definido', () => {
    const bookWithoutGenre = { ...mockBook, genre: undefined };
    render(
      <BookCard 
        book={bookWithoutGenre} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        statusInfo={mockStatusInfo} 
      />
    );
    
    expect(screen.getByText('Otros')).toBeInTheDocument();
  });

  it('no debe mostrar la sección de páginas si pageCount es 0 o indefinido', () => {
    const bookWithoutPages = { ...mockBook, pageCount: 0 };
    render(
      <BookCard 
        book={bookWithoutPages} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        statusInfo={mockStatusInfo} 
      />
    );
    
    expect(screen.queryByText(/PÁGINAS/i)).not.toBeInTheDocument();
  });

  it('debe llamar a onEdit cuando se hace click en la tarjeta', () => {
    render(
      <BookCard 
        book={mockBook} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        statusInfo={mockStatusInfo} 
      />
    );
    
    const editButton = screen.getByRole('button', { name: new RegExp(`Editar libro ${mockBook.title}`, 'i') });
    fireEvent.click(editButton);
    
    expect(mockOnEdit).toHaveBeenCalledWith(mockBook);
  });

  it('debe llamar a onDelete y detener la propagación cuando se pulsa el botón de borrar', () => {
    render(
      <BookCard 
        book={mockBook} 
        onEdit={mockOnEdit} 
        onDelete={mockOnDelete} 
        statusInfo={mockStatusInfo} 
      />
    );
    
    const deleteButton = screen.getByRole('button', { name: /eliminar libro/i });
    fireEvent.click(deleteButton);
    expect(mockOnDelete).toHaveBeenCalledTimes(1);
    expect(mockOnEdit).not.toHaveBeenCalled();
  });
});