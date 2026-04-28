import { MapPin, Phone, Store, ExternalLink } from 'lucide-react';

interface StoreAvailabilityListProps {
    stores: any[];
}

export const StoreAvailabilityList = ({ stores }: StoreAvailabilityListProps) => {
    if (stores.length === 0) {
        return (
            <div className="p-8 bg-slate-50 rounded-[2rem] border border-dashed border-slate-200 text-center">
                <Store size={32} className="text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-bold text-xs uppercase">No disponible en librerías locales</p>
                <p className="text-slate-400 text-[10px] mt-1">¡Pídele a tu librero de confianza que lo traiga!</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <h4 className="text-sm font-black text-slate-900 uppercase tracking-tight ml-2">Disponible en:</h4>
            {stores.map((item) => (
                <div key={item.inventoryId} className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 flex-shrink-0">
                            <Store size={24} />
                        </div>
                        <div className="text-left">
                            <p className="font-bold text-slate-800">{item.store.libraryName}</p>
                            <div className="flex items-center gap-1 text-slate-400 text-[10px] font-medium">
                                <MapPin size={12} /> {item.store.libraryAddress}
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Botón de Google Maps */}
                        <a 
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.store.libraryName + ' ' + item.store.libraryAddress)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-3 bg-slate-50 text-slate-400 hover:text-teal-600 rounded-xl transition-colors"
                            title="Ver en mapa"
                        >
                            <ExternalLink size={18} />
                        </a>
                        
                        {/* Botón de Contacto */}
                        <button 
                            onClick={() => window.location.href = `tel:${item.store.libraryPhone}`}
                            className="flex items-center gap-2 px-4 py-3 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-teal-700 transition-all shadow-lg shadow-teal-100"
                        >
                            <Phone size={14} /> Llamar
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};