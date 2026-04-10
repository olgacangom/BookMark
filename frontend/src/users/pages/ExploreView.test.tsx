import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ExploreView } from './ExploreView';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
    default: {
        get: vi.fn(),
    },
}));

vi.mock('../components/UserCard', () => ({
    UserCard: ({ user }: { user: any }) => (
        <div data-testid="user-card">
            {user.fullName} - {user.followStatus || 'no-rel'}
        </div>
    ),
}));

describe('ExploreView Coverage', () => {
    const mockCurrentUser = { id: 'me-123', fullName: 'Mi Usuario' };

    const mockUsersData = [
        {
            id: 'user-1',
            fullName: 'Olga Cantalejo',
            email: 'olga@test.com',
            followerRelations: [
                { followerId: 'me-123', status: 'ACCEPTED' }
            ]
        },
        {
            id: 'user-2',
            fullName: 'Juan Perez',
            email: 'juan@test.com',
            followerRelations: [
                { follower: { id: 'me-123' }, status: 'PENDING' }
            ]
        },
        {
            id: 'me-123',
            fullName: 'Mi Usuario',
            email: 'me@test.com'
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('user', JSON.stringify(mockCurrentUser));
        localStorage.setItem('token', 'fake-token');
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    const renderComponent = () =>
        render(
            <AuthProvider>
                <BrowserRouter>
                    <ExploreView />
                </BrowserRouter>
            </AuthProvider>
        );

    it('debe mostrar el loader inicialmente', () => {
        (api.get as any).mockReturnValue(new Promise(() => { }));

        const { container } = renderComponent();

        const loader = container.querySelector('.animate-spin');
        expect(loader).toBeInTheDocument();

        expect(container.querySelector('.h-\\[60vh\\]')).toBeInTheDocument();
    });

    it('debe cargar y mostrar la lista de usuarios (excluyendo al usuario actual)', async () => {
        (api.get as any).mockResolvedValue({ data: mockUsersData });
        renderComponent();

        await waitFor(() => {
            const cards = screen.getAllByTestId('user-card');
            expect(cards).toHaveLength(2);
            expect(screen.getByText(/Olga Cantalejo/i)).toBeInTheDocument();
            expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument();
        });
    });

    it('debe calcular correctamente los estados de seguimiento (ACCEPTED/PENDING)', async () => {
        (api.get as any).mockResolvedValue({ data: mockUsersData });
        renderComponent();

        await waitFor(() => {
            expect(screen.getByText(/Olga Cantalejo - ACCEPTED/i)).toBeInTheDocument();
            expect(screen.getByText(/Juan Perez - PENDING/i)).toBeInTheDocument();
        });
    });

    it('debe filtrar usuarios según el término de búsqueda (nombre o email)', async () => {
        (api.get as any).mockResolvedValue({ data: mockUsersData });
        renderComponent();

        await waitFor(() => expect(screen.getAllByTestId('user-card')).toHaveLength(2));

        const searchInput = screen.getByPlaceholderText(/Buscar por nombre o usuario.../i);

        fireEvent.change(searchInput, { target: { value: 'Olga' } });
        expect(screen.getByText(/Olga Cantalejo/i)).toBeInTheDocument();
        expect(screen.queryByText(/Juan Perez/i)).not.toBeInTheDocument();

        fireEvent.change(searchInput, { target: { value: 'juan@test.com' } });
        expect(screen.getByText(/Juan Perez/i)).toBeInTheDocument();
        expect(screen.queryByText(/Olga Cantalejo/i)).not.toBeInTheDocument();
    });

    it('debe mostrar el estado vacío cuando no hay resultados de búsqueda', async () => {
        (api.get as any).mockResolvedValue({ data: mockUsersData });
        renderComponent();

        await waitFor(() => expect(screen.getAllByTestId('user-card')).toHaveLength(2));

        const searchInput = screen.getByPlaceholderText(/Buscar por nombre o usuario.../i);
        fireEvent.change(searchInput, { target: { value: 'UsuarioInexistente' } });

        expect(screen.getByText(/No se han encontrado lectores con ese nombre.../i)).toBeInTheDocument();
    });

    it('debe manejar errores de la API y dejar de cargar', async () => {
        (api.get as any).mockRejectedValue(new Error('API Error'));
        renderComponent();

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith("Error cargando usuarios", expect.any(Error));
            expect(screen.queryByRole('status')).not.toBeInTheDocument();
        });
    });
});