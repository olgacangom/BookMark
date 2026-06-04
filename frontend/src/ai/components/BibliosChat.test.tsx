import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BibliosChat } from './BibliosChat';
import { aiService } from '../service/ai.service';
import * as AuthContext from '../../context/AuthContext';

vi.mock('../service/ai.service', () => ({
    aiService: {
        sendMessage: vi.fn(),
    },
}));

vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
    user: { role: 'user' }
} as any);

describe('BibliosChat', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe abrir el chat al hacer clic en el botón flotante', () => {
        render(<BibliosChat />);
        const openButton = screen.getByRole('button', { name: '' });
        fireEvent.click(openButton);
        expect(screen.getByText(/Soy Biblios/i)).toBeInTheDocument();
    });

    it('debe enviar un mensaje y mostrar la respuesta del modelo', async () => {
        vi.mocked(aiService.sendMessage).mockResolvedValue('Hola, soy Biblios');

        render(<BibliosChat />);

        const openButton = screen.getByRole('button', { name: '' });
        fireEvent.click(openButton);

        const input = await screen.findByPlaceholderText('Pregunta a Biblios...');
        fireEvent.change(input, { target: { value: 'Hola' } });

        const sendButton = screen.getByTestId('send-msg-btn');
        fireEvent.click(sendButton);

        await waitFor(() => {
            expect(aiService.sendMessage).toHaveBeenCalled();
        });

        expect(screen.getByText('Hola, soy Biblios')).toBeInTheDocument();
    });

    it('debe limpiar el chat al pulsar el botón de borrar', () => {
        render(<BibliosChat />);
        fireEvent.click(screen.getByRole('button', { name: '' })); 

        const clearBtn = screen.getByTestId('clear-chat-btn');
        fireEvent.click(clearBtn);

        expect(screen.getByText(/¡Hola! Soy Biblios/i)).toBeInTheDocument();
    });

    it('debe mostrar las acciones rápidas correctas para un usuario administrador', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { role: 'admin' }
        } as any);

        render(<BibliosChat />);

        fireEvent.click(screen.getByRole('button', { name: '' }));

        expect(screen.getByText('Top Interacción')).toBeInTheDocument();
        expect(screen.getByText('Libro Popular')).toBeInTheDocument();

        expect(screen.queryByText('Recomiéndame algo')).not.toBeInTheDocument();
    });

    it('debe mostrar las acciones rápidas correctas para un usuario librero', () => {
        vi.spyOn(AuthContext, 'useAuth').mockReturnValue({
            user: { role: 'librero' }
        } as any);

        render(<BibliosChat />);

        fireEvent.click(screen.getByRole('button', { name: '' }));

        expect(screen.getByText('Horario ideal para eventos')).toBeInTheDocument();
        expect(screen.getByText('Libro más buscado')).toBeInTheDocument();

        expect(screen.queryByText('Recomiéndame algo')).not.toBeInTheDocument();
    });

    it('debe mostrar el mensaje de error personalizado cuando aiService falla', async () => {
        vi.mocked(aiService.sendMessage).mockRejectedValue(new Error('Servicio no disponible'));

        render(<BibliosChat />);

        fireEvent.click(screen.getByRole('button', { name: '' }));

        const input = screen.getByPlaceholderText('Pregunta a Biblios...');
        fireEvent.change(input, { target: { value: '¿Hola?' } });
        fireEvent.click(screen.getByTestId('send-msg-btn'));

        await waitFor(() => {
            expect(screen.getByText(/La conexión con Biblios se ha interrumpido temporalmente. 🔌/i)).toBeInTheDocument();
        });
    });
});