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
  title: z.string().min(1, 'El título es obligatorio'),
  author: z.string().min(1, 'El autor es obligatorio'),
  status: z.enum(['Reading', 'Read', 'Want to Read'], {
    message: 'Selecciona un estado válido',
  }),
  genre: z.enum(BOOK_GENRES as unknown as [string, ...string[]], {
    message: 'Selecciona un género válido',
  }),
});

export type BookFormData = z.infer<typeof bookSchema>;