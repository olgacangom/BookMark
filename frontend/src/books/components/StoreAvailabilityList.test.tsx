import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { StoreAvailabilityList } from './StoreAvailabilityList';

describe('StoreAvailabilityList', () => {
    const mockStores = [
        {
            inventoryId: 1,
            store: {
                libraryName: 'Librería Central',
                libraryAddress: 'Calle Falsa 123',
                libraryPhone: '123456789'
            }
        }
    ];

    it('debe mostrar el estado vacío cuando no hay tiendas', () => {
        render(<StoreAvailabilityList stores={[]} />);

        expect(screen.getByText(/No disponible en librerías locales/i)).toBeInTheDocument();
        expect(screen.getByText(/¡Pídele a tu librero de confianza que lo traiga!/i)).toBeInTheDocument();
    });

    it('debe renderizar la lista de tiendas correctamente', () => {
        render(<StoreAvailabilityList stores={mockStores} />);

        expect(screen.getByText('Disponible en:')).toBeInTheDocument();
        expect(screen.getByText('Librería Central')).toBeInTheDocument();
        expect(screen.getByText('Calle Falsa 123')).toBeInTheDocument();
    });

    it('debe tener los enlaces y botones de contacto correctos', () => {
        delete (window as any).location;
        window.location = { href: '' } as any;

        render(<StoreAvailabilityList stores={mockStores} />);

        // Verificar el link de mapas
        const mapLink = screen.getByTitle('Ver en mapa');
        const href = mapLink.getAttribute('href');

        expect(href).toContain('google.com');
        expect(href).toContain('maps');
        expect(mapLink).toHaveAttribute('target', '_blank');

        // Verificar el botón de llamada
        const callButton = screen.getByText('Llamar');
        fireEvent.click(callButton);
        expect(window.location.href).toBe('tel:123456789');
    });
});