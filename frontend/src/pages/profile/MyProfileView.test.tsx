import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MyProfileView } from './MyProfileView';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
    const actual = await vi.importActual<any>('react-router-dom');
    return { ...actual, useNavigate: () => mockNavigate };
});

vi.mock('../../services/api', () => ({
    default: { patch: vi.fn() }
}));

describe('MyProfileView Complete Coverage', () => {
    const mockUser = { id: '1', fullName: 'Olga', email: 'olga@test.com', bio: 'Bio antigua', isPublic: true };

    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.setItem('user', JSON.stringify(mockUser));
        localStorage.setItem('token', 'token-valido');
        vi.spyOn(console, 'error').mockImplementation(() => {});
        vi.spyOn(console, 'log').mockImplementation(() => {});
    });

    it('debe actualizar el nombre y la bio con éxito', async () => {
        const newData = { ...mockUser, fullName: 'Olga Editada', bio: 'Nueva Bio' };
        vi.mocked(api.patch).mockResolvedValue({ data: newData });

        render(<AuthProvider><BrowserRouter><MyProfileView /></BrowserRouter></AuthProvider>);

        fireEvent.click(screen.getByRole('button', { name: /Editar/i }));

        const nameInput = screen.getByDisplayValue('Olga');
        const bioInput = screen.getByDisplayValue('Bio antigua');

        fireEvent.change(nameInput, { target: { value: 'Olga Editada' } });
        fireEvent.change(bioInput, { target: { value: 'Nueva Bio' } });

        fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

        await waitFor(() => {
            expect(api.patch).toHaveBeenCalled();
            expect(console.log).toHaveBeenCalledWith("✅ Perfil actualizado y persistido");
            expect(screen.getByText('Olga Editada')).toBeInTheDocument();
            expect(screen.queryByDisplayValue('Olga Editada')).not.toBeInTheDocument();
        });
    });

    it('debe cerrar sesión correctamente', () => {
        render(<AuthProvider><BrowserRouter><MyProfileView /></BrowserRouter></AuthProvider>);
        
        const logoutBtn = screen.getByTitle(/Cerrar Sesión/i);
        fireEvent.click(logoutBtn);

        expect(mockNavigate).toHaveBeenCalledWith('/login');
        expect(localStorage.getItem('token')).toBeNull();
    });

    it('debe manejar errores al guardar el perfil', async () => {
        vi.mocked(api.patch).mockRejectedValue(new Error('Fail'));
        render(<AuthProvider><BrowserRouter><MyProfileView /></BrowserRouter></AuthProvider>);

        fireEvent.click(screen.getByRole('button', { name: /Editar/i }));
        fireEvent.click(screen.getByRole('button', { name: /Guardar/i }));

        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith("❌ Error al guardar perfil:", expect.any(Error));
        });
    });

    it('debe interactuar con el switch de privacidad', () => {
        render(<AuthProvider><BrowserRouter><MyProfileView /></BrowserRouter></AuthProvider>);
        
        const privacyHeading = screen.getByText(/Visibilidad del perfil/i);
        const container = privacyHeading.closest('.justify-between');
        const switchBtn = within(container as HTMLElement).getByRole('button');
        
        fireEvent.click(switchBtn);
        expect(screen.getByText(/Tu biblioteca es privada/i)).toBeInTheDocument();
    });

    it('debe renderizar el botón de cámara', () => {
        render(<AuthProvider><BrowserRouter><MyProfileView /></BrowserRouter></AuthProvider>);
        
        const cameraButtons = screen.getAllByRole('button').filter(btn => 
            btn.innerHTML.includes('lucide-camera')
        );
        
        fireEvent.click(cameraButtons[0]);
        expect(cameraButtons.length).toBeGreaterThan(0);
    });

    it('debe mostrar el texto por defecto cuando la biografía está vacía', () => {
  const userNoBio = { 
    id: '1', 
    fullName: 'Olga', 
    email: 'olga@test.com', 
    bio: '', 
    isPublic: true 
  };
  localStorage.setItem('user', JSON.stringify(userNoBio));

  render(
    <AuthProvider>
      <BrowserRouter>
        <MyProfileView />
      </BrowserRouter>
    </AuthProvider>
  );

  expect(screen.getByText(/Aún no has escrito nada sobre ti/i)).toBeInTheDocument();
});
});