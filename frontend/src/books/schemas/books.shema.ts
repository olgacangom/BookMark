import { z } from 'zod';

export const bookSchema = z.object({
  title: z.string().min(1, 'El título es obligatorio'),
  author: z.string().min(1, 'El autor es obligatorio'),
  status: z.enum(['Reading', 'Read', 'Want to Read'], {
    message: 'Selecciona un estado válido',
  }),
});

export type BookFormData = z.infer<typeof bookSchema>;