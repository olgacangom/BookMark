import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from '../services/api';
import { bookService } from './book.service';

vi.mock('../services/api'); 

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
});