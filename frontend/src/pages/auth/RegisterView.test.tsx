import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RegisterView } from './RegisterView';
import { AuthProvider } from '../../context/AuthContext';
import api from '../../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/api', () => ({
    default: { post: vi.fn() }
}));

describe('RegisterView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.spyOn(console, 'error').mockImplementation(() => { });
    });

    const renderWithProviders = (ui: React.ReactElement) => {
        return render(<AuthProvider><BrowserRouter>{ui}</BrowserRouter></AuthProvider>);
    };

    it('debe registrar con éxito y navegar al login', async () => {
        vi.mocked(api.post).mockResolvedValue({ data: { id: 1 } });
        renderWithProviders(<RegisterView />);

        fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Olga' } });
        fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'olga@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: '123456' } });

        fireEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        await waitFor(() => {
            expect(mockNavigate).toHaveBeenCalledWith('/login');
        });
    });

    it('muestra mensaje de error devuelto por servidor y limpia cargando', async () => {
        vi.mocked(api.post).mockRejectedValue({
            response: { data: { message: 'El email ya existe' } }
        });

        renderWithProviders(<RegisterView />);
        
        fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Usuario Test' } });
        fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: '123456' } });

        const submitBtn = screen.getByRole('button', { name: /Crear Cuenta/i });
        fireEvent.click(submitBtn);

        const errorMsg = await screen.findByText(/El email ya existe/i);
        expect(errorMsg).toBeInTheDocument();
        
        expect(submitBtn).not.toBeDisabled();
    });

    it('debe alternar la visibilidad de la contraseña al hacer clic en el icono del ojo', () => {
        renderWithProviders(<RegisterView />);
        
        const passwordInput = screen.getByLabelText(/Contraseña/i) as HTMLInputElement;
        const toggleButton = screen.getAllByRole('button').find(btn => (btn as HTMLButtonElement).type === 'button');

        expect(passwordInput.type).toBe('password');

        if (toggleButton) fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('text');

        if (toggleButton) fireEvent.click(toggleButton);
        expect(passwordInput.type).toBe('password');
    });

    it('muestra mensaje genérico si el servidor falla sin enviar un mensaje específico', async () => {
        vi.mocked(api.post).mockRejectedValue(new Error('Network Error'));

        renderWithProviders(<RegisterView />);

        fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Test' } });
        fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: '123456' } });

        fireEvent.click(screen.getByRole('button', { name: /Crear Cuenta/i }));

        const fallbackMsg = await screen.findByText(/Error al crear la cuenta. Inténtalo de nuevo./i);
        expect(fallbackMsg).toBeInTheDocument();
    });
});