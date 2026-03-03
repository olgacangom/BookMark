import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { RegisterView } from './RegisterView';
import { authService } from '../../auth/auth.service';
import { AuthProvider } from '../../context/AuthContext';

// mock useNavigate so we can assert navigation
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('../../auth/auth.service', () => ({
  authService: {
    register: vi.fn(),
    login: vi.fn(),
  },
}));

describe('RegisterView', () => {
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

  it('debe registrar con éxito, iniciar sesión automáticamente y navegar', async () => {
    vi.mocked(authService.register).mockResolvedValue({ id: 1 });
    vi.mocked(authService.login).mockResolvedValue({
      access_token: 'token-xyz',
      user: { email: 'olga@test.com', id: 'u1' },
    });

    renderWithProviders(<RegisterView />);

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Olga Cantalejo' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'olga@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

    expect(screen.getByRole('link', { name: /Inicia sesión/i })).toHaveAttribute('href', '/login');

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
      expect(authService.login).toHaveBeenCalledWith({
        email: 'olga@test.com',
        password: 'Password123',
      });
      expect(mockNavigate).toHaveBeenCalledWith('/dashboard');
    });
  });

  it('muestra mensaje de error devuelto por servidor', async () => {
    const errorMsg = "El email ya existe";
    vi.mocked(authService.register).mockRejectedValue({
      response: { data: { message: errorMsg } }
    });

    renderWithProviders(<RegisterView />);

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(errorMsg)).toBeInTheDocument();
    });
  });

  it('muestra mensaje genérico si el servidor no devuelve mensaje', async () => {
    vi.mocked(authService.register).mockRejectedValue(new Error("Server Error"));

    renderWithProviders(<RegisterView />);

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/Error al crear la cuenta/i)).toBeInTheDocument();
    });
  });

  it('limpia el error cuando el usuario edita los campos', async () => {
    renderWithProviders(<RegisterView />);

    // dispara un error de formato
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'malo' } });
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));
    await waitFor(() => {
      expect(screen.getByText(/Formato de email inválido/i)).toBeInTheDocument();
    });

    // al corregir el email se borra el mensaje
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'bueno@test.com' } });
    expect(screen.queryByText(/Formato de email inválido/i)).toBeNull();
  });
});