import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { BookCard } from '../components/BookCard';
import { Book } from '../services/book.service';

describe('BookCard', () => {
  const mockBook: Book = {
    id: 1,
    title: 'El Quijote',
    author: 'Cervantes',
    status: 'Reading',
    genre: 'Fantasía',
    updatedAt: '',
    coverUrl: ''
  };

  it('debe renderizar el título y el autor correctamente', () => {
    render(<BookCard book={mockBook} />);
    
    expect(screen.getByText('El Quijote')).toBeInTheDocument();
    expect(screen.getByText('Cervantes')).toBeInTheDocument();
  });

  it('debe mostrar el badge con el estado correcto', () => {
    render(<BookCard book={mockBook} />);
    const badge = screen.getByText('Reading');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveClass('bg-blue-100');
  });
});