import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

    const renderWithProviders = (initialPath = '/dashboard') => {
        return render(
            <AuthProvider>
                <MemoryRouter initialEntries={[initialPath]}>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route path="dashboard" element={<div>Contenido del Dashboard</div>} />
                            <Route path="library" element={<div>Contenido de Biblioteca</div>} />
                            <Route path="explorar" element={<div>Contenido de Explorar</div>} />
                            <Route path="feed" element={<div>Contenido de Feed</div>} />
                            <Route path="myprofile" element={<div>Página de Perfil</div>} />
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
        expect(screen.getByText('Explorar')).toBeInTheDocument();
        expect(screen.getByText('Feed')).toBeInTheDocument();
    });

    it('debe mostrar solo el primer nombre del usuario en el botón de perfil', () => {
        renderWithProviders();
        expect(screen.getByText('Olga')).toBeInTheDocument();
        expect(screen.queryByText('Olga Cantalejo')).not.toBeInTheDocument();
    });

    it('debe renderizar la inicial del usuario en el avatar', () => {
        renderWithProviders();
        expect(screen.getByText('O')).toBeInTheDocument();
    });

    it('debe aplicar estilos de color diferentes si el enlace está activo', () => {
        renderWithProviders('/library');
        
        const libraryLink = screen.getByText('Biblioteca');
        const homeLink = screen.getByText('Inicio');

        expect(libraryLink).toHaveClass('text-primary');
        expect(homeLink).not.toHaveClass('text-primary');
    });

    it('debe ejecutar logout y navegar a login al pulsar el botón de salida', async () => {
        renderWithProviders();

        const logoutBtn = screen.getByTitle(/Cerrar Sesión/i);
        fireEvent.click(logoutBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/login');
        
        await waitFor(() => {
            expect(localStorage.getItem('token')).toBeNull();
        });
    });

    it('debe permitir navegar a la página de perfil al hacer clic en el botón de usuario', () => {
        renderWithProviders();
        
        const profileBtn = screen.getByText('Olga').closest('a');
        expect(profileBtn).toHaveAttribute('href', '/myprofile');
    });

    it('debe renderizar el contenido secundario a través del Outlet', () => {
        renderWithProviders('/dashboard');
        expect(screen.getByText(/Contenido del Dashboard/i)).toBeInTheDocument();
    });
});