import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BooksGrowthChart } from './BooksGrowthChart';

vi.mock('recharts', () => {
    const OriginalRecharts = vi.importActual('recharts');
    return {
        ...OriginalRecharts as any,
        ResponsiveContainer: ({ children }: any) => (
            <div data-testid="responsive-container">{children}</div>
        ),
        BarChart: ({ children }: any) => (
            <svg data-testid="bar-chart">{children}</svg>
        ),
        Bar: () => <div data-testid="bar" />,
        CartesianGrid: () => null,
        XAxis: () => null,
        YAxis: () => null,
        Tooltip: () => null,
        LabelList: () => null,
        defs: ({ children }: any) => <defs data-testid="defs">{children}</defs>,
        linearGradient: ({ id, children }: any) => (
            <linearGradient id={id} data-testid="gradient">{children}</linearGradient>
        ),
        stop: (props: any) => <stop {...props} data-testid="stop" />,
    };
});

describe('BooksGrowthChart', () => {
    const mockData = [
        { month: 'Ene', count: 10 },
        { month: 'Feb', count: '15' },
    ];

    it('se renderiza sin errores con datos válidos', async () => {
        render(<BooksGrowthChart data={mockData} />);

        expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('aplica el color personalizado correctamente', async () => {
        const customColor = '#FF0000';
        render(<BooksGrowthChart data={mockData} color={customColor} />);

        await waitFor(() => {
            const stops = document.querySelectorAll('stop');
            expect(stops.length).toBeGreaterThan(0);
            expect(stops[0]).toHaveAttribute('stop-color', customColor);
        });
    });

    it('aplica el color personalizado correctamente', async () => {
        const customColor = '#FF0000';
        const { container } = render(<BooksGrowthChart data={mockData} color={customColor} />);

        await waitFor(() => {
            const stopElement = container.querySelector('stop');
            expect(stopElement).not.toBeNull();
            expect(stopElement).toHaveAttribute('stop-color', customColor);
        });
    });

    it('gestiona correctamente datos vacíos', async () => {
        const { container } = render(<BooksGrowthChart data={[]} />);

        await waitFor(() => {
            expect(container.querySelector('svg')).toBeInTheDocument();
        });
    });
});