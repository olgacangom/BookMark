import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { HistorySection, MarketplaceSection, SustainabilityView } from './SustainabilityView';
import api from '../../../services/api';
import { vi, describe, it, expect } from 'vitest';

vi.mock('../../../context/AuthContext', () => ({
    useAuth: () => ({ user: { id: 'user1', fullName: 'Test User' } })
}));

vi.mock('../../../services/api', () => ({
    default: {
        get: vi.fn(),
        post: vi.fn(),
        delete: vi.fn(),
        patch: vi.fn(),
    }
}));

describe('SustainabilityView', () => {
    it('debe cargar y renderizar los datos correctamente', async () => {
        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/sustainability/listings/me')) return Promise.resolve({ data: [] });
            if (url.includes('/sustainability/requests/me')) return Promise.resolve({ data: [] });
            if (url.includes('/sustainability/listings/social')) return Promise.resolve({ data: [] });
            return Promise.resolve({ data: [] });
        });

        render(<SustainabilityView />);
        await waitFor(() => {
            expect(screen.queryByRole('status')).toBeNull();
        });
    });

    it('debe cambiar de tab al hacer click', async () => {
        render(<SustainabilityView />);
        const historyTab = await screen.findByText(/Mi Historial/i);
        fireEvent.click(historyTab);
        expect(historyTab).toBeDefined();
    });

    it('debe filtrar listado social por provincia', async () => {
        render(<SustainabilityView />);
        const socialTab = await screen.findByText(/Biblioteca Amigos/i);
        fireEvent.click(socialTab);
        const select = await screen.findByRole('combobox');
        fireEvent.change(select, { target: { value: 'Sevilla' } });
        expect(select).toBeDefined();
    });

    it('debe renderizar el listado social con la información del libro y el botón de detalle', async () => {
        const mockSocialListings = [
            {
                id: 'soc-1',
                type: 'loan',
                price: 0,
                maxLoanDays: 20,
                book: { title: 'El Gran Gatsby', author: 'F. Scott Fitzgerald', urlPortada: 'test.jpg' },
                user: { fullName: 'Juan Perez', email: 'juan@test.com' }
            }
        ];

        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/sustainability/listings/social')) {
                return Promise.resolve({ data: mockSocialListings });
            }
            return Promise.resolve({ data: [] });
        });

        render(<SustainabilityView />);

        // Cambiar a la pestaña "Biblioteca Amigos"
        const socialTab = await screen.findByText(/Biblioteca Amigos/i);
        fireEvent.click(socialTab);

        // el test confirma que el título y el autor aparecen
        expect(await screen.findByText('El Gran Gatsby')).toBeDefined();
        expect(screen.getByText('F. Scott Fitzgerald')).toBeDefined();

        expect(screen.getByText(/PRÉSTAMO/i)).toBeDefined();
        const btn = screen.getByRole('button', { name: /Ver detalles/i });
        expect(btn).toBeDefined();
    });

    describe('HistorySection', () => {
        const mockUserId = 'user1';

        it('debe renderizar correctamente un préstamo prestado y permitir marcar devolución', async () => {
            const mockItems = [{
                id: 'req1',
                status: 'accepted',
                createdAt: '2026-06-04T10:00:00Z',
                listing: {
                    type: 'loan',
                    user: { id: mockUserId },
                    book: { title: 'El Libro', urlPortada: 'url.jpg' }
                },
                requester: { fullName: 'Amigo Test' }
            }];

            render(<HistorySection items={mockItems} userId={mockUserId} onReturnSuccess={vi.fn()} />);

            expect(screen.getByText(/Prestado a @Amigo/i)).toBeDefined();

            // Verifica que aparece el botón de marcar devuelto (canMarkReturn)
            const btn = screen.getByRole('button', { name: /Marcar devuelto/i });
            expect(btn).toBeDefined();

            (api.patch as any).mockResolvedValue({});
            fireEvent.click(btn);

            await waitFor(() => {
                expect(api.patch).toHaveBeenCalledWith('/sustainability/requests/req1/return');
            });
        });

        it('debe mostrar "Donación externa" para ítems manuales', () => {
            const mockItems = [{
                id: 'don1',
                status: 'donated',
                isManualDonation: true,
                createdAt: '2026-06-04T10:00:00Z',
                book: { title: 'Libro Donado', urlPortada: 'url.jpg' }
            }];

            render(<HistorySection items={mockItems} userId={mockUserId} />);

            expect(screen.getByText(/Donación externa realizada/i)).toBeDefined();
            expect(screen.getByText('DONADO')).toBeDefined();
        });
    });

    describe('MarketplaceSection', () => {
        const mockOnEdit = vi.fn();
        const mockOnAction = vi.fn();

        const mockListings = [
            {
                id: 'l1',
                type: 'sale',
                price: 15,
                isAvailable: true,
                book: { title: 'Libro Venta', author: 'Autor A', urlPortada: 'test.jpg' }
            },
            {
                id: 'l2',
                type: 'loan',
                maxLoanDays: 10,
                isAvailable: false,
                book: { title: 'Libro Prestamo', author: 'Autor B' }
            }
        ];

        beforeEach(() => {
            vi.clearAllMocks();
        });

        it('debe renderizar correctamente listado de venta disponible', () => {
            render(<MarketplaceSection listings={[mockListings[0]]} onEdit={mockOnEdit} onAction={mockOnAction} />);

            expect(screen.getByText('Libro Venta')).toBeDefined();
            expect(screen.getByText('15€')).toBeDefined();
            expect(screen.getByText('DISPONIBLE')).toBeDefined();
        });

        it('debe renderizar correctamente listado de préstamo ocupado', () => {
            render(<MarketplaceSection listings={[mockListings[1]]} onEdit={mockOnEdit} onAction={mockOnAction} />);

            expect(screen.getByText('Libro Prestamo')).toBeDefined();
            expect(screen.getByText(/10 DÍAS/i)).toBeDefined();
            expect(screen.getByText('OCUPADO')).toBeDefined();
        });

        it('debe disparar las acciones al hacer click', () => {
            render(<MarketplaceSection listings={[mockListings[0]]} onEdit={mockOnEdit} onAction={mockOnAction} />);

            const editBtn = screen.getByRole('button', { name: /editar/i });
            fireEvent.click(editBtn);
            expect(mockOnEdit).toHaveBeenCalledWith(mockListings[0]);

            const donateBtn = screen.getByText(/MARCAR DONADO/i);
            fireEvent.click(donateBtn);
            expect(mockOnAction).toHaveBeenCalledWith('donate', mockListings[0]);
        });
    });
});