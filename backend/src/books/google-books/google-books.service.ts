import axios from 'axios';
import { Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleBooksService {
  constructor(private configService: ConfigService) { }

  async findByIsbn(isbn: string) {
    const apiKey = this.configService.get<string>('GOOGLE_BOOKS_API_KEY');
    const cleanIsbn = isbn.replace(/-/g, '').trim();
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`;
    try {
      const response = await axios.get(url);
      const data = response.data;

      if (!data.items || data.items.length === 0) {
        throw new NotFoundException(`No se encontró ningún libro con el ISBN: ${isbn}`);
      }

      const info = data.items[0].volumeInfo;

      return {
        title: info.title || 'Título no disponible',
        authors: (info.authors && info.authors.length > 0)
          ? info.authors
          : ['Autor desconocido'],
        description: info.description || '',
        pageCount: info.pageCount || 0,
        genre: info.categories ? info.categories[0] : null,
        urlPortada: info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      };
    } catch (error) {
      console.error("❌ ERROR REAL EN GOOGLE SERVICE:", error.response?.data || error.message);
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Error al conectar con la API de Google Books');
    }
  }
}