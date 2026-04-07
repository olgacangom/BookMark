import { render, screen, waitFor } from '@testing-library/react';
import { DashboardView } from './DashboardView';
import { useAuth } from '../../context/AuthContext';
import { bookService } from '../../books/services/book.service';
import { MemoryRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest';

vi.mock('../../context/AuthContext', () => ({
    useAuth: vi.fn(),
}));

vi.mock('../../books/services/book.service', () => ({
    bookService: {
        getMyBooks: vi.fn(),
    },
}));

vi.mock('../../components/stats/BooksGrowthChart', () => ({
    BooksGrowthChart: ({ data }: any) => (
        <div data-testid="mock-growth-chart" data-count={data?.length}>
            Chart Mock
        </div>
    ),
}));

describe('DashboardView Component', () => {
    const mockUser = { fullName: 'Olga Cantalejo' };
    const mockBooks = [
        { id: '1', title: 'Libro Leyendo', author: 'Autor A', status: 'Reading' },
        { id: '2', title: 'Libro Leído', author: 'Autor B', status: 'Read' },
    ];
    const mockStats = [{ month: '2026-04', count: 12 }];

    beforeEach(() => {
        vi.clearAllMocks();

        Storage.prototype.getItem = vi.fn(() => 'fake-token');
        (import.meta as any).env = { VITE_API_URL: 'http://localhost:3000' };

        (useAuth as any).mockReturnValue({ user: mockUser });

        globalThis.fetch = vi.fn().mockResolvedValue({
            ok: true,
            json: () => Promise.resolve(mockStats),
        } as Response);
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('debe mostrar el estado de carga inicial', () => {
        (bookService.getMyBooks as any).mockReturnValue(new Promise(() => { }));

        render(
            <MemoryRouter>
                <DashboardView />
            </MemoryRouter>
        );

        expect(screen.getByText(/Organizando estanterías.../i)).toBeInTheDocument();
    });

    it('debe renderizar el saludo con el primer nombre del usuario', async () => {
        (bookService.getMyBooks as any).mockResolvedValue(mockBooks);

        render(
            <MemoryRouter>
                <DashboardView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/¡Hola, Olga!/i)).toBeInTheDocument();
        });
        expect(screen.getByText('Tu espacio literario te espera')).toBeInTheDocument();
    });

    it('debe calcular y mostrar correctamente el número de libros leídos', async () => {
        (bookService.getMyBooks as any).mockResolvedValue(mockBooks);

        render(
            <MemoryRouter>
                <DashboardView />
            </MemoryRouter>
        );

        await waitFor(() => {
            const statLabel = screen.getByText(/libros leídos/i);
            const statCard = statLabel.closest('div'); 

            expect(statCard).toHaveTextContent('1');
        });
    });

    it('debe listar los libros que se están leyendo actualmente', async () => {
        (bookService.getMyBooks as any).mockResolvedValue(mockBooks);

        render(
            <MemoryRouter>
                <DashboardView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText('Libro Leyendo')).toBeInTheDocument();
            expect(screen.getByText('Autor A')).toBeInTheDocument();
        });
    });

    it('debe mostrar un mensaje de estado vacío si no hay lecturas activas', async () => {
        const onlyReadBooks = mockBooks.map(b => ({ ...b, status: 'Read' }));
        (bookService.getMyBooks as any).mockResolvedValue(onlyReadBooks);

        render(
            <MemoryRouter>
                <DashboardView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.getByText(/No hay lecturas activas/i)).toBeInTheDocument();
            expect(screen.getByText(/Añadir libro/i)).toBeInTheDocument();
        });
    });

    it('debe pasar los datos de crecimiento correctamente al componente BooksGrowthChart', async () => {
        (bookService.getMyBooks as any).mockResolvedValue(mockBooks);

        render(
            <MemoryRouter>
                <DashboardView />
            </MemoryRouter>
        );

        await waitFor(() => {
            const chart = screen.getByTestId('mock-growth-chart');
            expect(chart.getAttribute('data-count')).toBe('1');
        });
    });

    it('debe manejar errores en la petición y detener el estado de carga', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (bookService.getMyBooks as any).mockRejectedValue(new Error('Fail'));

        render(
            <MemoryRouter>
                <DashboardView />
            </MemoryRouter>
        );

        await waitFor(() => {
            expect(screen.queryByText(/Organizando estanterías.../i)).not.toBeInTheDocument();
        });

        expect(consoleSpy).toHaveBeenCalledWith("Error cargando Dashboard:", expect.any(Error));
    });
});