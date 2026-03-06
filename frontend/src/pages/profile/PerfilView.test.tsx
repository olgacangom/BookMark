import { render, screen, waitFor } from '@testing-library/react';
import { PerfilView } from './PerfilView';
import { AuthProvider } from '../../context/AuthContext';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
  },
}));

describe('PerfilView', () => {
  const mockCurrentUser = { id: '1', fullName: 'Mi Usuario', email: 'yo@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify(mockCurrentUser));
    localStorage.setItem('token', 'fake-token');
  });

  const renderWithProviders = (ui: React.ReactElement, initialPath: string) => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/profile/:id" element={ui} />
            <Route path="/dashboard" element={<div>Dashboard</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('debe mostrar el estado de carga inicialmente', () => {
    vi.mocked(api.get).mockReturnValue(new Promise(() => {}));
    
    renderWithProviders(<PerfilView />, '/profile/2');
    expect(screen.getByText(/Cargando perfil.../i)).toBeInTheDocument();
  });

  it('debe mostrar el perfil si es público', async () => {
    const targetUser = { 
      id: '2', 
      fullName: 'Juan Lector', 
      email: 'juan@test.com', 
      isPublic: true,
      avatarUrl: null 
    };
    
    vi.mocked(api.get).mockResolvedValue({ data: targetUser });

    renderWithProviders(<PerfilView />, '/profile/2');

    const nameElement = await screen.findByText('Juan Lector');
    expect(nameElement).toBeInTheDocument();
    expect(screen.getByText(/@juan/i)).toBeInTheDocument();
    expect(screen.getByText(/Seguir/i)).toBeInTheDocument();
  });

  it('debe mostrar "Perfil Privado" si el usuario no es público y no soy yo', async () => {
    const targetUser = { 
      id: '2', 
      fullName: 'Usuario Privado', 
      email: 'privado@test.com', 
      isPublic: false 
    };
    
    vi.mocked(api.get).mockResolvedValue({ data: targetUser });

    renderWithProviders(<PerfilView />, '/profile/2');

    await waitFor(() => {
      expect(screen.getByText(/Perfil Privado/i)).toBeInTheDocument();
      expect(screen.getByText(/Este usuario prefiere mantener su biblioteca en privado/i)).toBeInTheDocument();
    });
  });

  it('debe mostrar el perfil aunque sea privado si el ID coincide con el usuario actual', async () => {
    const targetUser = { 
      id: '1', 
      fullName: 'Mi Usuario', 
      email: 'yo@test.com', 
      isPublic: false 
    };
    
    vi.mocked(api.get).mockResolvedValue({ data: targetUser });

    renderWithProviders(<PerfilView />, '/profile/1');

    const nameElement = await screen.findByText('Mi Usuario');
    expect(nameElement).toBeInTheDocument();
    // No debería mostrar el mensaje de "Perfil Privado"
    expect(screen.queryByText(/Perfil Privado/i)).not.toBeInTheDocument();
  });

  it('debe manejar el error si el usuario no existe', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(api.get).mockRejectedValue(new Error('404 Not Found'));

    renderWithProviders(<PerfilView />, '/profile/999');

    await waitFor(() => {
      expect(screen.getByText(/Perfil Privado/i)).toBeInTheDocument();
      expect(consoleSpy).toHaveBeenCalledWith("Usuario no encontrado");
    });
    
    consoleSpy.mockRestore();
  });
});