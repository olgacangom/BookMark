import { render, screen, fireEvent } from '@testing-library/react';
import { MainLayout } from './MainLayout';
import { AuthProvider } from '../context/AuthContext';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<any>('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MainLayout', () => {
  const mockUser = { fullName: 'Olga Cantalejo', email: 'olga@test.com' };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('user', JSON.stringify(mockUser));
    localStorage.setItem('token', 'fake-token');
  });

  const renderWithProviders = () => {
    return render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/dashboard']}>
          <Routes>
            <Route path="/" element={<MainLayout />}>
              <Route path="dashboard" element={<div>Contenido del Dashboard</div>} />
              <Route path="library" element={<div>Contenido de Biblioteca</div>} />
            </Route>
            <Route path="/login" element={<div>Página de Login</div>} />
          </Routes>
        </MemoryRouter>
      </AuthProvider>
    );
  };

  it('debe renderizar el nombre de la app y los enlaces de navegación', () => {
    renderWithProviders();

    expect(screen.getByText(/BookMark/i)).toBeInTheDocument();
    expect(screen.getByText(/Tu espacio de lectura/i)).toBeInTheDocument();
    
    expect(screen.getByText('Inicio')).toBeInTheDocument();
    expect(screen.getByText('Biblioteca')).toBeInTheDocument();
  });

  it('debe mostrar el nombre completo del usuario logueado', () => {
    renderWithProviders();
    // El componente usa user?.fullName
    expect(screen.getByText('Olga Cantalejo')).toBeInTheDocument();
  });

  it('debe ejecutar logout y navegar a login al pulsar el botón de salida', () => {
    renderWithProviders();

    const logoutBtn = screen.getByTitle(/Cerrar Sesión/i);
    fireEvent.click(logoutBtn);

    expect(mockNavigate).toHaveBeenCalledWith('/login');
    
    expect(localStorage.getItem('token')).toBeNull();
  });

  it('debe renderizar el contenido secundario a través del Outlet', () => {
    renderWithProviders();
    expect(screen.getByText(/Contenido del Dashboard/i)).toBeInTheDocument();
  });
});