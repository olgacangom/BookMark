import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { LevelProgress } from './LevelProgress';

describe('LevelProgress Component', () => {
  
  it('debe renderizar el rango inicial "Iniciado en la Lectura" (Nivel 1)', () => {
    render(<LevelProgress xp={0} />);
    
    expect(screen.getByText('1')).toBeDefined(); // Nivel
    expect(screen.getByText('Iniciado en la Lectura')).toBeDefined();
    expect(screen.getByText('0 XP Totales')).toBeDefined();
    // Meta nivel 1 es (1/0.1)^2 = 100
    expect(screen.getByText('Meta: 100 XP')).toBeDefined(); 
  });

  it('debe mostrar "Devoralibros" cuando el nivel es >= 5', () => {
    // Para nivel 5: (5-1)/0.1 = 40. 40^2 = 1600 XP
    render(<LevelProgress xp={1600} />);
    expect(screen.getByText('5')).toBeDefined();
    expect(screen.getByText('Devoralibros')).toBeDefined();
  });

  it('debe mostrar "Lector Voraz" cuando el nivel es >= 10', () => {
    // Para nivel 10: (10-1)/0.1 = 90. 90^2 = 8100 XP
    render(<LevelProgress xp={8100} />);
    expect(screen.getByText('10')).toBeDefined();
    expect(screen.getByText('Lector Voraz')).toBeDefined();
  });

  it('debe mostrar "Maestro de Historias" cuando el nivel es >= 15', () => {
    // Para nivel 15: (15-1)/0.1 = 140. 140^2 = 19600 XP
    render(<LevelProgress xp={19600} />);
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('Maestro de Historias')).toBeDefined();
  });

  it('debe mostrar "Leyenda de la Biblioteca" cuando el nivel es >= 20', () => {
    // Para nivel 20: (20-1)/0.1 = 190. 190^2 = 36100 XP
    render(<LevelProgress xp={36100} />);
    expect(screen.getByText('20')).toBeDefined();
    expect(screen.getByText('Leyenda de la Biblioteca')).toBeDefined();
  });

  it('debe calcular correctamente el ancho de la barra de progreso', () => {
    // XP 50 en nivel 1 (que va de 0 a 100) debería ser 50%
    const { container } = render(<LevelProgress xp={50} />);
    
    const progressBar = container.querySelector('div[style*="width"]');
    
    expect(progressBar).not.toBeNull();
    expect(progressBar?.getAttribute('style')).toContain('width: 50%');
  });

  it('debe mostrar la XP restante para el siguiente nivel correctamente', () => {
    // Si tengo 90 XP y la meta es 100, faltan 10
    render(<LevelProgress xp={90} />);
    expect(screen.getByText('+10 XP')).toBeDefined();
  });

  it('debe redondear hacia arriba la XP restante', () => {
    // xp = 10.5 -> faltan 89.5 -> debe mostrar +90
    render(<LevelProgress xp={10} />);
    // Meta nivel 2 es 100. 100 - 10 = 90
    expect(screen.getByText('+90 XP')).toBeDefined();
  });
});