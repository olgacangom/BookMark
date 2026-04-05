import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MyProfileView } from './MyProfileView';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
  },
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return { ...actual, useNavigate: () => mockNavigate };
});

describe('MyProfileView Complete Coverage', () => {
  const mockUser = {
    id: 'uuid-123',
    fullName: 'Olga',
    email: 'olga@test.com',
    bio: '',
    isPublic: true,
    avatarUrl: null,
    followers: [],
    following: [],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'fake-token');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.spyOn(window, 'alert').mockImplementation(() => {});
    
    (api.get as any).mockResolvedValue({ data: mockUser });
  });

  const renderComponent = () =>
    render(
      <AuthProvider>
        <BrowserRouter>
          <MyProfileView />
        </BrowserRouter>
      </AuthProvider>
    );

  it('debe mostrar el texto por defecto cuando la biografía está vacía', async () => {
    renderComponent();
    expect(screen.getByText(/Escribe algo sobre ti para que la comunidad te conozca.../i)).toBeInTheDocument();
  });

  it('debe entrar en modo edición y actualizar el nombre y la bio con éxito', async () => {
    const updatedUser = { ...mockUser, fullName: 'Olga Editada', bio: 'Nueva Bio' };
    (api.patch as any).mockResolvedValue({ data: updatedUser });

    renderComponent();

    fireEvent.click(screen.getByText(/Editar/i));

    const textboxes = screen.getAllByRole('textbox');
    const nameInput = textboxes[0];
    const bioInput = textboxes[1];

    fireEvent.change(nameInput, { target: { value: 'Olga Editada' } });
    fireEvent.change(bioInput, { target: { value: 'Nueva Bio' } });

    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/profile', expect.objectContaining({
        fullName: 'Olga Editada',
        bio: 'Nueva Bio'
      }));
      expect(console.log).toHaveBeenCalledWith("✅ Perfil actualizado correctamente");
    });
  });

  it('debe interactuar con el switch de privacidad con éxito', async () => {
    (api.patch as any).mockResolvedValue({ data: { ...mockUser, isPublic: false } });
    renderComponent();
    const buttons = screen.getAllByRole('button');
    const switchBtn = buttons[buttons.length - 1];

    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(screen.getByText(/Perfil privado/i)).toBeInTheDocument();
      expect(console.log).toHaveBeenCalledWith("✅ Privacidad actualizada");
    });
  });


  it('debe manejar error al cambiar la privacidad (catch block)', async () => {
    (api.patch as any).mockRejectedValue(new Error('Privacy Error'));
    renderComponent();
    
    const buttons = screen.getAllByRole('button');
    const switchBtn = buttons[buttons.length - 1];

    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("❌ Error al cambiar privacidad", expect.any(Error));
      expect(screen.getByText(/Perfil visible para todos/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar error si el token no existe al intentar guardar', async () => {
    renderComponent();
    localStorage.removeItem('token');

    fireEvent.click(screen.getByText(/Editar/i));
    fireEvent.click(screen.getByText(/Guardar/i));

    expect(window.alert).toHaveBeenCalledWith("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('debe manejar error en el refresco inicial de datos (catch block)', async () => {
    (api.get as any).mockRejectedValue(new Error('Refresh Error'));
    
    renderComponent();

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error al refrescar contadores:", expect.any(Error));
    });
  });


  it('debe manejar errores genéricos al intentar guardar', async () => {
    (api.patch as any).mockRejectedValue(new Error('Network Error'));
    renderComponent();
    
    fireEvent.click(screen.getByText(/Editar/i));
    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Error al conectar con el servidor. Revisa tu conexión.");
    });
  });

  it('debe redirigir al login si el token expira (401) durante el guardado', async () => {
    (api.patch as any).mockRejectedValue({ response: { status: 401 } });
    renderComponent();
    
    fireEvent.click(screen.getByText(/Editar/i));
    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/login');
    });
  });
});