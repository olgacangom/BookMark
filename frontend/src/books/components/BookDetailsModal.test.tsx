import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BookDetailsModal } from './BookDetailsModal';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
    default: { get: vi.fn() }
}));

describe('BookDetailsModal', () => {
    const mockBook = {
        id: 1,
        title: 'Test Book',
        author: 'Test Author',
        urlPortada: 'http://test.com/test.jpg',
        genre: 'Fantasía',
        pageCount: 300,
        description: 'Una gran historia'
    };

    const mockProps = {
        isOpen: true,
        onClose: vi.fn(),
        book: mockBook as any
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('no debe renderizar nada si isOpen es false', () => {
        const { container } = render(<BookDetailsModal {...mockProps} isOpen={false} />);
        expect(container.firstChild).toBeNull();
    });

    it('debe mostrar el loader mientras carga las librerías', async () => {
        vi.mocked(api.get).mockReturnValue(new Promise(() => { }));
        render(<BookDetailsModal {...mockProps} />);

        const loader = screen.getByRole('status', { name: /cargando librerías/i });

        expect(loader).toBeInTheDocument();
    });

    it('debe renderizar los detalles del libro y las librerías encontradas', async () => {
        const mockStores = [{
            inventoryId: 1,
            store: { libraryName: 'Librería Central', libraryAddress: 'Calle Falsa 123', libraryPhone: '123456' }
        }];
        vi.mocked(api.get).mockResolvedValue({ data: mockStores });

        render(<BookDetailsModal {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText('Librería Central')).toBeInTheDocument();
        });
        expect(screen.getByText('Test Book')).toBeInTheDocument();
        expect(screen.getByText('Una gran historia')).toBeInTheDocument();
    });

    it('debe mostrar mensaje cuando no hay librerías cercanas', async () => {
        vi.mocked(api.get).mockResolvedValue({ data: [] });

        render(<BookDetailsModal {...mockProps} />);

        await waitFor(() => {
            expect(screen.getByText(/No disponible en librerías cercanas/i)).toBeInTheDocument();
        });
    });

    it('debe manejar errores en la petición de librerías', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(api.get).mockRejectedValue(new Error('API Error'));

        render(<BookDetailsModal {...mockProps} />);

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalled();
        });
        consoleSpy.mockRestore();
    });
});