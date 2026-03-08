import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardView } from './DashboardView';
import { Book, bookService } from '../../books/services/book.service';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../books/services/book.service', () => ({
    bookService: {
        getMyBooks: vi.fn(),
    },
}));

describe('DashboardView', () => {
    const mockBooks: Book[] = [
        { id: 1, title: 'Libro Leyendo', author: 'Autor A', status: 'Reading', updatedAt: '2026-01-01', urlPortada: '', genre: 'Fantasía' },
        { id: 2, title: 'Libro Leído', author: 'Autor B', status: 'Read', updatedAt: '2026-01-02', urlPortada: '', genre: 'Fantasía' },
    ];

    const mockUser = { fullName: 'Olga Cantalejo', email: 'olga@test.com' };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('token', 'fake-token');
    });

    const renderWithProviders = (ui: React.ReactElement) => {
        return render(
            <AuthProvider>
                <BrowserRouter>
                    {ui}
                </BrowserRouter>
            </AuthProvider>
        );
    };

    it('debe mostrar el saludo personalizado con el primer nombre del usuario', async () => {
        vi.mocked(bookService.getMyBooks).mockResolvedValue(mockBooks);
        renderWithProviders(<DashboardView />);
        await waitFor(() => {
            expect(screen.getByText(/¡Hola, Olga!/i)).toBeInTheDocument();
        });
    });

    it('debe mostrar el estado de carga y luego los libros', async () => {
        vi.mocked(bookService.getMyBooks).mockResolvedValue(mockBooks);
        renderWithProviders(<DashboardView />);

        expect(screen.getByText(/Organizando estanterías/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Libro Leyendo')).toBeInTheDocument();
            const stats = screen.getAllByText('1');
            expect(stats.length).toBeGreaterThanOrEqual(1);
            expect(screen.getByText(/libros leídos/i)).toBeInTheDocument();
        });
    });

    it('debe manejar la rama donde el usuario no tiene nombre (edge case)', async () => {
        localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));
        vi.mocked(bookService.getMyBooks).mockResolvedValue([]);
        
        renderWithProviders(<DashboardView />);
        
        await waitFor(() => {
            const title = screen.getByRole('heading', { level: 1 });
            expect(title.textContent).toContain('¡Hola,');
        });
    });

    it('debe capturar el error si la API falla', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(bookService.getMyBooks).mockRejectedValue(new Error('API Error'));

        renderWithProviders(<DashboardView />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error cargando biblioteca:", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });
});