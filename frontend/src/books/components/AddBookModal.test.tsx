import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddBookModal } from './AddBookModal';
import axios from 'axios';

vi.mock('axios');
vi.mock('./ScannerModal', () => ({
    ScannerModal: ({ isOpen, onScanSuccess }: any) =>
        isOpen ? (
            <div data-testid="scanner-modal">
                <button data-testid="simulate-scan" onClick={() => onScanSuccess('9781234567890')}>
                    Simular Escaneo
                </button>
            </div>
        ) : null
}));

describe('AddBookModal', () => {
    const mockProps = {
        isOpen: true,
        onClose: vi.fn(),
        onSuccess: vi.fn(),
        onError: vi.fn(),
        createBook: vi.fn().mockImplementation(() => Promise.resolve({})),
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('debe renderizar correctamente cuando está abierto', () => {
        render(<AddBookModal {...mockProps} />);
        expect(screen.getByText('Añadir Libro')).toBeInTheDocument();
    });

    it('debe llamar a createBook al enviar el formulario', async () => {
        render(<AddBookModal {...mockProps} />);

        fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'El Quijote' } });
        fireEvent.change(screen.getByPlaceholderText('Autor'), { target: { value: 'Cervantes' } });

        fireEvent.click(screen.getByText('AÑADIR LIBRO'));

        await waitFor(() => {
            expect(mockProps.createBook).toHaveBeenCalled();
        });
        expect(mockProps.onSuccess).toHaveBeenCalled();
    });

    it('debe llamar a onError cuando la creación falla', async () => {
        mockProps.createBook.mockRejectedValueOnce({ response: { data: { message: 'Error al guardar' } } });

        render(<AddBookModal {...mockProps} />);

        fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'Test' } });
        fireEvent.change(screen.getByPlaceholderText('Autor'), { target: { value: 'Test' } });

        fireEvent.click(screen.getByText('AÑADIR LIBRO'));

        await waitFor(() => {
            expect(mockProps.onError).toHaveBeenCalledWith('Error al guardar');
        });
    });

    it('debe ejecutar la búsqueda por ISBN', async () => {
        const mockBookData = { title: 'Libro Encontrado', author: 'Autor Test', pageCount: 200 };
        vi.mocked(axios.get).mockResolvedValue({ data: mockBookData });

        render(<AddBookModal {...mockProps} />);

        const isbnInput = screen.getByPlaceholderText('978...');
        fireEvent.change(isbnInput, { target: { value: '1234567890' } });

        const botonesBuscar = screen.getAllByRole('button', { name: 'Buscar' });
        fireEvent.click(botonesBuscar[0]);

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalled();
            expect(screen.getByDisplayValue('Libro Encontrado')).toBeInTheDocument();
        });
    });

    it('debe precargar los datos del libro en modo edición', () => {
        const mockBook = {
            title: 'Libro Antiguo',
            author: 'Autor A',
            isbn: '9781234567890',
            pageCount: 300,
            status: 'Read',
            rating: 5
        };
        render(<AddBookModal {...mockProps} book={mockBook as any} />);

        expect(screen.getByDisplayValue('Libro Antiguo')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Autor A')).toBeInTheDocument();
        expect(screen.getByText('GUARDAR')).toBeInTheDocument();
    });

    it('debe mostrar error específico cuando el ISBN no se encuentra (404)', async () => {
        vi.mocked(axios.get).mockRejectedValueOnce({ response: { status: 404 } });
        render(<AddBookModal {...mockProps} />);

        fireEvent.change(screen.getByPlaceholderText('978...'), { target: { value: '0000000000' } });
        fireEvent.click(screen.getByText('Buscar'));

        await waitFor(() => {
            expect(screen.getByText(/Este libro no figura en nuestro archivo/i)).toBeInTheDocument();
        });
    });

    it('debe mostrar el selector de rating solo cuando el estado es "Leído"', () => {
        render(<AddBookModal {...mockProps} />);

        const statusSelect = screen.getByDisplayValue('Pendiente');
        fireEvent.change(statusSelect, { target: { value: 'Read' } });

        const star1 = screen.getByTestId('star-1');
        expect(star1).toBeInTheDocument();

        fireEvent.click(star1);

        expect(star1.querySelector('svg')).toHaveClass('text-amber-400');
    });

    it('debe abrir el ScannerModal al pulsar la cámara', async() => {
        render(<AddBookModal {...mockProps} />);
        fireEvent.click(screen.getByTestId('camera-button-id'));
        const scanner = await screen.findByTestId('scanner-modal');

        expect(scanner).toBeInTheDocument();
    });

    it('debe manejar errores de creación que no son un array de mensajes', async () => {
        mockProps.createBook.mockRejectedValueOnce({ response: { data: { message: 'Error único' } } });

        render(<AddBookModal {...mockProps} />);
        fireEvent.change(screen.getByPlaceholderText('Título'), { target: { value: 'T' } });
        fireEvent.change(screen.getByPlaceholderText('Autor'), { target: { value: 'A' } });
        fireEvent.click(screen.getByText('AÑADIR LIBRO'));

        await waitFor(() => {
            expect(mockProps.onError).toHaveBeenCalledWith('Error único');
        });
    });

    it('debe seleccionar el género automáticamente si coincide con BOOK_GENRES', async () => {
        const mockBookData = {
            title: 'Libro de Fantasía',
            author: 'Autor',
            pageCount: 100,
            genre: 'Fantasía'
        };

        vi.mocked(axios.get).mockResolvedValue({ data: mockBookData });

        render(<AddBookModal {...mockProps} />);

        const isbnInput = screen.getByPlaceholderText('978...');
        fireEvent.change(isbnInput, { target: { value: '1234567890' } });

        const buscarButton = screen.getAllByText('Buscar')[0];
        fireEvent.click(buscarButton);

        await waitFor(() => {
            const genreSelect = screen.getByDisplayValue('Fantasía');
            expect(genreSelect).toBeInTheDocument();
        });
    });

    it('debe establecer el mensaje de error de conexión si la API devuelve un error genérico (no 404)', async () => {
        vi.mocked(axios.get).mockRejectedValueOnce({
            response: { status: 500, data: { message: 'Server exploded' } }
        });

        render(<AddBookModal {...mockProps} />);

        const isbnInput = screen.getByPlaceholderText('978...');
        fireEvent.change(isbnInput, { target: { value: '1234567890' } });

        const buscarButtons = screen.getAllByText('Buscar');
        fireEvent.click(buscarButtons[0]);

        const errorMsg = await screen.findByText("Error de conexión con el servidor.");
        expect(errorMsg).toBeInTheDocument();
    });

    it('debe renderizar la imagen de portada cuando currentPortada tiene valor', async () => {
        render(<AddBookModal {...mockProps} />);

        const testUrl = 'https://example.com/portada.jpg';

        const mockBookData = { title: 'Test', author: 'Autor', urlPortada: testUrl };
        vi.mocked(axios.get).mockResolvedValue({ data: mockBookData });

        fireEvent.change(screen.getByPlaceholderText('978...'), { target: { value: '1234567890' } });
        fireEvent.click(screen.getAllByText('Buscar')[0]);

        await waitFor(() => {
            const img = screen.getByRole('img');
            expect(img).toBeInTheDocument();
            expect(img).toHaveAttribute('src', testUrl);
        });
    });

    it('debe actualizar el ISBN y disparar la búsqueda al escanear correctamente', async () => {
        vi.mocked(axios.get).mockResolvedValue({
            data: { title: 'Libro Escaneado', author: 'Autor' }
        });

        render(<AddBookModal {...mockProps} />);

        fireEvent.click(screen.getByTestId('camera-button-id'));
        expect(screen.getByTestId('scanner-modal')).toBeInTheDocument();

        fireEvent.click(screen.getByTestId('simulate-scan'));

        expect(screen.getByPlaceholderText('978...')).toHaveValue('9781234567890');

        await waitFor(() => {
            expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('9781234567890'), expect.any(Object));
        });

        expect(screen.queryByTestId('scanner-modal')).not.toBeInTheDocument();
    });

    
});