import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FeedView } from './FeedView';
import { activityService, Activity, ActivityType } from '../services/activity.service';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('../services/activity.service', () => ({
    activityService: {
        getFeed: vi.fn(),
    },

    ActivityType: {
        FOLLOW: 'FOLLOW',
        BOOK_ADDED: 'BOOK_ADDED',
        BOOK_FINISHED: 'BOOK_FINISHED',
    }
}));

vi.mock('../components/ActivityCard', () => ({
    ActivityCard: ({ activity }: { activity: Activity }) => (
        <div data-testid="activity-card">
            {activity.user.fullName} - {activity.type}
        </div>
    ),
}));

describe('FeedView Component', () => {
    const mockActivities: Activity[] = [
        {
            id: '1',
            type: ActivityType.BOOK_ADDED,
            createdAt: new Date().toISOString(),
            user: {
                fullName: 'Olga Test',
                email: 'olga@test.com',
                avatarUrl: ''
            },
            targetBook: {
                id: 101,
                title: 'El Quijote',
                authors: ['Cervantes'],
                thumbnail: ''
            }
        }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    it('debe mostrar el spinner de carga al montar el componente', () => {
        vi.mocked(activityService.getFeed).mockReturnValue(new Promise(() => { }));

        render(<FeedView />);

        expect(screen.getByText(/Buscando novedades/i)).toBeInTheDocument();
    });

    it('debe renderizar las actividades correctamente tras una carga exitosa', async () => {
        vi.mocked(activityService.getFeed).mockResolvedValue(mockActivities);

        render(<FeedView />);

        // Esperamos a que el elemento con el nombre del usuario aparezca
        const activityElement = await screen.findByText(/Olga Test/i);
        expect(activityElement).toBeInTheDocument();
        expect(screen.getByTestId('activity-card')).toBeInTheDocument();
        expect(screen.getByText(/Estás al día/i)).toBeInTheDocument();
    });

    it('debe mostrar el estado vacío (Empty State) si no hay actividades', async () => {
        vi.mocked(activityService.getFeed).mockResolvedValue([]);

        render(<FeedView />);

        await waitFor(() => {
            expect(screen.getByText(/Silencio absoluto/i)).toBeInTheDocument();
        });
    });

    it('debe mostrar el mensaje de error si la petición falla', async () => {
        vi.mocked(activityService.getFeed).mockRejectedValue(new Error('Network Error'));

        render(<FeedView />);

        await waitFor(() => {
            expect(screen.getByText(/Error al conectar/i)).toBeInTheDocument();
        });
        expect(console.error).toHaveBeenCalled();
    });

    it('debe permitir reintentar la carga desde el botón de error', async () => {
        vi.mocked(activityService.getFeed)
            .mockRejectedValueOnce(new Error('Fail'))
            .mockResolvedValueOnce(mockActivities);

        render(<FeedView />);

        const retryBtn = await screen.findByText(/Reintentar/i);
        fireEvent.click(retryBtn);

        const activity = await screen.findByText(/Olga Test/i);
        expect(activity).toBeInTheDocument();
        expect(activityService.getFeed).toHaveBeenCalledTimes(2);
    });

    it('debe refrescar el feed al pulsar el botón de actualización del header', async () => {
        vi.mocked(activityService.getFeed).mockResolvedValue(mockActivities);

        render(<FeedView />);
        await screen.findByText(/Olga Test/i);

        const refreshBtn = screen.getByRole('button', { name: /actualizar feed/i });

        fireEvent.click(refreshBtn);

        expect(activityService.getFeed).toHaveBeenCalledTimes(2);
    });
});