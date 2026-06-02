import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LevelProgress } from './LevelProgress';

describe('LevelProgress', () => {
  it('debe renderizar el nivel inicial correctamente (Iniciado)', () => {
    // Para XP 0, la fórmula: Math.floor(0.1 * sqrt(0)) + 1 = 1
    render(<LevelProgress xp={0} />);
    
    expect(screen.getByText('1')).toBeDefined(); // El número del nivel
    expect(screen.getByText('Iniciado en la Lectura')).toBeDefined();
  });

  it('debe mostrar el rango correcto para nivel 5 (Devoralibros)', () => {
    // Para nivel 5, necesitamos XP tal que floor(0.1 * sqrt(xp)) + 1 = 5
    // sqrt(xp) = 4 / 0.1 = 40 => xp = 1600
    render(<LevelProgress xp={1600} />);
    
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Devoralibros')).toBeDefined();
  });

  it('debe mostrar el rango correcto para nivel 10 (Lector Voraz)', () => {
    // sqrt(xp) = 9 / 0.1 = 90 => xp = 8100
    render(<LevelProgress xp={8100} />);
    
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Lector Voraz')).toBeDefined();
  });

  it('debe mostrar el XP restante correctamente', () => {
    // XP 0. Siguiente nivel (Nivel 2) es 100 XP (0.1 * sqrt(100) = 1)
    // Debería mostrar +100 XP
    render(<LevelProgress xp={0} />);
    
    expect(screen.getByText('+100 XP')).toBeDefined();
  });
});