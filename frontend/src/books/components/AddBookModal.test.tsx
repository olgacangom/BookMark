import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddBookModal } from './AddBookModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

vi.mock('./ScannerModal', () => ({
  ScannerModal: ({ isOpen, onScanSuccess }: any) => {
    if (!isOpen) return null;
    return (
      <div data-testid="mock-scanner">
        <button 
          onClick={() => onScanSuccess('9788412345678')}
          data-testid="simulate-scan-button"
        >
          Simular Escaneo
        </button>
      </div>
    );
  }
}));

describe('AddBookModal Coverage 100%', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockCreateBook = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', '"token-con-comillas"');
  });

  it('debe manejar autores como string y autocompletar datos por ISBN', async () => {
    // Mock de la respuesta de la API
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        title: 'Libro de Prueba',
        authors: 'Autor de Prueba',
        description: 'Descripción test',
        urlPortada: 'http://test.com',
        pageCount: 100,
        genre: 'Fantasía'
      }
    });

    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);

    const inputIsbn = screen.getByPlaceholderText(/ISBN \(ej: 97884\.\.\.\)/i);
    fireEvent.change(inputIsbn, { target: { value: '9788412345678' } });

    fireEvent.click(screen.getByLabelText(/buscar por isbn/i));

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Ej: El nombre del viento/i)).toHaveValue('Libro de Prueba');
    });
  });

  it('debe capturar error 404 en búsqueda ISBN', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.mocked(axios.get).mockRejectedValueOnce({ response: { status: 404 } });

    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    fireEvent.change(screen.getByPlaceholderText(/ISBN \(ej: 97884\.\.\.\)/i), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByLabelText(/buscar por isbn/i));

    expect(await screen.findByText(/No se encontró ningún libro con ese ISBN/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('debe manejar errores de red genéricos en la búsqueda', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    fireEvent.change(screen.getByPlaceholderText(/ISBN \(ej: 97884\.\.\.\)/i), { target: { value: '9781234567890' } });
    fireEvent.click(screen.getByLabelText(/buscar por isbn/i));

    expect(await screen.findByText(/Error al conectar con el servidor/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('debe cubrir la rama del useEffect cuando isOpen es false', () => {
    const { rerender } = render(
      <AddBookModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />
    );
    expect(screen.queryByText(/Añadir Libro/i)).not.toBeInTheDocument();

    rerender(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} book={null} />);
    expect(screen.getByPlaceholderText(/ISBN \(ej: 97884\.\.\.\)/i)).toHaveValue('');
  });

  it('debe abortar la búsqueda si el ISBN es demasiado corto', async () => {
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);

    const isbnInput = screen.getByPlaceholderText(/ISBN \(ej: 97884\.\.\.\)/i);
    const searchBtn = screen.getByLabelText(/buscar por isbn/i);

    fireEvent.click(searchBtn);
    expect(axios.get).not.toHaveBeenCalled();

    fireEvent.change(isbnInput, { target: { value: '123' } });
    fireEvent.click(searchBtn);
    expect(axios.get).not.toHaveBeenCalled();
  });

  it('debe unir múltiples autores con comas si la API devuelve un array', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        title: 'Libro Colectivo',
        authors: ['Autor A', 'Autor B', 'Autor C'],
        description: 'Descripción test',
        urlPortada: 'http://test.com',
        pageCount: 100,
        genre: 'Historia'
      }
    });

    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);

    fireEvent.change(screen.getByPlaceholderText(/ISBN \(ej: 97884\.\.\.\)/i), { target: { value: '9781234567890' } });
    fireEvent.click(screen.getByLabelText(/buscar por isbn/i));

    expect(await screen.findByDisplayValue('Autor A, Autor B, Autor C')).toBeInTheDocument();
  });

  it('debe limpiar el estado tras un envío exitoso', async () => {
    mockCreateBook.mockResolvedValueOnce({ id: 123 });
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);

    fireEvent.change(screen.getByPlaceholderText(/Ej: El nombre del viento/i), { target: { value: 'Título Test' } });
    fireEvent.change(screen.getByPlaceholderText(/Ej: Patrick Rothfuss/i), { target: { value: 'Autor Test' } });

    fireEvent.click(screen.getByText('Guardar Libro'));

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('debe mostrar errores de validación específicos', async () => {
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);

    fireEvent.click(screen.getByText(/Guardar Libro/i));

    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    expect(await screen.findByText('El autor es obligatorio')).toBeInTheDocument();
  });

  it('debe manejar valores nulos del libro en edición para cubrir ramas or', () => {
    const bookWithNulls = {
      id: 1,
      title: 'Título',
      author: 'Autor',
      status: 'Reading',
      genre: null,       
      description: null, 
      pageCount: null,   
      urlPortada: null,  
      isbn: null         
    };

    render(
      <AddBookModal
        isOpen={true}
        onClose={mockOnClose}
        onSuccess={mockOnSuccess}
        createBook={mockCreateBook}
        book={bookWithNulls as any}
      />
    );

    expect(screen.getByDisplayValue('Título')).toBeInTheDocument();
  });

  it('debe capturar y loguear error en handleOnSubmit', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
    mockCreateBook.mockRejectedValueOnce(new Error('Fallo Crítico'));

    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);

    fireEvent.change(screen.getByPlaceholderText(/Ej: El nombre del viento/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByPlaceholderText(/Ej: Patrick Rothfuss/i), { target: { value: 'Test' } });

    fireEvent.click(screen.getByText('Guardar Libro'));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error al procesar el libro:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('debe manejar el éxito del escaneo de la cámara', async () => {
  vi.mocked(axios.get).mockResolvedValueOnce({
    data: { 
      title: 'Libro Escaneado', 
      authors: 'Autor X', 
      urlPortada: 'http://test.com', 
      pageCount: 100, 
      genre: 'Otros' 
    }
  });

  render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
  
  fireEvent.click(screen.getByTitle(/Abrir cámara para escanear/i));
  
  const scanBtn = screen.getByTestId('simulate-scan-button');
  fireEvent.click(scanBtn);

  await waitFor(() => {
    expect(screen.getByPlaceholderText(/Ej: El nombre del viento/i)).toHaveValue('Libro Escaneado');
    expect(screen.queryByTestId('mock-scanner')).not.toBeInTheDocument();
  });
});
});