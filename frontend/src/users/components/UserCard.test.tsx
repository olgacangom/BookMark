import { render, screen, fireEvent } from '@testing-library/react';
import { UserCard } from './UserCard';
import { describe, it, expect, vi } from 'vitest';

vi.mock('./FollowButton', () => ({
  FollowButton: ({ targetUserId, initialStatus, className }: any) => (
    <button data-testid="mock-follow-button" data-user-id={targetUserId} data-status={initialStatus} className={className}>
      Follow
    </button>
  ),
}));

describe('UserCard Component', () => {
  const mockUser = {
    id: 'user-123',
    fullName: 'Olga Cantalejo',
    email: 'olga@test.com',
    followStatus: 'ACCEPTED' as const,
  };

  it('debe renderizar el nombre completo y el nombre de usuario extraído del email', () => {
    render(<UserCard user={mockUser} />);

    expect(screen.getByText('Olga Cantalejo')).toBeInTheDocument();
    expect(screen.getByText('@olga')).toBeInTheDocument();
  });

  it('debe mostrar el avatarUrl proporcionado si existe', () => {
    const userWithAvatar = { ...mockUser, avatarUrl: 'https://mi-foto.com/perfil.jpg' };
    render(<UserCard user={userWithAvatar} />);

    const img = screen.getByRole('img') as HTMLImageElement;
    expect(img.src).toBe('https://mi-foto.com/perfil.jpg');
    expect(img.alt).toBe('Olga Cantalejo');
  });

  it('debe mostrar un avatar de DiceBear si no se proporciona avatarUrl', () => {
    render(<UserCard user={mockUser} />);

    const img = screen.getByAltText('Avatar temporal') as HTMLImageElement;
    expect(img.src).toContain('api.dicebear.com');
    expect(img.src).toContain('seed=olga@test.com');
  });

  it('debe ejecutar la lógica de onError si falla la carga del avatarUrl original', () => {
    const userWithAvatar = { ...mockUser, avatarUrl: 'https://ruta-rota.com/error.jpg' };
    render(<UserCard user={userWithAvatar} />);

    const img = screen.getByRole('img') as HTMLImageElement;

    fireEvent.error(img);

    expect(img.src).toContain('api.dicebear.com');
    expect(img.src).toContain('seed=olga@test.com');
  });

  it('debe pasar las props correctas al componente FollowButton', () => {
    render(<UserCard user={mockUser} />);

    const followBtn = screen.getByTestId('mock-follow-button');
    
    expect(followBtn).toHaveAttribute('data-user-id', 'user-123');
    expect(followBtn).toHaveAttribute('data-status', 'ACCEPTED');
    expect(followBtn).toHaveClass('w-full !rounded-xl py-2');
  });

  it('debe manejar correctamente un followStatus nulo', () => {
    const userNoStatus = { ...mockUser, followStatus: null };
    render(<UserCard user={userNoStatus} />);

    const followBtn = screen.getByTestId('mock-follow-button');
    
    expect(followBtn.getAttribute('data-status')).toBeNull();
  });
});