import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FollowButton } from './FollowButton';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('FollowButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('debe renderizar estado inicial "Seguir" (null)', () => {
    render(<FollowButton targetUserId="u1" initialStatus={null} />);
    expect(screen.getByText('Seguir')).toBeDefined();
  });

  it('debe llamar a la API al hacer clic en "Seguir"', async () => {
    vi.mocked(api.post).mockResolvedValue({ data: { status: 'ACCEPTED' } });

    render(<FollowButton targetUserId="u1" initialStatus={null} />);
    fireEvent.click(screen.getByText('Seguir'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/follow/u1');
    });
    expect(screen.getByText('Siguiendo')).toBeDefined();
  });

  it('debe cancelar una solicitud pendiente (PENDING)', async () => {
    vi.mocked(api.post).mockResolvedValue({});

    render(<FollowButton targetUserId="u1" initialStatus="PENDING" />);
    fireEvent.click(screen.getByText('Solicitado'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/unfollow/u1');
    });
    expect(screen.getByText('Seguir')).toBeDefined();
  });

  it('debe mostrar el modal al intentar dejar de seguir (ACCEPTED)', async () => {
    render(<FollowButton targetUserId="u1" initialStatus="ACCEPTED" />);

    fireEvent.click(screen.getByText('Siguiendo'));

    // El modal debería aparecer
    expect(screen.getByText('¿Dejar de seguir?')).toBeDefined();
  });

  it('debe ejecutar confirmUnfollow al confirmar en el modal', async () => {
    vi.mocked(api.post).mockResolvedValue({});

    render(<FollowButton targetUserId="u1" initialStatus="ACCEPTED" />);

    // Abrir modal
    fireEvent.click(screen.getByText('Siguiendo'));

    // Confirmar
    fireEvent.click(screen.getByText('Dejar de seguir'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith('/users/unfollow/u1');
    });
    expect(screen.getByText('Seguir')).toBeDefined();
  });

  it('debe manejar errores en handleFollow (en el bloque catch)', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('API Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    render(<FollowButton targetUserId="u1" initialStatus={null} />);
    fireEvent.click(screen.getByText('Seguir'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalled();
    });

    expect(consoleSpy).toHaveBeenCalled();

    consoleSpy.mockRestore(); 
  });

  it('debe manejar errores en confirmUnfollow (en el bloque catch)', async () => {
    vi.mocked(api.post).mockRejectedValue(new Error('Unfollow Error'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

    render(<FollowButton targetUserId="u1" initialStatus="ACCEPTED" />);

    // Abrir modal y confirmar
    fireEvent.click(screen.getByText('Siguiendo'));
    fireEvent.click(screen.getByText('Dejar de seguir'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
    });

    consoleSpy.mockRestore();
  });
});