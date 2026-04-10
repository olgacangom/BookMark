import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FollowButton } from './FollowButton';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    post: vi.fn(),
  },
}));

describe('FollowButton Coverage', () => {
  const targetUserId = 'user-456';

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  it('debe renderizar el estado inicial "Seguir" cuando initialStatus es null', () => {
    render(<FollowButton targetUserId={targetUserId} initialStatus={null} />);
    expect(screen.getByText(/Seguir/i)).toBeInTheDocument();
  });

  it('debe renderizar el estado inicial "Solicitado" cuando initialStatus es PENDING', () => {
    render(<FollowButton targetUserId={targetUserId} initialStatus="PENDING" />);
    expect(screen.getByText(/Solicitado/i)).toBeInTheDocument();
  });

  it('debe renderizar el estado inicial "Siguiendo" cuando initialStatus es ACCEPTED', () => {
    render(<FollowButton targetUserId={targetUserId} initialStatus="ACCEPTED" />);
    expect(screen.getByText(/Siguiendo/i)).toBeInTheDocument();
  });

  it('debe llamar a seguir (follow) cuando el estado es null y cambiar a ACCEPTED', async () => {
    (api.post as any).mockResolvedValue({ data: { status: 'ACCEPTED' } });

    render(<FollowButton targetUserId={targetUserId} initialStatus={null} />);
    const button = screen.getByRole('button');
    fireEvent.click(button);

    expect(document.querySelector('.animate-spin')).toBeInTheDocument();

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(`/users/follow/${targetUserId}`);
      expect(screen.getByText(/Siguiendo/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a dejar de seguir (unfollow) cuando el estado es ACCEPTED', async () => {
    (api.post as any).mockResolvedValue({});

    render(<FollowButton targetUserId={targetUserId} initialStatus="ACCEPTED" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(`/users/unfollow/${targetUserId}`);
      expect(screen.getByText(/Seguir/i)).toBeInTheDocument();
    });
  });

  it('debe llamar a dejar de seguir (unfollow) cuando el estado es PENDING', async () => {
    (api.post as any).mockResolvedValue({});

    render(<FollowButton targetUserId={targetUserId} initialStatus="PENDING" />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(api.post).toHaveBeenCalledWith(`/users/unfollow/${targetUserId}`);
      expect(screen.getByText(/Seguir/i)).toBeInTheDocument();
    });
  });

  it('debe manejar errores de la API correctamente (bloque catch)', async () => {
    (api.post as any).mockRejectedValue(new Error('API Failure'));

    render(<FollowButton targetUserId={targetUserId} initialStatus={null} />);
    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(console.error).toHaveBeenCalledWith("Error al gestionar seguimiento", expect.any(Error));
      expect(document.querySelector('.animate-spin')).not.toBeInTheDocument();
    });
  });

  it('debe aplicar la className personalizada si se recibe por props', () => {
    const customClass = "my-custom-style";
    render(<FollowButton targetUserId={targetUserId} initialStatus={null} className={customClass} />);
    const button = screen.getByRole('button');
    expect(button).toHaveClass(customClass);
  });
});