import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ScannerModal } from './ScannerModal';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('html5-qrcode', () => {
    const Html5QrcodeScanner = vi.fn();
    Html5QrcodeScanner.prototype.render = vi.fn();
    Html5QrcodeScanner.prototype.clear = vi.fn().mockResolvedValue(undefined);
    return { Html5QrcodeScanner };
});

describe('ScannerModal Coverage 100%', () => {
    const mockOnClose = vi.fn();
    const mockOnScanSuccess = vi.fn();

    const mockedRender = vi.mocked(Html5QrcodeScanner.prototype.render);
    const mockedClear = vi.mocked(Html5QrcodeScanner.prototype.clear);

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('no debe renderizar nada si isOpen es false', () => {
        const { container } = render(
            <ScannerModal
                isOpen={false}
                onClose={mockOnClose}
                onScanSuccess={mockOnScanSuccess}
            />
        );
        expect(container.firstChild).toBeNull();
    });

    it('debe inicializar el scanner y renderizar el modal si isOpen es true', () => {
        render(
            <ScannerModal
                isOpen={true}
                onClose={mockOnClose}
                onScanSuccess={mockOnScanSuccess}
            />
        );

        expect(screen.getByText(/Lector ISBN/i)).toBeInTheDocument();
        expect(Html5QrcodeScanner).toHaveBeenCalledWith(
            "reader",
            expect.objectContaining({ fps: 10 }),
            false
        );
    });

    it('debe llamar a onClose al pulsar el botón de cerrar', () => {
        render(
            <ScannerModal
                isOpen={true}
                onClose={mockOnClose}
                onScanSuccess={mockOnScanSuccess}
            />
        );

        const closeButton = screen.getByRole('button');
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
    });

    it('debe manejar el éxito del escaneo: limpiar y llamar a onScanSuccess', async () => {
        render(<ScannerModal isOpen={true} onClose={mockOnClose} onScanSuccess={mockOnScanSuccess} />);

        const onInternalSuccess = mockedRender.mock.calls[0][0] as (text: string) => Promise<void>;
        await onInternalSuccess('9788412345678');

        expect(mockedClear).toHaveBeenCalled();
        expect(mockOnScanSuccess).toHaveBeenCalledWith('9788412345678');
    });

    it('debe capturar errores al intentar limpiar el scanner tras un éxito', async () => {
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
        
        mockedClear.mockRejectedValueOnce(new Error('Clear Failed'));

        render(
            <ScannerModal
                isOpen={true}
                onClose={mockOnClose}
                onScanSuccess={mockOnScanSuccess}
            />
        );

        const onInternalSuccess = mockedRender.mock.calls[0][0] as (text: string) => Promise<void>;
        
        await onInternalSuccess('test-code');

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Error al detener el scanner:", expect.any(Error));
        });
        
        consoleSpy.mockRestore();
    });

    it('debe ejecutar el cleanup (clear) al desmontar el componente', () => {
        const { unmount } = render(
            <ScannerModal
                isOpen={true}
                onClose={mockOnClose}
                onScanSuccess={mockOnScanSuccess}
            />
        );

        unmount();
        expect(mockedClear).toHaveBeenCalled();
    });

    it('debe manejar el error en el cleanup del useEffect (console.debug)', async () => {
        const consoleSpy = vi.spyOn(console, 'debug').mockImplementation(() => { });
        mockedClear.mockRejectedValueOnce(new Error('Already closed'));

        const { unmount } = render(
            <ScannerModal
                isOpen={true}
                onClose={mockOnClose}
                onScanSuccess={mockOnScanSuccess}
            />
        );

        unmount();

        await waitFor(() => {
            expect(consoleSpy).toHaveBeenCalledWith("Scanner ya estaba cerrado", expect.any(Error));
        });
        consoleSpy.mockRestore();
    });

    it('debe ignorar los errores de lectura del scanner (segundo parámetro de render)', () => {
        render(
            <ScannerModal
                isOpen={true}
                onClose={mockOnClose}
                onScanSuccess={mockOnScanSuccess}
            />
        );

        const onInternalError = mockedRender.mock.calls[0][1] as (err: string) => void;
        expect(() => onInternalError('Error de frame')).not.toThrow();
    });
});