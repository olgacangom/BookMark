import { useEffect } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { X } from 'lucide-react';

interface ScannerModalProps {
    isOpen: boolean;
    onClose: () => void;
    onScanSuccess: (decodedText: string) => void;
}

export const ScannerModal = ({ isOpen, onClose, onScanSuccess }: ScannerModalProps) => {
    useEffect(() => {
        if (!isOpen) return;

        // Configuramos el scanner
        // El ID "reader" debe coincidir con el ID del div en el JSX
        const scanner = new Html5QrcodeScanner(
            "reader", 
            { 
                fps: 10, 
                qrbox: { width: 280, height: 160 }, // Tamaño optimizado para códigos de barras
                aspectRatio: 1.777778 // Formato panorámico habitual en móviles
            }, 
            false
        );

        scanner.render(
            (decodedText) => {
                // Cuando detecta un código, lo limpiamos y cerramos
                scanner.clear().then(() => {
                    onScanSuccess(decodedText);
                }).catch(err => console.error("Error al detener el scanner:", err));
            },
            () => {
                // Errores de lectura (se ignora para no saturar la consola)
            }
        );

        // Cleanup al desmontar el componente o cerrar el modal
        return () => {
            scanner.clear().catch(err => console.debug("Scanner ya estaba cerrado", err));
        };
    }, [isOpen, onScanSuccess]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden relative border border-white/20 animate-in zoom-in-95 duration-200">
                
                {/* Cabecera */}
                <div className="p-6 flex justify-between items-center bg-slate-50/50">
                    <div>
                        <h3 className="text-xl font-black text-slate-800 tracking-tight uppercase">Lector ISBN</h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Escanea el código de barras</p>
                    </div>
                    <button 
                        type="button"
                        onClick={onClose} 
                        className="p-3 hover:bg-rose-50 hover:text-rose-500 rounded-2xl transition-all active:scale-90 text-slate-400"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                {/* Área del Scanner */}
                <div className="p-6">
                    <div 
                        id="reader" 
                        className="overflow-hidden rounded-[2rem] border-none bg-neutral-900 shadow-inner aspect-video"
                    ></div>
                    
                    <div className="mt-6 flex flex-col items-center gap-2">
                        <div className="w-12 h-1.5 bg-primary/20 rounded-full animate-pulse"></div>
                        <p className="text-[10px] text-slate-400 font-black uppercase tracking-[0.2em]">
                            Buscando código...
                        </p>
                    </div>
                </div>

                {/* Footer informativo */}
                <div className="p-6 bg-slate-50/50 text-center">
                    <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        Asegúrate de tener buena iluminación y mantén el código dentro del recuadro.
                    </p>
                </div>
            </div>
        </div>
    );
};