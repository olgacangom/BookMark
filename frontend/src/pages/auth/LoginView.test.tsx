import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LoginView } from './LoginView';
import { BrowserRouter } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { describe, it, expect, vi } from 'vitest';

// Simulamos el servicio
vi.mock('../../services/auth.service', () => ({
    authService: {
        login: vi.fn(),
    },
}));

describe('LoginView', () => {
    beforeEach(() => {
        vi.clearAllMocks(); // Limpia el historial de llamadas de los mocks
    });
    it('should login successfully and store token', async () => {
        // Espiamos el alert y el localStorage
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });
        const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');

        // Forzamos un éxito en el mock
        (authService.login as any).mockResolvedValue({ access_token: 'fake-token' });

        render(
            <BrowserRouter>
                <LoginView />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } });
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

        await waitFor(() => {
            expect(authService.login).toHaveBeenCalled();
            expect(setItemSpy).toHaveBeenCalledWith('token', 'fake-token');
            expect(alertMock).toHaveBeenCalledWith("Login exitoso");
        });
    });

    it('should show error alert on failed login', async () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });
        // Forzamos un error
        (authService.login as any).mockRejectedValue(new Error());

        render(
            <BrowserRouter>
                <LoginView />
            </BrowserRouter>
        );

        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'error@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith("Credenciales inválidas");
        });
    });
    it('should show validation errors when fields are empty', async () => {
        render(
            <BrowserRouter>
                <LoginView />
            </BrowserRouter>
        );

        // Pulsamos entrar sin escribir nada
        fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

        await waitFor(() => {
            // El email vacío dispara la validación de formato y la contraseña el .min(1)
            expect(screen.getByText(/Formato de email inválido/i)).toBeInTheDocument();
            expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument();
        });
    });
});