import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AddBookModal } from './AddBookModal';
import { describe, it, expect, vi } from 'vitest';

describe('AddBookModal', () => {
  const mockOnClose = vi.fn();
  const mockOnSuccess = vi.fn();
  const mockCreate = vi.fn().mockResolvedValue({});

  it('debe validar y enviar el formulario correctamente', async () => {
    render(
      <AddBookModal 
        isOpen={true} 
        onClose={mockOnClose} 
        onSuccess={mockOnSuccess} 
        createBook={mockCreate} 
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/El nombre del viento/i), { target: { value: 'Test Book' } });
    fireEvent.change(screen.getByPlaceholderText(/Patrick Rothfuss/i), { target: { value: 'Test Author' } });
    
    const selectGenre = screen.getAllByRole('combobox')[1];
    fireEvent.change(selectGenre, { target: { value: 'Fantasía' } });

    fireEvent.click(screen.getByText(/Guardar Libro/i));

    await waitFor(() => {
      expect(mockCreate).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Test Book',
        author: 'Test Author'
      }));
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('debe capturar errores de la API al guardar', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const mockErrorCreate = vi.fn().mockRejectedValue(new Error('Network Error'));
    
    render(
      <AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockErrorCreate} />
    );

    fireEvent.change(screen.getByPlaceholderText(/El nombre del viento/i), { target: { value: 'Error Book' } });
    fireEvent.change(screen.getByPlaceholderText(/Patrick Rothfuss/i), { target: { value: 'Error Author' } });
    fireEvent.change(screen.getAllByRole('combobox')[1], { target: { value: 'Fantasía' } });

    fireEvent.click(screen.getByText(/Guardar Libro/i));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith("❌ Error en la petición:", expect.any(Error));
    });
    consoleSpy.mockRestore();
  });

  it('debe loguear errores de validación en consola cuando el form es inválido ', async () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    
    render(
      <AddBookModal isOpen={true} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreate} />
    );

    fireEvent.click(screen.getByText(/Guardar Libro/i));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(expect.stringContaining("⚠️ Errores de validación:"), expect.any(Object));
    });
    consoleSpy.mockRestore();
  });

  it('no debe renderizar nada si isOpen es false', () => {
    render(
      <AddBookModal isOpen={false} onClose={mockOnClose} onSuccess={mockOnSuccess} createBook={mockCreate} />
    );
    expect(screen.queryByText(/Nuevo Libro/i)).not.toBeInTheDocument();
  });
});