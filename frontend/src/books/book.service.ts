import api from "../services/api";

// 🏷️ Definimos los tipos para que TypeScript nos ayude en el Dashboard
export type BookStatus = 'Read' | 'Reading' | 'Want to Read';

export interface Book {
  id: number;
  title: string;
  author: string;
  status: BookStatus;
}

export const bookService = {
  // 📋 GET /books -> Trae los libros del usuario logueado
  getMyBooks: async (): Promise<Book[]> => {
    const { data } = await api.get<Book[]>('/books');
    return data;
  },
  
  // 🔄 PATCH /books/:id -> Para cuando cambiemos el estado desde el filtro o la tarjeta
  updateBookStatus: async (id: number, status: BookStatus): Promise<Book> => {
    const { data } = await api.patch<Book>(`/books/${id}`, { status });
    return data;
  }
};