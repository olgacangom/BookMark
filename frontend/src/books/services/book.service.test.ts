import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../../services/api'; // Ruta real
import { bookService } from './book.service';

vi.mock('../../services/api', () => ({
  default: {
    get: vi.fn(),
    patch: vi.fn(),
    post: vi.fn(),
  },
}));

describe('bookService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('getMyBooks debe llamar a /books y devolver los datos', async () => {
    const mockBooks = [{ id: 1, title: 'Test Book', author: 'Author', status: 'Read' }];
    vi.mocked(api.get).mockResolvedValue({ data: mockBooks });

    const result = await bookService.getMyBooks();

    expect(api.get).toHaveBeenCalledWith('/books');
    expect(result).toEqual(mockBooks);
  });

  it('updateBookStatus debe hacer un patch a la ruta correcta', async () => {
    const updatedBook = { id: 1, status: 'Reading' };
    vi.mocked(api.patch).mockResolvedValue({ data: updatedBook });

    const result = await bookService.updateBookStatus(1, 'Reading');

    expect(api.patch).toHaveBeenCalledWith('/books/1', { status: 'Reading' });
    expect(result).toEqual(updatedBook);
  });

  it('create debe enviar los datos correctamente y devolver el nuevo libro', async () => {
  const newBook = { title: 'Quijote', author: 'Cervantes', status: 'Want to Read', genre: 'Clásico' };
  const mockResponse = { id: 10, ...newBook };
  
  vi.mocked(api.post).mockResolvedValue({ data: mockResponse });

  const result = await bookService.create(newBook);

  expect(api.post).toHaveBeenCalledWith('/books', newBook);
  expect(result.id).toBe(10);
});
});