import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginView } from './LoginView';
import { AuthProvider } from '../../context/AuthContext';
import api from '../../services/api';

// 1. Mock de la navegación
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

// 2. Mock de la instancia de la API (Axios)
vi.mock('../../services/api', () => ({
    default: {
        post: vi.fn(),
    },
}));

describe('LoginView', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Silenciamos el console.error para no ensuciar la salida del test
        vi.spyOn(console, 'error').mockImplementation(() => { });
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

    it('debe iniciar sesión con éxito y navegar al dashboard', async () => {
        // Simulamos respuesta exitosa del servidor
        const mockResponse = {
            data: {
                access_token: 'token-123',
                user: { id: '1', fullName: 'Test User' }
            }
        };
        vi.mocked(api.post).mockResolvedValue(mockResponse);

        renderWithProviders(<LoginView />);

        fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

        await waitFor(() => {
            expect(api.post).toHaveBeenCalledWith('/auth/login', {
                email: 'test@test.com',
                password: 'password123',
            });
            expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
        });
    });

    it('debe mostrar mensaje de error en la UI si las credenciales fallan', async () => {
        // Simulamos fallo de credenciales (401)
        vi.mocked(api.post).mockRejectedValue({
            response: { data: { message: 'Unauthorized' } }
        });

        renderWithProviders(<LoginView />);

        fireEvent.change(screen.getByLabelText(/Correo Electrónico/i), { target: { value: 'error@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'wrong' } });
        fireEvent.click(screen.getByRole('button', { name: /Iniciar Sesión/i }));

        await waitFor(() => {
            // Comprobamos que el mensaje de error aparece en el DOM
            expect(screen.getByText(/Credenciales incorrectas. Inténtalo de nuevo./i)).toBeInTheDocument();
        });
    });

    it('el enlace a registro debe tener la ruta correcta', () => {
        renderWithProviders(<LoginView />);
        const link = screen.getByRole('link', { name: /Regístrate aquí/i });
        expect(link).toHaveAttribute('href', '/register');
    });
});