import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MyProfileView } from './MyProfileView';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';

vi.mock('../../context/AuthContext');
vi.mock('react-router-dom');
vi.mock('../../services/api');
vi.mock('../../users/components/LevelProgress', () => ({
  LevelProgress: () => <div data-testid="level-progress" />
}));

const mockUser = {
  id: '123',
  fullName: 'Olguí Test',
  email: 'olgui@test.com',
  bio: 'Mi bio de prueba',
  avatarUrl: null,
  isPublic: true,
  stats: { level: 3, xp: 450, currentStreak: 1 },
  badges: [{ id: 'b1', name: 'Medalla 1', description: 'Desc', icon: '📚' }],
  followers: [],
  following: []
};

describe('MyProfileView Component', () => {
  const mockUpdateUser = vi.fn();
  const mockLogout = vi.fn();
  const mockNavigate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useAuth as any).mockReturnValue({
      user: mockUser,
      updateUser: mockUpdateUser,
      logout: mockLogout
    });
    (useNavigate as any).mockReturnValue(mockNavigate);

    const localStorageMock = (() => {
      let store: Record<string, string> = { token: 'fake-token' };
      return {
        getItem: (key: string) => store[key] || null,
        setItem: (key: string, value: string) => { store[key] = value },
        clear: () => { store = {} }
      };
    })();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });

    vi.spyOn(window, 'alert').mockImplementation(() => { });
  });

  it('debe retornar null si no hay usuario', () => {
    (useAuth as any).mockReturnValue({ user: null });
    const { container } = render(<MyProfileView />);
    expect(container.firstChild).toBeNull();
  });

  it('debe sincronizar datos de gamificación al montar', async () => {
    (api.get as any).mockResolvedValue({ data: { ...mockUser, xp: 500 } });
    render(<MyProfileView />);

    await waitFor(() => {
      expect(api.get).toHaveBeenCalledWith(`/users/${mockUser.id}`);
      expect(mockUpdateUser).toHaveBeenCalled();
    });
  });

  it('debe cambiar a modo edición y actualizar los campos', () => {
    render(<MyProfileView />);

    const editBtn = screen.getByText(/Editar/i);
    fireEvent.click(editBtn);

    const nameInput = screen.getByDisplayValue(mockUser.fullName);
    fireEvent.change(nameInput, { target: { value: 'Nuevo Nombre' } });

    expect(screen.getByDisplayValue('Nuevo Nombre')).toBeDefined();
  });

  it('debe fallar el guardado si no hay token en localStorage', async () => {
    window.localStorage.clear();
    render(<MyProfileView />);

    fireEvent.click(screen.getByText(/Editar/i));
    fireEvent.click(screen.getByText(/Guardar/i));

    expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("expirado"));
    expect(mockLogout).toHaveBeenCalled();
    expect(mockNavigate).toHaveBeenCalledWith('/login');
  });

  it('debe guardar los cambios correctamente (Happy Path)', async () => {
    (api.patch as any).mockResolvedValue({ data: { ...mockUser, fullName: 'Update' } });
    render(<MyProfileView />);

    fireEvent.click(screen.getByText(/Editar/i));
    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/profile', expect.any(Object));
      expect(mockUpdateUser).toHaveBeenCalled();
      expect(screen.queryByText(/Guardar/i)).toBeNull(); // Vuelve a modo lectura
    });
  });

  it('debe manejar error 401 al guardar', async () => {
    (api.patch as any).mockRejectedValue({ response: { status: 401 } });
    render(<MyProfileView />);

    fireEvent.click(screen.getByText(/Editar/i));
    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith(expect.stringContaining("Sesión no válida"));
      expect(mockLogout).toHaveBeenCalled();
    });
  });

  it('debe alternar la privacidad desde el switch', async () => {
    (api.patch as any).mockResolvedValue({ data: { ...mockUser, isPublic: false } });
    render(<MyProfileView />);

    const switchBtn = screen.getByLabelText(/cambiar visibilidad del perfil/i);
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(api.patch).toHaveBeenCalledWith('/users/profile', expect.objectContaining({
        isPublic: false
      }));
      expect(mockUpdateUser).toHaveBeenCalled();
    });
  });

  it('debe mostrar medallas y placeholders si tiene menos de 4', () => {
    render(<MyProfileView />);
    expect(screen.getByText('Medalla 1')).toBeDefined();
    expect(screen.getByText('Próximamente')).toBeDefined();
  });

  it('debe manejar el error cuando falla la sincronización inicial', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (api.get as any).mockRejectedValue(new Error('Network Error'));
    
    render(<MyProfileView />);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error al refrescar datos:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('debe manejar un error genérico del servidor al guardar el perfil', async () => {
    (api.patch as any).mockRejectedValue({ 
      response: { status: 500 } 
    });

    render(<MyProfileView />);
    
    fireEvent.click(screen.getByText(/Editar/i));
    fireEvent.click(screen.getByText(/Guardar/i));

    await waitFor(() => {
      expect(window.alert).toHaveBeenCalledWith("Error al conectar con el servidor. Revisa tu conexión.");
    });
  });

  it('debe manejar el error y revertir el estado cuando falla el switch de privacidad', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    (api.patch as any).mockRejectedValue(new Error('Update failed'));

    render(<MyProfileView />);
    
    const switchBtn = screen.getByLabelText(/cambiar visibilidad del perfil/i);
    fireEvent.click(switchBtn);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("❌ Error al cambiar privacidad", expect.any(Error));
    });

    const switchCircle = screen.getByLabelText(/cambiar visibilidad del perfil/i).firstChild;
    expect(switchCircle).toHaveClass('left-6 md:left-7'); 
    
    consoleSpy.mockRestore();
  });
});