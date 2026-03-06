import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DashboardView } from './DashboardView';
import { Book, bookService } from '../../books/services/book.service';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// 🛡️ Mock del servicio de libros
vi.mock('../../books/book.service', () => ({
    bookService: {
        getMyBooks: vi.fn(),
    },
}));

describe('DashboardView', () => {
    const mockBooks: Book[] = [
        {
            id: 1, title: 'Libro Leyendo', author: 'Autor A', status: 'Reading',
            updatedAt: '',
            coverUrl: '',
            genre: 'Fantasía'
        },
        {
            id: 2, title: 'Libro Leído', author: 'Autor B', status: 'Read',
            updatedAt: '',
            coverUrl: '',
            genre: 'Fantasía'
        },
    ];

    beforeEach(() => {
        vi.clearAllMocks();
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

    it('debe mostrar el estado de carga y luego los libros', async () => {
        vi.mocked(bookService.getMyBooks).mockResolvedValue(mockBooks);

        renderWithProviders(<DashboardView />);

        expect(screen.getByText(/Abriendo tu biblioteca/i)).toBeInTheDocument();

        await waitFor(() => {
            expect(screen.getByText('Libro Leyendo')).toBeInTheDocument();
            expect(screen.getByText('Libro Leído')).toBeInTheDocument();
        });
    });

    it('debe filtrar los libros al hacer clic en los botones', async () => {
        vi.mocked(bookService.getMyBooks).mockResolvedValue(mockBooks);

        renderWithProviders(<DashboardView />);

        await waitFor(() => expect(screen.getByText('Libro Leyendo')).toBeInTheDocument());

        // ✅ Ajuste de Regex: quitamos el espacio antes del paréntesis
        const readFilterBtn = screen.getByRole('button', { name: /Read\(1\)/i });
        fireEvent.click(readFilterBtn);

        expect(screen.queryByText('Libro Leyendo')).not.toBeInTheDocument();
        expect(screen.getByText('Libro Leído')).toBeInTheDocument();
    });

    it('debe mostrar un mensaje si no hay libros en la categoría', async () => {
        vi.mocked(bookService.getMyBooks).mockResolvedValue(mockBooks);

        renderWithProviders(<DashboardView />);

        await waitFor(() => expect(screen.getByText('Libro Leyendo')).toBeInTheDocument());

        // ✅ Ajuste de Regex: quitamos el espacio antes del paréntesis
        const wantFilterBtn = screen.getByRole('button', { name: /Want to Read\(0\)/i });
        fireEvent.click(wantFilterBtn);

        expect(screen.getByText(/No hay libros en esta categoría/i)).toBeInTheDocument();
    });

    it('debe capturar el error si la API falla', async () => {
        // Espiamos el console.error para que no ensucie la terminal y para verificarlo
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(bookService.getMyBooks).mockRejectedValue(new Error('API Error'));

        renderWithProviders(<DashboardView />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error cargando biblioteca:", expect.any(Error));
        });

        consoleSpy.mockRestore();
    });
});