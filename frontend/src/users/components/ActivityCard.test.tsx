import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Activity, activityService, ActivityType } from '../services/activity.service';
import { ActivityCard, ActivityCardProps } from './ActivityCard';
import { MemoryRouter } from 'react-router-dom';
import * as AuthContext from '../../context/AuthContext';

vi.mock('../services/activity.service', () => ({
    ActivityType: { POST: 'POST', FOLLOW: 'FOLLOW', BOOK_ADDED: 'BOOK_ADDED', BOOK_FINISHED: 'BOOK_FINISHED' },
    activityService: {
        updateActivity: vi.fn(),
        addComment: vi.fn(),
    }
}));

vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: { id: 'user-123' } } as any);

const AllTheProviders = ({ children }: { children: React.ReactNode }) => (
    <MemoryRouter>
        {children}
    </MemoryRouter>
);

describe('ActivityCard', () => {
    const mockActivity: Activity = {
        id: 'act-1',
        type: ActivityType.POST,
        content: 'Hola mundo',
        createdAt: new Date().toISOString(),
        user: {
            id: 'user-123',
            fullName: 'Test User',
            avatarUrl: 'https://test.com/avatar.jpg'
        },
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        comments: [],
    };

    const props: ActivityCardProps = {
        activity: mockActivity,
        onLike: vi.fn(),
        onIgnore: vi.fn(),
        onComment: vi.fn(),
        onUpdate: vi.fn(),
        onDelete: vi.fn(),
    };

    it('debe renderizar el contenido de la actividad correctamente', () => {
        render(
            <MemoryRouter>
                <ActivityCard {...props} />
            </MemoryRouter>
        );
        expect(screen.getByText('Hola mundo')).toBeInTheDocument();
    });

    it('debe llamar a onLike al hacer clic en el botón de corazón', () => {
        render(<ActivityCard {...props} />, { wrapper: AllTheProviders });
        const buttons = screen.getAllByText('0');
        fireEvent.click(buttons[0]);
        expect(props.onLike).toHaveBeenCalledWith('act-1');
    });

    it('debe mostrar los campos de edición cuando se pulsa editar', async () => {
        render(<ActivityCard {...props} />, { wrapper: AllTheProviders });

        fireEvent.click(screen.getByRole('button', { name: 'Abrir menú' }));

        const editBtn = screen.getByText('Editar publicación');
        fireEvent.click(editBtn);

        expect(screen.getByPlaceholderText('Edita tu mensaje...')).toBeDefined();
    });

    it('debe abrir y cerrar la sección de comentarios', () => {
        render(<ActivityCard {...props} />, { wrapper: AllTheProviders });
        const buttons = screen.getAllByText('0');
        fireEvent.click(buttons[1]);

        expect(screen.getByText('No hay comentarios todavía')).toBeInTheDocument();
    });

    it('debe gestionar el envío de comentarios exitoso', async () => {
        vi.mocked(activityService.addComment).mockResolvedValue({
            id: 'c2', text: 'Nuevo', user: { fullName: 'Yo' }
        } as any);

        render(<ActivityCard {...props} />, { wrapper: AllTheProviders });

        fireEvent.click(screen.getAllByText('0')[1]);

        const input = screen.getByPlaceholderText('Escribe un comentario...');
        fireEvent.change(input, { target: { value: 'Nuevo comentario' } });

        const sendButton = screen.getByRole('button', { name: '' });
        fireEvent.click(sendButton);

        await waitFor(() => expect(activityService.addComment).toHaveBeenCalled());
    });

    it('debe mostrar el modal de eliminación y confirmar', () => {
        render(<ActivityCard {...props} />, { wrapper: AllTheProviders });
        fireEvent.click(screen.getByLabelText('Abrir menú'));
        fireEvent.click(screen.getByText('Eliminar'));

        expect(screen.getByText('¿Eliminar publicación?')).toBeDefined();
        fireEvent.click(screen.getByText('Eliminar'));
        expect(props.onDelete).toHaveBeenCalledWith('act-1');
    });

    it('debe renderizar tipos de actividad BOOK_ADDED', () => {
        const bookActivity: Activity = {
            ...mockActivity,
            type: ActivityType.BOOK_ADDED,
            targetBook: { title: 'Libro', author: 'Autor', isbn: '123' } as any
        };

        const bookProps = { ...props, activity: bookActivity };

        render(<ActivityCard {...bookProps} />, { wrapper: AllTheProviders });

        const bookTitle = screen.getByText((content, element) => {
            return content.toLowerCase().includes('libro') && element?.tagName.toLowerCase() === 'p';
        });

        expect(bookTitle).toBeInTheDocument();
    });

    it('debe manejar error al guardar edición', async () => {
        vi.mocked(activityService.updateActivity).mockRejectedValue(new Error('Fail'));
        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(<ActivityCard {...props} />, { wrapper: AllTheProviders });
        fireEvent.click(screen.getByLabelText('Abrir menú'));
        fireEvent.click(screen.getByText('Editar publicación'));
        fireEvent.click(screen.getByText('Guardar Cambios'));

        await waitFor(() => expect(alertSpy).toHaveBeenCalled());
        alertSpy.mockRestore();
    });
});