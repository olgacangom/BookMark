import axios from 'axios';
import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AxiosResponse } from 'axios';

interface GoogleBookVolumeInfo {
  title?: string;
  authors?: string[];
  description?: string;
  pageCount?: number;
  categories?: string[];
  imageLinks?: {
    thumbnail?: string;
  };
}

interface GoogleBookItem {
  volumeInfo: GoogleBookVolumeInfo;
}

interface GoogleBooksApiResponse {
  items?: GoogleBookItem[];
}

@Injectable()
export class GoogleBooksService {
  constructor(private configService: ConfigService) {}

  async findByIsbn(isbn: string) {
    const apiKey = this.configService.get<string>('GOOGLE_BOOKS_API_KEY');
    const cleanIsbn = isbn.replace(/-/g, '').trim();
    const url = `https://www.googleapis.com/books/v1/volumes?q=isbn:${cleanIsbn}&key=${apiKey}`;
    try {
      const response: AxiosResponse<GoogleBooksApiResponse> =
        await axios.get<GoogleBooksApiResponse>(url);
      const data = response.data;

      if (!data.items || data.items.length === 0) {
        throw new NotFoundException(
          `No se encontró ningún libro con el ISBN: ${isbn}`,
        );
      }

      const info = data.items[0].volumeInfo;

      return {
        title: info.title || 'Título no disponible',
        authors:
          info.authors && info.authors.length > 0
            ? info.authors
            : ['Autor desconocido'],
        description: info.description || '',
        pageCount: info.pageCount || 0,
        genre: info.categories ? info.categories[0] : null,
        urlPortada:
          info.imageLinks?.thumbnail?.replace('http:', 'https:') || null,
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;

      let errorMessage = 'Unknown error';
      if (axios.isAxiosError(error)) {
        errorMessage = (error.response?.data as string) || error.message;
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }

      console.error('❌ ERROR REAL EN GOOGLE SERVICE:', errorMessage);

      throw new InternalServerErrorException(
        'Error al conectar con la API de Google Books',
      );
    }
  }
}
