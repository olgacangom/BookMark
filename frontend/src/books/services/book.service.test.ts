import { describe, it, expect, vi, beforeEach } from 'vitest';
import { bookService, Book } from './book.service';
import api from '../../services/api';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

describe('bookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyBooks: debería obtener la lista de libros', async () => {
    const mockBooks: Book[] = [{ id: 1, title: 'Test Book', author: 'Author' } as Book];
    vi.mocked(api.get).mockResolvedValue({ data: mockBooks });

    const result = await bookService.getMyBooks();
    expect(api.get).toHaveBeenCalledWith('/books');
    expect(result).toEqual(mockBooks);
  });

  it('create: debería enviar los datos correctamente para crear un libro', async () => {
    const newBook = { title: 'New Book', author: 'Author' };
    vi.mocked(api.post).mockResolvedValue({ data: { id: 1, ...newBook } });

    const result = await bookService.create(newBook);
    expect(api.post).toHaveBeenCalledWith('/books', newBook);
    expect(result.title).toBe('New Book');
  });

  it('update: debería limpiar los datos antes de enviar la petición', async () => {
    const bookId = 1;
    const updates = { 
        title: 'Updated Title', 
        invalidField: 'shouldBeRemoved' // Este campo no debería enviarse
    };
    
    vi.mocked(api.patch).mockResolvedValue({ data: { id: bookId, title: 'Updated Title' } });

    await bookService.update(bookId, updates as any);

    expect(api.patch).toHaveBeenCalledWith(`/books/${bookId}`, expect.not.objectContaining({
        invalidField: 'shouldBeRemoved'
    }));
  });

  it('remove: debería llamar a la API para eliminar un libro', async () => {
    vi.mocked(api.delete).mockResolvedValue({});
    await bookService.remove(1);
    expect(api.delete).toHaveBeenCalledWith('/books/1');
  });
});