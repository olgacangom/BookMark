import api from "../../services/api";

export type BookStatus = 'Read' | 'Reading' | 'Want to Read';

export interface Book {
  id: number;
  title: string;
  author: string;
  status: BookStatus;
  genre?: string;
  urlPortada?: string;
  pageCount?: number;
  updatedAt: string | number | Date;
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

  update: async (id: number, updates: Partial<Book>): Promise<Book> => {
    const { data } = await api.patch<Book>(`/books/${id}`, updates);
    return data;
  },
  
  remove: async (id: number): Promise<void> => {
    await api.delete(`/books/${id}`);
  }

};