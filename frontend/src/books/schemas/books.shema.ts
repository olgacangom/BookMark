import { z } from 'zod';

export const BOOK_GENRES = [
  'Arte y Fotografía', 'Autoayuda', 'Aventura', 'Biografía', 'Ciencia', 
  'Ciencia Ficción', 'Clásicos', 'Cocina', 'Cómic', 'Cuentos y Relatos', 
  'Distopía', 'Economía y Negocios', 'Ensayo', 'Espiritual', 'Fantasía', 
  'Ficción Contemporánea', 'Filosofía', 'Infantil', 'Juvenil', 'Manga', 
  'Misterio', 'Mitología', 'Novela Histórica', 'Novela Negra / Policial', 
  'Poesía', 'Romance', 'Suspense', 'Teatro', 'Terror', 'Thriller', 
  'Viajes', 'Otros'
] as const;

export const bookSchema = z.object({
  title: z.string().min(1, "El título es obligatorio"),
  author: z.string().min(1, "El autor es obligatorio"),
  status: z.enum(['Want to Read', 'Reading', 'Read']),
  genre: z.string().optional().nullable(),
  description: z.string().optional().nullable(), 
  pageCount: z.number().optional().nullable(),
  urlPortada: z.string().optional().nullable(),  
  isbn: z.string().optional().nullable(),
  rating: z.number().min(0).max(5).optional().nullable(),
  review: z.string().optional().nullable(),
});

export type BookFormData = z.infer<typeof bookSchema>;