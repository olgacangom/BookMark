import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { LibraryView } from './LibraryView';
import { AuthProvider } from '../../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { bookService, Book } from '../../books/services/book.service';

vi.mock('../../books/services/book.service', () => ({
    bookService: {
        getMyBooks: vi.fn(),
        create: vi.fn().mockResolvedValue({ id: 123 }),
        update: vi.fn().mockResolvedValue({ id: 1 }),
        remove: vi.fn().mockResolvedValue(true)
    }
}));

vi.mock('../../books/components/AddBookModal', () => ({
    AddBookModal: (props: any) => {
        if (!props.isOpen) return null;
        return (
            <div data-testid="mock-modal">
                <h2>{props.book ? `Editando ${props.book.title}` : 'Nuevo Libro'}</h2>
                <button onClick={props.onClose}>Cerrar</button>
                <button onClick={() => props.onSuccess()}>Refrescar</button>
                <button onClick={() => props.createBook({ title: 'Procesado' })}>Guardar</button>
            </div>
        );
    }
}));

describe('LibraryView - Cobertura Exhaustiva', () => {
    const mockBooks: Book[] = [
        { id: 1, title: 'Z-Libro', author: 'Autor Beta', status: 'Reading', updatedAt: '2026-01-01', genre: 'Fantasía' },
        { id: 2, title: 'A-Libro', author: 'Autor Alfa', status: 'Read', updatedAt: '2026-01-10', genre: 'Aventura' },
        { id: 3, title: 'P-Libro', author: 'Autor Gamma', status: 'Want to Read', updatedAt: '2026-01-05', genre: 'Clásico' }
    ];

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(bookService.getMyBooks).mockResolvedValue(mockBooks);
    });

    const renderView = () => render(
        <AuthProvider>
            <BrowserRouter>
                <LibraryView />
            </BrowserRouter>
        </AuthProvider>
    );

    it('debe ordenar los libros por Título (A-Z)', async () => {
        renderView();
        await waitFor(() => expect(screen.queryByText(/Organizando/i)).not.toBeInTheDocument());

        const sortBtn = await screen.findByText(/Añadidos recientemente/i);
        fireEvent.click(sortBtn);

        const optionAZ = await screen.findByText(/Orden alfabético \(Título\)/i);
        fireEvent.click(optionAZ);

        const titles = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
        expect(titles[0]).toBe('A-Libro');
    });

    it('debe confirmar la eliminación y refrescar la lista', async () => {
        renderView();
        await screen.findByText('Z-Libro');

        const deleteBtns = screen.getAllByRole('button').filter(b => b.className.includes('bg-rose-500'));
        fireEvent.click(deleteBtns[0]);

        const modalTitle = await screen.findByText(/¿Eliminar libro\?/i);
        expect(modalTitle).toBeInTheDocument();

        const confirmBtn = screen.getByRole('button', { name: /Sí, eliminar/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => {
            expect(bookService.remove).toHaveBeenCalled();
            expect(bookService.getMyBooks).toHaveBeenCalledTimes(2);
        });
    });

    it('debe manejar el cierre de los CustomDropdowns al hacer clic fuera', async () => {
        renderView();
        const dropdown = await screen.findByText(/Todos los estados/i);

        fireEvent.click(dropdown);
        expect(await screen.findByText('En progreso')).toBeInTheDocument();

        const backdrop = screen.getByTestId('dropdown-backdrop');
        fireEvent.click(backdrop);

        await waitFor(() => {
            expect(screen.queryByText('En progreso')).not.toBeInTheDocument();
        });
    });

    it('debe abrir el modal desde el EmptyState', async () => {
        vi.mocked(bookService.getMyBooks).mockResolvedValue([]);
        renderView();
        const addBtn = await screen.findByText(/Añadir mi primer libro/i);
        fireEvent.click(addBtn);
        expect(screen.getByTestId('mock-modal')).toBeInTheDocument();
    });

    it('debe capturar errores al eliminar', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

        renderView();
        await screen.findByText('Z-Libro');

        vi.mocked(bookService.remove).mockRejectedValueOnce(new Error('Delete error'));

        const deleteBtns = screen.getAllByRole('button').filter(b => b.className.includes('bg-rose-500'));
        fireEvent.click(deleteBtns[0]);

        const confirmBtn = screen.getByRole('button', { name: /Sí, eliminar/i });
        fireEvent.click(confirmBtn);

        await waitFor(() => expect(consoleSpy).toHaveBeenCalledWith("Error al eliminar:", expect.any(Error)));

        consoleSpy.mockRestore();
    });

    it('debe manejar errores al cargar los datos inicialmente', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        vi.mocked(bookService.getMyBooks).mockRejectedValueOnce(new Error('Load error'));

        renderView();

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error al cargar biblioteca:", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it('debe abrir el modal de edición al hacer clic en una tarjeta', async () => {
        renderView();
        const bookCard = await screen.findByText('Z-Libro');
        fireEvent.click(bookCard); 

        expect(screen.getByText('Editando Z-Libro')).toBeInTheDocument();
    });

    it('debe ordenar por autor y manejar el guardado de edición', async () => {
        renderView();
        await waitFor(() => expect(screen.queryByText(/Organizando/i)).not.toBeInTheDocument());

        const sortBtn = await screen.findByText(/Añadidos recientemente/i);
        fireEvent.click(sortBtn);
        fireEvent.click(screen.getByText(/Orden alfabético \(Autor\)/i));

        const titles = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
        expect(titles[0]).toBe('A-Libro'); 

        fireEvent.click(screen.getByText('A-Libro'));
        const saveBtn = screen.getByText('Guardar');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(bookService.update).toHaveBeenCalled();
        });
    });

    it('debe mostrar el estado de búsqueda vacía', async () => {
        renderView();

        const searchInput = await screen.findByPlaceholderText(/Buscar por título o autor/i);
        fireEvent.change(searchInput, { target: { value: 'Libro Inexistente' } });

        expect(await screen.findByText('Búsqueda sin éxito')).toBeInTheDocument();
        expect(screen.getByText(/🕵️‍♂️/)).toBeInTheDocument();
    });

    it('debe manejar la rama de creación de libro nuevo', async () => {
        renderView();
        const addNewBtn = await screen.findByText(/Añadir Nuevo Libro/i);
        fireEvent.click(addNewBtn);

        const saveBtn = screen.getByText('Guardar');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(bookService.create).toHaveBeenCalled();
        });
    });
    it('debe mostrar el nombre por defecto Lector si el usuario no tiene nombre', async () => {
        localStorage.setItem('user', JSON.stringify({ email: 'test@test.com' }));
        renderView();
        expect(await screen.findByText(/Hola/i)).toHaveTextContent('Hola Lector');
    });

    it('debe manejar la ordenación por Título y por defecto', async () => {
        renderView();
        const sortBtn = await screen.findByText(/Añadidos recientemente/i);
        fireEvent.click(sortBtn);

        fireEvent.click(screen.getByText(/Orden alfabético \(Título\)/i));
        const titles = screen.getAllByRole('heading', { level: 2 }).map(h => h.textContent);
        expect(titles[0]).toBe('A-Libro');
    });

    it('debe cubrir la lógica de estado desconocido', async () => {
        const weirdBook = [{ ...mockBooks[0], status: 'UnknownState' }];
        vi.mocked(bookService.getMyBooks).mockResolvedValue(weirdBook as any);

        renderView();

        expect(await screen.findByText(/Sin estado/i)).toBeInTheDocument();
    });

    it('debe ejecutar la rama de edición dentro del modal', async () => {
        renderView();
        const bookCard = await screen.findByText('Z-Libro');
        fireEvent.click(bookCard); 

        const saveBtn = screen.getByText('Guardar');
        fireEvent.click(saveBtn);

        await waitFor(() => {
            expect(bookService.update).toHaveBeenCalled();
        });
    });
    
    it('debe limpiar el estado al cerrar los modales', async () => {
        renderView();
        
        const addBtn = await screen.findByText(/Añadir Nuevo Libro/i);
        fireEvent.click(addBtn);
        
        const closeAddBtn = screen.getByText('Cerrar');
        fireEvent.click(closeAddBtn);
        
        expect(screen.queryByTestId('mock-modal')).not.toBeInTheDocument();

        const deleteBtn = screen.getAllByRole('button').filter(b => b.className.includes('bg-rose-500'))[0];
        fireEvent.click(deleteBtn);
        
        const cancelDeleteBtn = screen.getByText('Cancelar');
        fireEvent.click(cancelDeleteBtn);
        
        expect(screen.queryByText('¿Eliminar libro?')).not.toBeInTheDocument();
    });
});