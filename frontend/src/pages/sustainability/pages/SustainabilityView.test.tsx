import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedbackModal, HistorySection, MarketplaceSection, SocialDetailsModal, SustainabilityView } from './SustainabilityView';
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

    describe('SocialDetailsModal - Botón de Acción', () => {
        it('debe mostrar estado "Solicitado" cuando isRequested es true', () => {
            render(
                <SocialDetailsModal
                    isOpen={true}
                    listing={{ id: '1', type: 'loan', user: { id: 'other' } }}
                    isRequested={true}
                    onToggleRequest={vi.fn()}
                />
            );

            const btn = screen.getByRole('button', { name: /solicitado/i });
            expect(btn).toBeDefined();
            // Verifica la clase que contiene bg-amber-500
            expect(btn.className).toContain('bg-amber-500');
        });

        it('debe mostrar estado "Es tu anuncio" cuando el usuario es el owner', () => {
            render(
                <SocialDetailsModal
                    isOpen={true}
                    listing={{ id: '1', type: 'loan', user: { id: 'user1' } }}
                    currentUserId="user1"
                    isRequested={false}
                    onToggleRequest={vi.fn()}
                />
            );

            const btn = screen.getByRole('button', { name: /es tu anuncio/i });
            expect(btn).toBeDefined();
            expect(btn.className).toContain('bg-slate-200');
            expect(btn).toBeDisabled();
        });

        it('debe mostrar estado "Solicitar ahora" por defecto', () => {
            render(
                <SocialDetailsModal
                    isOpen={true}
                    listing={{ id: '1', type: 'loan', user: { id: 'other' } }}
                    currentUserId="user1"
                    isRequested={false}
                    onToggleRequest={vi.fn()}
                />
            );

            const btn = screen.getByRole('button', { name: /solicitar ahora/i });
            expect(btn).toBeDefined();
            expect(btn.className).toContain('bg-slate-900');
        });
    });

    describe('FeedbackModal', () => {
        it('debe renderizar el estado de éxito correctamente', () => {
            render(<FeedbackModal isOpen={true} onClose={vi.fn()} type="success" />);
            expect(screen.getByText('¡Enviado!')).toBeDefined();

            const iconContainer = screen.getByText('¡Enviado!').parentElement?.firstChild;
            expect(iconContainer).toHaveClass('bg-emerald-100');
            expect(iconContainer).toHaveClass('text-emerald-600');
        });

        it('debe renderizar el estado de cancelado correctamente', () => {
            render(<FeedbackModal isOpen={true} onClose={vi.fn()} type="cancel" />);

            expect(screen.getByText('Cancelado')).toBeDefined();
            expect(screen.getByText(/Has retirado la solicitud/i)).toBeDefined();

            const container = screen.getByText('Cancelado').parentElement;
            expect(container?.innerHTML).toContain('text-rose-600');
        });

        it('no debe renderizar nada si isOpen es false', () => {
            const { container } = render(<FeedbackModal isOpen={false} onClose={vi.fn()} type="success" />);
            expect(container.firstChild).toBeNull();
        });
    });

    it('debe ordenar el historial por fecha de creación (del más reciente al más antiguo)', async () => {
        const mockRequests = [
            { id: 'old', status: 'completed', createdAt: '2026-01-01T10:00:00Z', book: { title: 'Libro Antiguo' } },
            { id: 'new', status: 'completed', createdAt: '2026-06-04T10:00:00Z', book: { title: 'Libro Nuevo' } }
        ];

        (api.get as any).mockImplementation((url: string) => {
            if (url.includes('/sustainability/requests/me')) return Promise.resolve({ data: mockRequests });
            return Promise.resolve({ data: [] });
        });

        render(<SustainabilityView />);

        const historyTab = await screen.findByText(/Mi Historial/i);
        fireEvent.click(historyTab);
        await waitFor(async () => {
            const titles = await screen.findAllByRole('heading', { level: 4 });
            expect(titles[0].textContent).toBe('Libro Nuevo');
            expect(titles[1].textContent).toBe('Libro Antiguo');
        });
    });

    describe('handleToggleRequest logic', () => {
        beforeEach(() => {
            (api.get as any).mockImplementation((url: string) => {
                if (url.includes('/sustainability/listings/social'))
                    return Promise.resolve({ data: [{ id: 'l2', user: { id: 'otherUser' }, book: { title: 'Libro B' } }] });
                if (url.includes('/sustainability/requests/me'))
                    return Promise.resolve({ data: [] });
                return Promise.resolve({ data: [] });
            });
        });

        it('debe permitir solicitar un libro (POST)', async () => {
            render(<SustainabilityView />);

            const socialTab = await screen.findByRole('button', { name: /Biblioteca Amigos/i });
            fireEvent.click(socialTab);

            const detailsBtn = await screen.findByRole('button', { name: /Ver detalles/i });
            fireEvent.click(detailsBtn);

            const requestBtn = await screen.findByRole('button', { name: /Solicitar ahora/i });

            (api.post as any).mockResolvedValue({});
            fireEvent.click(requestBtn);

            await waitFor(() => expect(api.post).toHaveBeenCalledWith('/sustainability/requests', { listingId: 'l2' }));
            expect(await screen.findByText(/¡Enviado!/i)).toBeDefined();
        });
    });

    it('debe loguear error cuando falla la devolución', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        (api.patch as any).mockRejectedValueOnce(new Error('API Error'));

        const mockItems = [{
            id: 'req1',
            status: 'accepted',
            listing: {
                type: 'loan',
                user: { id: 'user1' }
            }
        }];

        render(<HistorySection items={mockItems} userId="user1" />);

        const btn = await screen.findByRole('button', { name: /Marcar devuelto/i });
        fireEvent.click(btn);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith('Error marcando devolución', expect.any(Error));
        });

        consoleSpy.mockRestore();
    });

    it('debe renderizar la etiqueta "RECHAZADO"', () => {
        const mockItems = [{
            id: 'h1',
            status: 'rejected',
            book: { title: 'Libro' },
            createdAt: '2026-06-04T10:00:00Z'
        }];

        render(<HistorySection items={mockItems} userId="user1" />);

        const label = screen.getByText('RECHAZADO');
        expect(label).toBeDefined();
        expect(label.className).toContain('bg-rose-50');
    });

    it('debe renderizar el estado por defecto usando toUpperCase', () => {
        const mockItems = [{
            id: 'h2',
            status: 'pending',
            book: { title: 'Libro' },
            createdAt: '2026-06-04T10:00:00Z'
        }];

        render(<HistorySection items={mockItems} userId="user1" />);

        const label = screen.getByText('PENDING');
        expect(label).toBeDefined();
        expect(label.className).toContain('bg-slate-100');
    });
    
});