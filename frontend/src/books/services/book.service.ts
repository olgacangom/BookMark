import api from "../../services/api";

export type BookStatus = 'Read' | 'Reading' | 'Want to Read';

export interface Book {
  updatedAt: string | number | Date;
  coverUrl: string;
  id: number;
  title: string;
  author: string;
  status: BookStatus;
  genre: 'Fantasía'
}

export const bookService = {
  getMyBooks: async (): Promise<Book[]> => {
    const { data } = await api.get<Book[]>('/books');
    return data;
  },

  create: async (bookData: { title: string; author: string; status: string, genre: string }): Promise<Book> => {
    const { data } = await api.post<Book>('/books', bookData);
    return data;
  },
  
  updateBookStatus: async (id: number, status: BookStatus): Promise<Book> => {
    const { data } = await api.patch<Book>(`/books/${id}`, { status });
    return data;
  }
};