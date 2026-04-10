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
        localStorage.clear(); // Limpieza profunda del storage
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('token', 'fake-token');
        // Resetear el ancho de la ventana para tests de responsive
        vi.stubGlobal('innerWidth', 1024);
    });

    const renderWithProviders = (initialPath = '/dashboard') => {
        return render(
            <AuthProvider>
                <MemoryRouter initialEntries={[initialPath]}>
                    <Routes>
                        <Route path="/" element={<MainLayout />}>
                            <Route path="dashboard" element={<div>Contenido del Dashboard</div>} />
                            <Route path="library" element={<div>Contenido de Biblioteca</div>} />
                            <Route path="explore" element={<div>Contenido de Explorar</div>} />
                            <Route path="requests" element={<div>Contenido de Solicitudes</div>} />
                            <Route path="myprofile" element={<div>Página de Perfil</div>} />
                        </Route>
                        <Route path="/login" element={<div>Página de Login</div>} />
                    </Routes>
                </MemoryRouter>
            </AuthProvider>
        );
    };

    it('debe renderizar el logo y los enlaces principales de escritorio', () => {
        renderWithProviders();
        expect(screen.getByText('BookMark')).toBeInTheDocument();
        
        expect(screen.getByText('Inicio')).toBeInTheDocument();
        expect(screen.getByText('Biblioteca')).toBeInTheDocument();
        expect(screen.getByText('Explorar')).toBeInTheDocument();
        expect(screen.getByText('Solicitudes')).toBeInTheDocument();
    });

    it('debe mostrar el nombre corto del usuario y la inicial en el avatar', () => {
        renderWithProviders();
        expect(screen.getByText('Olga')).toBeInTheDocument();
        expect(screen.getByText('O')).toBeInTheDocument();
    });

    it('debe resaltar el enlace activo', () => {
        // Cambiamos a /explore para que coincida con la ruta del componente
        renderWithProviders('/explore');
        const exploreLink = screen.getByText('Explorar');
        expect(exploreLink).toHaveClass('text-primary');
    });

    it('debe cerrar sesión desde el botón de escritorio', async () => {
        renderWithProviders();
        // El botón de escritorio tiene title="Cerrar Sesión"
        const logoutBtn = screen.getByTitle(/Cerrar Sesión/i);
        fireEvent.click(logoutBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/login');
        await waitFor(() => {
            expect(localStorage.getItem('token')).toBeNull();
        });
    });

    describe('Menú Móvil', () => {
        beforeEach(() => {
            vi.stubGlobal('innerWidth', 375); // Simular móvil
            // Disparar evento de resize para que React lo detecte si fuera necesario
            window.dispatchEvent(new Event('resize'));
        });

        it('debe abrir y cerrar el menú móvil al pulsar el botón hamburguesa', () => {
            renderWithProviders();
            
            const menuBtn = screen.getByLabelText('Menu');
            
            // Abrir
            fireEvent.click(menuBtn);
            const mobileLinks = screen.getAllByText('Inicio');
            expect(mobileLinks.length).toBeGreaterThan(1); 
            
            // Cerrar pulsando la X (el mismo botón cambia de icono pero mantiene el aria-label)
            fireEvent.click(menuBtn);
            // Al cerrarse, el botón de "Cerrar Sesión" del menú móvil desaparece
            expect(screen.queryByText(/Cerrar Sesión/i, { selector: 'button' })).not.toBeInTheDocument();
        });

        it('debe cerrar el menú al hacer clic en un enlace móvil', () => {
            renderWithProviders();
            const menuBtn = screen.getByLabelText('Menu');
            fireEvent.click(menuBtn); 
            
            // Seleccionamos el enlace "Explorar" que está dentro del menú móvil (suele ser el segundo)
            const exploreMobileLink = screen.getAllByText('Explorar')[1]; 
            fireEvent.click(exploreMobileLink);
            
            // El menú debe cerrarse (buscamos el botón de logout del menú móvil que ya no debería estar)
            expect(screen.queryByText(/Cerrar Sesión/i, { selector: 'button' })).not.toBeInTheDocument();
        });

        it('debe cerrar sesión desde el menú móvil', async () => {
            renderWithProviders();
            const menuBtn = screen.getByLabelText('Menu');
            fireEvent.click(menuBtn);
            
            // Buscamos el botón de texto que está dentro del menú móvil
            const logoutMobileBtn = screen.getByText(/Cerrar Sesión/i, { selector: 'button' });
            fireEvent.click(logoutMobileBtn);

            expect(mockNavigate).toHaveBeenCalledWith('/login');
            await waitFor(() => {
                expect(localStorage.getItem('token')).toBeNull();
            });
        });
    });

    it('debe renderizar el contenido de las rutas hijas (Outlet)', () => {
        renderWithProviders('/library');
        expect(screen.getByText('Contenido de Biblioteca')).toBeInTheDocument();
    });

    it('debe mostrar "Perfil" si el usuario no tiene nombre en el contexto', () => {
        localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));
        renderWithProviders();
        expect(screen.getByText('Perfil')).toBeInTheDocument();
    });

    it('debe aplicar estilos activos al botón de perfil cuando la ruta es /myprofile', () => {
        renderWithProviders('/myprofile');

        const profileLink = screen.getByText('Olga').closest('a');
        
        expect(profileLink).toHaveClass('bg-primary/10');
        expect(profileLink).toHaveClass('border-primary/20');
        
        expect(profileLink).not.toHaveClass('bg-[#e8e4e0]');
    });
});