import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { RegisterView } from './RegisterView';
import { BrowserRouter } from 'react-router-dom';
import { authService } from '../../services/auth.service';
import { describe, it, expect, vi } from 'vitest';

// Simulamos el servicio para que no intente conectar con el backend real
vi.mock('../../services/auth.service', () => ({
    authService: {
        register: vi.fn(),
    },
}));

describe('RegisterView', () => {
    beforeEach(() => {
        vi.clearAllMocks(); // Limpia el historial de llamadas de los mocks
    });
    it('should submit the form and show success alert', async () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        render(
            <BrowserRouter>
                <RegisterView />
            </BrowserRouter>
        );

        // Rellenamos los campos
        fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Olga Cantalejo' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'olga@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

        // Click en registrarse
        fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

        await waitFor(() => {
            expect(authService.register).toHaveBeenCalled();
            expect(alertMock).toHaveBeenCalledWith(expect.stringContaining("¡Registro exitoso!"));
        });
    });

    it('should show error message if registration fails', async () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        // Configuramos el mock para que falle ESTA VEZ
        (authService.register as any).mockRejectedValue({
            response: { data: { message: 'El email ya existe' } }
        });

        render(
            <BrowserRouter>
                <RegisterView />
            </BrowserRouter>
        );

        // IMPORTANTE: Hay que rellenar el formulario para que pase Zod
        fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Usuario Error' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'error@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

        await waitFor(() => {
            expect(alertMock).toHaveBeenCalledWith('El email ya existe');
        });
    });
    it('should show validation errors when fields are empty', async () => {
        render(
            <BrowserRouter><RegisterView /></BrowserRouter>
        );

        // Pulsamos registrarse sin escribir nada
        fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

        await waitFor(() => {
            // Comprobamos que aparecen los mensajes definidos en auth.schema.ts
            expect(screen.getByText(/El nombre debe tener al menos 2 caracteres/i)).toBeInTheDocument();
            expect(screen.getByText(/Formato de email inválido/i)).toBeInTheDocument();
            expect(screen.getByText(/La contraseña debe tener al menos 8 caracteres/i)).toBeInTheDocument();
        });
    });
    it('should show generic error message if server response has no message', async () => {
        const alertMock = vi.spyOn(window, 'alert').mockImplementation(() => { });

        // Forzamos un error genérico sin mensaje detallado
        (authService.register as any).mockRejectedValue(new Error("Generic error"));

        render(
            <BrowserRouter>
                <RegisterView />
            </BrowserRouter>
        );

        // Rellenamos para pasar Zod
        fireEvent.change(screen.getByLabelText(/Nombre Completo/i), { target: { value: 'Test User' } });
        fireEvent.change(screen.getByLabelText(/Email/i), { target: { value: 'test@test.com' } });
        fireEvent.change(screen.getByLabelText(/Contraseña/i), { target: { value: 'Password123' } });

        fireEvent.click(screen.getByRole('button', { name: /Registrarse/i }));

        await waitFor(() => {
            // Esto obligará a entrar en la rama del "||" que estaba en amarillo
            expect(alertMock).toHaveBeenCalledWith("Error al registrarse");
        });
    });
});