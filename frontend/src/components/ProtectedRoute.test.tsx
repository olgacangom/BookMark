import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { useAuth } from '../context/AuthContext';
import { vi } from 'vitest';

vi.mock('../context/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('ProtectedRoute', () => {
  const mockedUseAuth = useAuth as jest.Mock;

  it('debe mostrar "Cargando..." cuando el estado es loading', () => {
    mockedUseAuth.mockReturnValue({ loading: true });
    render(<ProtectedRoute />);
    expect(screen.getByText(/Cargando.../i)).toBeInTheDocument();
  });

  it('debe redirigir a /login cuando no está autenticado', () => {
    mockedUseAuth.mockReturnValue({ loading: false, isAuthenticated: false });
    
    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/login" element={<div>Login Page</div>} />
          <Route path="/protected" element={<ProtectedRoute />} />
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('debe renderizar el contenido (Outlet) cuando el usuario está autenticado y no hay restricción de roles', () => {
    mockedUseAuth.mockReturnValue({ 
      loading: false, 
      isAuthenticated: true, 
      user: { role: 'user' } 
    });

    render(
      <MemoryRouter initialEntries={['/protected']}>
        <Routes>
          <Route path="/protected" element={<ProtectedRoute />}>
            <Route index element={<div>Contenido Protegido</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    );

    expect(screen.getByText('Contenido Protegido')).toBeInTheDocument();
  });

  it('debe mostrar error de acceso restringido si el rol no coincide', () => {
    mockedUseAuth.mockReturnValue({ 
      loading: false, 
      isAuthenticated: true, 
      user: { role: 'user' } 
    });

    render(<ProtectedRoute roles={['admin']} />);

    expect(screen.getByText(/Acceso restringido/i)).toBeInTheDocument();
    expect(screen.getByText(/No tienes permisos para ver esta sección/i)).toBeInTheDocument();
  });
});