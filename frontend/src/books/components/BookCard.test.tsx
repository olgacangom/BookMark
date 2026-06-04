import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BookCard } from './BookCard';
import { Book } from '../services/book.service';

describe('BookCard', () => {
    const mockBook: Book = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        status: 'Read',
        rating: 4,
        pageCount: 100,
        urlPortada: 'http://test.com/image.jpg',
        genre: 'Fantasía',
        isbn: '123',
        updatedAt: new Date(),
        createdAt: new Date().toISOString(),
        currentPage: 0,
    };

    const mockProps = {
        book: mockBook,
        onEdit: vi.fn(),
        onDelete: vi.fn(),
        onOpenNotes: vi.fn(),
        statusInfo: { label: 'Leído', icon: <div data-testid="status-icon" />, color: 'bg-emerald-500' }
    };

    it('debe renderizar la información básica del libro', () => {
        render(<BookCard {...mockProps} />);
        expect(screen.getByText('Test Book')).toBeInTheDocument();
        expect(screen.getByText('Test Author')).toBeInTheDocument();
        expect(screen.getByText('Fantasía')).toBeInTheDocument();
        expect(screen.getByText('100 PP.')).toBeInTheDocument();
    });

    it('debe mostrar la inicial si no hay urlPortada', () => {
        const bookNoImg = { ...mockBook, urlPortada: '' };
        render(<BookCard {...mockProps} book={bookNoImg} />);
        expect(screen.getByText('T')).toBeInTheDocument(); 
    });

    it('debe activar el evento onEdit al hacer clic en la tarjeta', () => {
        render(<BookCard {...mockProps} />);

        const buttons = screen.getAllByRole('button', { hidden: true });
        const editButton = buttons.find(btn => !btn.getAttribute('aria-label'));

        if (editButton) fireEvent.click(editButton);

        expect(mockProps.onEdit).toHaveBeenCalledWith(mockBook);
    });

    it('debe activar onDelete', () => {
        render(<BookCard {...mockProps} />);
        const deleteBtn = screen.getByLabelText('Borrar libro');
        fireEvent.click(deleteBtn);
        expect(mockProps.onDelete).toHaveBeenCalled();
    });

    it('debe renderizar 5 estrellas según el rating', () => {
        render(<BookCard {...mockProps} />);

        const stars = document.querySelectorAll('svg.lucide-star');

        // Verifica que hay 5 estrellas en total
        expect(stars.length).toBe(5);

        // Verifica que las primeras 4 (rating 4) tienen la clase de color ámbar
        const filledStars = document.querySelectorAll('svg.fill-amber-400');
        expect(filledStars.length).toBe(4);
    });

    it('debe aplicar estilos por defecto cuando el status no coincide', () => {
        const unknownStatusBook = { ...mockBook, status: 'Invalid' as any };

        render(<BookCard {...mockProps} book={unknownStatusBook} />);

        expect(screen.getByText('Test Book')).toBeInTheDocument();
    });

    it('debe renderizar un div vacío cuando no hay pageCount', () => {
        const bookNoPages = { ...mockBook };
        delete (bookNoPages as any).pageCount; 
        render(<BookCard {...mockProps} book={bookNoPages} />);
        expect(screen.queryByText(/PP./i)).not.toBeInTheDocument();
    });
});