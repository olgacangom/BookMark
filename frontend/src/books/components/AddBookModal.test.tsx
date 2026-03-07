import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddBookModal } from './AddBookModal';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';

vi.mock('axios');

describe('AddBookModal Coverage 100%', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockCreateBook = vi.fn().mockResolvedValue({});
  
  const mockExistingBook = {
    id: 1, title: 'Libro Existente', author: 'Autor Famoso', status: 'Read',
    genre: 'Historia', description: 'Una descripción', pageCount: 300,
    urlPortada: 'http://imagen.com/test.jpg'
  };

  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.setItem('token', '"token-con-comillas"');
  });

  it('debe manejar autores como string y autocompletar datos por ISBN', async () => {
    vi.mocked(axios.get).mockResolvedValueOnce({
      data: {
        title: 'El Quijote',
        authors: 'Miguel de Cervantes', 
        description: 'Clásico',
        urlPortada: 'http://quijote.jpg',
        pageCount: '1000', 
        genre: 'Aventura'
      }
    });

    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    fireEvent.change(screen.getByPlaceholderText(/Escribe el ISBN/i), { target: { value: '9788412345678' } });
    fireEvent.click(screen.getByLabelText(/buscar por isbn/i));

    expect(await screen.findByDisplayValue('El Quijote')).toBeInTheDocument();
    expect(await screen.findByDisplayValue('Miguel de Cervantes')).toBeInTheDocument();
  });

  it('debe capturar error 404 en búsqueda ISBN', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(axios.get).mockRejectedValueOnce({ response: { status: 404 } });
    
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    fireEvent.change(screen.getByPlaceholderText(/Escribe el ISBN/i), { target: { value: '1234567890' } });
    fireEvent.click(screen.getByLabelText(/buscar por isbn/i));
    
    expect(await screen.findByText(/No se encontró ningún libro con ese ISBN/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('debe manejar errores de red genéricos en la búsqueda', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(axios.get).mockRejectedValueOnce(new Error('Network Error'));

    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    fireEvent.change(screen.getByPlaceholderText(/Escribe el ISBN/i), { target: { value: '9781234567890' } });
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
    expect(screen.getByPlaceholderText(/Escribe el ISBN/i)).toHaveValue('');
  });

  it('debe manejar la rama donde la portada no existe', () => {
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);    
    const previewImg = screen.queryByAltText('Vista previa');
    expect(previewImg).not.toBeInTheDocument();
  });

  it('debe abortar la búsqueda si el ISBN es demasiado corto', async () => {
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    
    const isbnInput = screen.getByPlaceholderText(/Escribe el ISBN/i);
    const searchBtn = screen.getByLabelText(/buscar por isbn/i);

    fireEvent.click(searchBtn);
    expect(axios.get).not.toHaveBeenCalled();

    fireEvent.change(isbnInput, { target: { value: '123' } });
    fireEvent.click(searchBtn);
    expect(axios.get).not.toHaveBeenCalled();
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

  it('debe capturar error en handleOnSubmit', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCreateBook.mockRejectedValueOnce(new Error('Submit Error'));
    
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    fireEvent.change(screen.getByPlaceholderText(/nombre del viento/i), { target: { value: 'T' } });
    fireEvent.change(screen.getByPlaceholderText(/Rothfuss/i), { target: { value: 'A' } });
    fireEvent.click(screen.getByText(/Guardar Libro/i));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("Error al procesar el libro:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('debe setear los valores correctamente cuando se entra en modo edición', async () => {
    render(
      <AddBookModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        createBook={mockCreateBook} 
        book={mockExistingBook as any} 
      />
    );

    expect(screen.getByDisplayValue('Libro Existente')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Autor Famoso')).toBeInTheDocument();
    expect(screen.getByDisplayValue('300')).toBeInTheDocument();

    const selects = screen.getAllByRole('combobox');
    const statusSelect = selects[0] as HTMLSelectElement;
    const genreSelect = selects[1] as HTMLSelectElement;

    expect(statusSelect.value).toBe('Read');
    expect(genreSelect.value).toBe('');
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
    
    fireEvent.change(screen.getByPlaceholderText(/Escribe el ISBN/i), { target: { value: '9781234567890' } });
    fireEvent.click(screen.getByLabelText(/buscar por isbn/i));

    expect(await screen.findByDisplayValue('Autor A, Autor B, Autor C')).toBeInTheDocument();
  });

  it('debe mostrar errores de validación específicos', async () => {
    render(<AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreateBook} />);
    
    fireEvent.click(screen.getByText(/Guardar Libro/i));

    expect(await screen.findByText('El título es obligatorio')).toBeInTheDocument();
    expect(await screen.findByText('El autor es obligatorio')).toBeInTheDocument();
  });
  
});