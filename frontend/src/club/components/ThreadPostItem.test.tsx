import { fireEvent, render, screen } from '@testing-library/react';
import { ThreadPostItem } from './ThreadPostItem';
import { ThreadPost } from '../service/club.service';

describe('ThreadPostItem', () => {
    const mockPost: ThreadPost = {
        id: '1', 
        content: 'Este es un mensaje secreto',
        spoilerPage: 10,
        createdAt: new Date().toISOString(),
        author: {
            id: '1',
            fullName: 'Autor Test',
            avatarUrl: ''
        }
    };

    it('debe renderizar un mensaje normal correctamente', () => {
        render(<ThreadPostItem post={mockPost} userCurrentPage={15} />);

        expect(screen.getByText('Este es un mensaje secreto')).toBeInTheDocument();
        expect(screen.queryByText(/Spoiler de la Pág./i)).not.toBeInTheDocument();
    });

    it('debe difuminar el mensaje si es un spoiler y el usuario no ha llegado a la página', () => {
        // El usuario está en la pág 5, el spoiler es la 10
        render(<ThreadPostItem post={mockPost} userCurrentPage={5} />);

        expect(screen.getByText(/Spoiler de la Pág. 10/i)).toBeInTheDocument();
        // Verificamos que el botón de revelar exista
        expect(screen.getByText(/Revelar mensaje/i)).toBeInTheDocument();
    });

    it('debe revelar el mensaje al hacer clic en el botón de "Revelar mensaje"', () => {
        render(<ThreadPostItem post={mockPost} userCurrentPage={5} />);

        const revealBtn = screen.getByText(/Revelar mensaje/i);
        fireEvent.click(revealBtn);

        expect(screen.queryByText(/Spoiler de la Pág. 10/i)).not.toBeInTheDocument();
        expect(screen.getByText('Este es un mensaje secreto')).toBeInTheDocument();
    });

    it('debe renderizar avatar por defecto si avatarUrl está vacío', () => {
        render(<ThreadPostItem post={mockPost} userCurrentPage={20} />);
        const avatar = screen.getByAltText('');
        expect(avatar).toHaveAttribute('src', expect.stringContaining('dicebear'));
    });
});