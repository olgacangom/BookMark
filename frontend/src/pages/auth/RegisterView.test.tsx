import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterView } from './RegisterView';
import { BrowserRouter } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../../services/auth.service', () => ({
  authService: {
    register: vi.fn(),
  },
}));

describe('RegisterView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('debe registrar con éxito y mostrar log', async () => {
    (authService.register as any).mockResolvedValue({ id: 1 });

    render(
      <BrowserRouter>
        <RegisterView />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Olga Cantalejo' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'olga@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });
    
    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(authService.register).toHaveBeenCalled();
      expect(console.log).toHaveBeenCalledWith("¡Registro exitoso! Ya puedes iniciar sesión.");
    });
  });

  it('debe mostrar el mensaje de error del servidor en el log', async () => {
    const errorMsg = "El email ya existe";
    (authService.register as any).mockRejectedValue({
      response: { data: { message: errorMsg } }
    });

    render(
      <BrowserRouter>
        <RegisterView />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith(errorMsg);
    });
  });

  it('debe mostrar error genérico si el servidor no envía mensaje', async () => {
    (authService.register as any).mockRejectedValue(new Error());

    render(
      <BrowserRouter>
        <RegisterView />
      </BrowserRouter>
    );

    fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
    fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(console.log).toHaveBeenCalledWith("Error al registrarse");
    });
  });

  it('debe mostrar errores de Zod al dejar campos vacíos', async () => {
    render(
      <BrowserRouter>
        <RegisterView />
      </BrowserRouter>
    );

    fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

    await waitFor(() => {
      expect(screen.getByText(/El nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument();
      expect(screen.getByText(/Formato de email inválido/i)).toBeInTheDocument();
    });
  });
});