import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import App from './App';
import * as AuthContext from './context/AuthContext';

vi.mock('./pages/auth/LoginView', () => ({ LoginView: () => <div>Login Page</div> }));
vi.mock('./users/pages/ExploreView', () => ({ ExploreView: () => <div>Explore Page</div> }));
vi.mock('./pages/admin/AdminUserListView', () => ({ AdminUserListView: () => <div>Admin Page</div> }));
vi.mock('./pages/librero/LibreroCatalogoView', () => ({ LibreroCatalogView: () => <div>Librero Page</div> }));

vi.mock('./layouts/MainLayout', () => ({ MainLayout: () => <div data-testid="main-layout"><Outlet /></div> }));
vi.mock('./components/ProtectedRoute', () => ({ ProtectedRoute: ({ children }: any) => <>{children || <Outlet />}</> }));

import { Outlet } from 'react-router-dom';

describe('App Routing', () => {
  it('redirige a login si no está autenticado y accede a la raíz', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ user: null } as any);
    
    // Forzamos la navegación a la raíz
    window.history.pushState({}, 'Test page', '/');
    
    render(<App />);
    expect(screen.getByText('Login Page')).toBeInTheDocument();
  });

  it('redirige a explore si el usuario es un lector normal', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
      user: { role: 'user' } 
    } as any);

    window.history.pushState({}, 'Test page', '/');
    
    render(<App />);
    // Debería redirigir a /explore
    expect(screen.getByText('Explore Page')).toBeInTheDocument();
  });

  it('redirige a admin/users si el usuario es admin', () => {
    vi.spyOn(AuthContext, 'useAuth').mockReturnValue({ 
      user: { role: 'admin' } 
    } as any);

    window.history.pushState({}, 'Test page', '/');
    
    render(<App />);
    expect(screen.getByText('Admin Page')).toBeInTheDocument();
  });
});