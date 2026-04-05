import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';
import { RequestsView } from './RequestView';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('RequestsView Coverage', () => {
  const mockRequests = [
    {
      id: 'req-1',
      follower: {
        id: 'user-1',
        fullName: 'Olga Cantalejo',
        email: 'olga@test.com',
        avatarUrl: 'https://avatar.com/olga.png',
      },
      createdAt: '2024-01-01T10:00:00Z',
    },
    {
      id: 'req-2',
      follower: {
        id: 'user-2',
        fullName: 'Juan Perez',
        email: 'juan@test.com',
      },
      createdAt: '2024-01-01T11:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', 'fake-token');
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('debe mostrar el loader mientras carga', () => {
    (api.get as any).mockReturnValue(new Promise(() => {})); 
    render(<RequestsView />);
    expect(document.querySelector('.animate-spin')).toBeInTheDocument();
  });

  it('debe cargar y mostrar la lista de solicitudes', async () => {
    (api.get as any).mockResolvedValue({ data: mockRequests });
    render(<RequestsView />);

    await waitFor(() => {
      expect(screen.getByText('Olga Cantalejo')).toBeInTheDocument();
      expect(screen.getByText('Juan Perez')).toBeInTheDocument();
      expect(screen.getByText('@olga')).toBeInTheDocument();
    });
    
    expect(api.get).toHaveBeenCalledWith('/users/follow/requests', expect.objectContaining({
      headers: { Authorization: 'Bearer fake-token' }
    }));
  });

  it('debe mostrar el estado vacío si no hay solicitudes', async () => {
    (api.get as any).mockResolvedValue({ data: [] });
    render(<RequestsView />);

    await waitFor(() => {
      expect(screen.getByText(/No hay nuevas solicitudes/i)).toBeInTheDocument();
    });
  });

  it('debe aceptar una solicitud correctamente', async () => {
    (api.get as any).mockResolvedValue({ data: [mockRequests[0]] });
    (api.post as any).mockResolvedValue({});
    
    render(<RequestsView />);
    
    const confirmBtn = await screen.findByText(/Confirmar/i);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(`/users/follow/accept/${mockRequests[0].id}`);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('aceptada'));
      expect(screen.queryByText('Olga Cantalejo')).not.toBeInTheDocument();
    });
  });

  it('debe rechazar (eliminar) una solicitud correctamente', async () => {
    (api.get as any).mockResolvedValue({ data: [mockRequests[0]] });
    (api.delete as any).mockResolvedValue({});
    
    render(<RequestsView />);
    
    const deleteBtn = await screen.findByText(/Eliminar/i);
    fireEvent.click(deleteBtn);

    await waitFor(() => {
      expect(api.delete).toHaveBeenCalledWith(`/users/follow/decline/${mockRequests[0].id}`);
      expect(console.log).toHaveBeenCalledWith(expect.stringContaining('rechazada'));
      expect(screen.queryByText('Olga Cantalejo')).not.toBeInTheDocument();
    });
  });

  it('debe manejar error 401 (Unauthorized)', async () => {
    (api.get as any).mockRejectedValue({
      response: { status: 401 }
    });
    
    render(<RequestsView />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Sesión expirada'));
    });
  });

  it('debe manejar errores genéricos al cargar', async () => {
    (api.get as any).mockRejectedValue(new Error('Network Error'));
    
    render(<RequestsView />);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error al cargar solicitudes", expect.any(Error));
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('debe manejar errores al realizar una acción (aceptar)', async () => {
    (api.get as any).mockResolvedValue({ data: [mockRequests[0]] });
    (api.post as any).mockRejectedValue(new Error('Action Error'));
    
    render(<RequestsView />);
    
    const confirmBtn = await screen.findByText(/Confirmar/i);
    fireEvent.click(confirmBtn);

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error al accept solicitud'), expect.any(Error));
    });
  });
});