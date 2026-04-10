import { render, screen } from '@testing-library/react';
import { BooksGrowthChart } from './BooksGrowthChart';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom';

vi.mock('recharts', () => ({
    ResponsiveContainer: ({ children }: any) => <div className="responsive-container">{children}</div>,
    BarChart: ({ children, data }: any) => (
        <div data-testid="bar-chart" data-data-length={data?.length}>
            {children}
        </div>
    ),
    Bar: ({ dataKey }: any) => <div data-testid="bar-component">{dataKey}</div>,
    XAxis: ({ dataKey }: any) => <div data-testid="x-axis">{dataKey}</div>,
    YAxis: () => <div data-testid="y-axis" />,
    CartesianGrid: () => <div data-testid="cartesian-grid" />,
    Tooltip: () => <div data-testid="tooltip" />,
    LabelList: ({ dataKey }: any) => <div data-testid="label-list">{dataKey}</div>,
}));

describe('BooksGrowthChart Component', () => {
    const mockData = [
        { month: '2026-01', count: '5' },
        { month: '2026-02', count: 10 },
    ];

    it('debe renderizar el título correctamente', () => {
        render(<BooksGrowthChart data={mockData} />);
        expect(screen.getByText(/Libros leídos por mes/i)).toBeInTheDocument();
    });

    it('debe procesar los datos y pasar la cantidad correcta al gráfico', () => {
        render(<BooksGrowthChart data={mockData} />);
        
        const chart = screen.getByTestId('bar-chart');
        expect(chart).toHaveAttribute('data-data-length', '2');
    });

    it('debe cubrir la lógica de formateo (Number conversion)', () => {
        const mixedData = [
            { month: '2026-03', count: '15' }, 
            { month: '2026-04', count: 0 }     
        ];

        render(<BooksGrowthChart data={mixedData} />);

        expect(screen.getByTestId('bar-chart')).toHaveAttribute('data-data-length', '2');
        
        expect(screen.getByTestId('x-axis')).toBeInTheDocument();
        expect(screen.getByTestId('bar-component')).toHaveTextContent('count');
    });

    it('debe manejar un array de datos vacío sin errores', () => {
        render(<BooksGrowthChart data={[]} />);
        
        const chart = screen.getByTestId('bar-chart');
        expect(chart).toHaveAttribute('data-data-length', '0');
        expect(screen.getByText(/Libros leídos por mes/i)).toBeInTheDocument();
    });
});