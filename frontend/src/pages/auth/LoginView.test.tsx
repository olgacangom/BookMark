import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginView } from './LoginView';
import { authService } from '../../auth/auth.service';
import { AuthProvider } from '../../context/AuthContext';

vi.mock('../../auth/auth.service', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
  },
}));

describe('LoginView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => { });
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

  it('debe loguearse con éxito, guardar token y poner log de éxito', async () => {
    const setItemSpy = vi.spyOn(Storage.prototype, 'setItem');
    
    vi.mocked(authService.login).mockResolvedValue({ access_token: 'token-123' });

    renderWithProviders(<LoginView />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(authService.login).toHaveBeenCalledWith({
        email: 'test@test.com',
        password: 'password123',
      });
      expect(setItemSpy).toHaveBeenCalledWith('token', 'token-123');
      expect(console.log).toHaveBeenCalledWith("Login exitoso");
    });
  });

  it('debe mostrar log de error si las credenciales fallan', async () => {
    vi.mocked(authService.login).mockRejectedValue(new Error("Unauthorized"));

    renderWithProviders(<LoginView />);

    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'error@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'wrong' } });
    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith("Credenciales inválidas");
    });
  });

  it('debe mostrar errores de Zod si los campos están vacíos', async () => {
    renderWithProviders(<LoginView />);

    fireEvent.click(screen.getByRole('button', { name: /Entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/Formato de email inválido/i)).toBeInTheDocument();
      expect(screen.getByText(/La contraseña es obligatoria/i)).toBeInTheDocument();
    });
  });
});