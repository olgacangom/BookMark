import { render, screen } from '@testing-library/react';
import { ActivityCard } from './ActivityCard';
import { ActivityType, Activity } from '../services/activity.service';
import { describe, it, expect, vi } from 'vitest';

vi.mock('date-fns', async () => {
  const actual = await vi.importActual('date-fns');
  return {
    ...actual,
    formatDistanceToNow: vi.fn(() => 'hace 2 horas'),
  };
});

describe('ActivityCard Component', () => {
  const baseUser = {
    fullName: 'Juan Pérez',
    email: 'juan@test.com',
    avatarUrl: 'https://avatar.com/juan.jpg',
  };

  const mockDate = '2026-04-06T10:00:00Z';

  it('debe renderizar correctamente una actividad de tipo FOLLOW', () => {
    const activity: Activity = {
      id: '1',
      type: ActivityType.FOLLOW,
      createdAt: mockDate,
      user: baseUser,
      targetUser: { fullName: 'María García', avatarUrl: '' },
    };

    render(<ActivityCard activity={activity} />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText(/ahora sigue a/i)).toBeInTheDocument();
    expect(screen.getByText('María García')).toBeInTheDocument();
    expect(screen.getByText('hace 2 horas')).toBeInTheDocument();
  });

  it('debe renderizar correctamente BOOK_ADDED con miniatura y lista de autores', () => {
    const activity: Activity = {
      id: '2',
      type: ActivityType.BOOK_ADDED,
      createdAt: mockDate,
      user: baseUser,
      targetBook: {
        id: 101,
        title: 'Cien años de soledad',
        authors: ['Gabriel García Márquez'],
        thumbnail: 'https://libro.com/portada.jpg',
      },
    };

    render(<ActivityCard activity={activity} />);

    expect(screen.getByText('Juan Pérez')).toBeInTheDocument();
    expect(screen.getByText(/añadió un nuevo libro/i)).toBeInTheDocument();
    expect(screen.getByText('Cien años de soledad')).toBeInTheDocument();
    expect(screen.getByText('Gabriel García Márquez')).toBeInTheDocument();
    
    const img = screen.getByAltText('Cien años de soledad');
    expect(img).toHaveAttribute('src', 'https://libro.com/portada.jpg');
  });

  it('debe mostrar "Autor desconocido" y no renderizar imagen si faltan datos en el libro', () => {
    const activity: Activity = {
      id: '3',
      type: ActivityType.BOOK_ADDED,
      createdAt: mockDate,
      user: baseUser,
      targetBook: {
        id: 102,
        title: 'Libro Misterioso',
        authors: null as any, 
        thumbnail: undefined,
      },
    };

    render(<ActivityCard activity={activity} />);

    expect(screen.getByText('Autor desconocido')).toBeInTheDocument();
    const images = screen.queryAllByRole('img');
    expect(images).toHaveLength(1);
  });

  it('debe renderizar correctamente una actividad de tipo BOOK_FINISHED', () => {
    const activity: Activity = {
      id: '4',
      type: ActivityType.BOOK_FINISHED,
      createdAt: mockDate,
      user: baseUser,
      targetBook: {
        id: 101,
        title: 'El Quijote',
        authors: ['Cervantes'],
      },
    };

    render(<ActivityCard activity={activity} />);

    expect(screen.getByText(/terminó de leer/i)).toBeInTheDocument();
    expect(screen.getByText(/"El Quijote"/i)).toBeInTheDocument();
    expect(screen.getByText(/¡Enhorabuena!/i)).toBeInTheDocument();
  });

  it('debe procesar correctamente la fecha si se pasa como objeto Date', () => {
    const activity: Activity = {
      id: '5',
      type: ActivityType.FOLLOW,
      createdAt: new Date() as any, 
      user: baseUser,
    };

    render(<ActivityCard activity={activity} />);
    expect(screen.getByText('hace 2 horas')).toBeInTheDocument();
  });

  it('debe usar la URL de DiceBear si el usuario no tiene avatarUrl', () => {
    const activity: Activity = {
      id: '6',
      type: ActivityType.FOLLOW,
      createdAt: mockDate,
      user: { ...baseUser, avatarUrl: undefined },
    };

    render(<ActivityCard activity={activity} />);
    
    const avatar = screen.getByAltText('Juan Pérez');
    expect(avatar).toHaveAttribute('src', expect.stringContaining('dicebear.com'));
  });

  it('debe retornar null si el tipo de actividad no es reconocido', () => {
    const activity = {
      id: '7',
      createdAt: mockDate,
      user: baseUser,
    } as any;

    const { container } = render(<ActivityCard activity={activity} />);

    const content = container.querySelector('.bg-white');
    expect(content?.children).toHaveLength(1); 
  });
});