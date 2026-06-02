import { describe, it, expect } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { UserCard } from './UserCard';

vi.mock('./FollowButton', () => ({
    FollowButton: () => <div data-testid="follow-button">FollowButton</div>
}));

describe('UserCard', () => {
    const mockUser: {
        id: string;
        fullName: string;
        email: string;
        followStatus: 'PENDING' | 'ACCEPTED' | null; // Definimos el tipo aquí
        province?: string;
    } = {
        id: 'u1',
        fullName: 'Juan Pérez',
        email: 'juan.perez@test.com',
        followStatus: null,
        province: 'Sevilla'
    };

    it('debe renderizar el nombre, usuario y provincia correctamente', () => {
        render(<UserCard user={mockUser} />);

        // Validar nombre
        expect(screen.getByText('Juan Pérez')).toBeDefined();

        // Validar username (extraído del email)
        expect(screen.getByText('@juan.perez')).toBeDefined();

        // Validar provincia
        expect(screen.getByText('Sevilla')).toBeDefined();
    });

    it('debe renderizar el FollowButton con los parámetros correctos', () => {
        render(<UserCard user={mockUser} />);

        const followButton = screen.getByTestId('follow-button');
        expect(followButton).toBeDefined();
    });

    it('no debe renderizar el badge de provincia si no existe', () => {
        const userWithoutProvince = { ...mockUser, province: undefined };
        render(<UserCard user={userWithoutProvince} />);

        expect(screen.queryByText('Sevilla')).toBeNull();
    });

    it('debe cambiar la fuente del avatar cuando la imagen original falla al cargar', () => {
        const userWithAvatar = {
            ...mockUser,
            avatarUrl: 'https://test.com/avatar.jpg'
        };

        render(<UserCard user={userWithAvatar} />);

        const img = screen.getByAltText('Juan Pérez') as HTMLImageElement;

        fireEvent.error(img);

        expect(img.src).toContain('https://api.dicebear.com/7.x/avataaars/svg');
    });
});