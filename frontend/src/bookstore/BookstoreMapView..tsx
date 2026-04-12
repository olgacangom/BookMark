import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Loader2, MapPinHouse, Search, MapPin } from 'lucide-react';

const ChangeView = ({ center }: { center: [number, number] }) => {
    const map = useMap();
    useEffect(() => {
        if (center) map.flyTo(center, 14);
    }, [center, map]);
    return null;
};

const iconBookstore = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/3429/3429149.png',
    iconSize: [35, 35],
    iconAnchor: [17, 35],
    popupAnchor: [0, -35]
});

const iconUser = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/9131/9131546.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
});

export const BookstoresMapView = () => {
    const [viewPos, setViewPos] = useState<[number, number] | null>(null);
    const [bookstores, setBookstores] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchBookstores = useCallback(async (lat: number, lon: number) => {
        try {
            setLoading(true);
            const response = await fetch(`http://localhost:3000/bookstores/nearby?lat=${lat}&lon=${lon}`);
            const data = await response.json();
            setBookstores(data);
        } catch (error) {
            console.error("Error cargando librerías:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);

        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.length > 2) {
            debounceRef.current = setTimeout(async () => {
                try {
                    const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5&addressdetails=1`);
                    const data = await res.json();
                    setSuggestions(data);
                    setShowSuggestions(true);
                } catch (err) {
                    console.error("Error buscando sugerencias", err);
                }
            }, 100);
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectLocation = (lat: string, lon: string, displayName: string) => {
        const newCoords: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setSearchQuery(displayName);
        setSuggestions([]);
        setShowSuggestions(false);
        setViewPos(newCoords);
        fetchBookstores(newCoords[0], newCoords[1]);
    };

    const handleSearchSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (suggestions.length > 0) {
            const first = suggestions[0];
            selectLocation(first.lat, first.lon, first.display_name);
        }
    };

    useEffect(() => {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const coords: [number, number] = [pos.coords.latitude, pos.coords.longitude];
                setViewPos(coords);
                fetchBookstores(coords[0], coords[1]);
            },
            () => {
                const defaultPos: [number, number] = [37.3891, -5.9845];
                setViewPos(defaultPos);
                fetchBookstores(defaultPos[0], defaultPos[1]);
            }
        );
    }, [fetchBookstores]);

    return (
        <div className="h-[calc(100vh-140px)] p-6 animate-in fade-in duration-700">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end gap-4 relative">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                        Librerías <span className="text-teal-600 italic font-serif">Cercanas.</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2">
                        {loading ? 'Sincronizando zona...' : `Detectadas ${bookstores.length} librerías reales`}
                    </p>
                </div>

                <div className="relative w-full md:w-96">
                    <form onSubmit={handleSearchSubmit} className="relative group">
                        <input
                            type="text"
                            placeholder="Busca un barrio o ciudad..."
                            value={searchQuery}
                            onChange={handleInputChange}
                            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                            className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 pl-12 text-sm shadow-md focus:ring-4 focus:ring-teal-500/5 focus:border-teal-600 outline-none transition-all font-medium"
                        />
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    </form>

                    {showSuggestions && suggestions.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1000] animate-in slide-in-from-top-2 duration-200">
                            {suggestions.map((s, i) => (
                                <button
                                    key={i}
                                    onClick={() => selectLocation(s.lat, s.lon, s.display_name)}
                                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left transition-colors border-b border-slate-50 last:border-0"
                                >
                                    <MapPin size={14} className="text-teal-600 shrink-0" />
                                    <span className="text-xs text-slate-600 font-medium truncate">{s.display_name}</span>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </header>

            <div className="h-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative bg-slate-50">
                {viewPos ? (
                    <MapContainer center={viewPos} zoom={14} className="h-full w-full">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <ChangeView center={viewPos} />

                        <Marker position={viewPos} icon={iconUser}>
                            <Popup><span className="font-bold">Zona seleccionada</span></Popup>
                        </Marker>

                        {bookstores.map(store => (
                            <Marker key={store.id} position={[store.latitude, store.longitude]} icon={iconBookstore}>
                                <Popup>
                                    <div className="p-2 min-w-[160px]">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600">
                                                <MapPinHouse size={16} />
                                            </div>
                                            <h3 className="font-black text-slate-900 uppercase text-[10px] leading-tight">{store.name}</h3>
                                        </div>
                                        <p className="text-[9px] text-slate-500 mb-3 italic">{store.address}</p>
                                        <a
                                            href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="block w-full py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest text-center hover:bg-teal-600 transition-all"
                                        >
                                            ¿Cómo llegar?
                                        </a>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-teal-600" size={48} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Cargando mapa...</p>
                    </div>
                )}
            </div>
        </div>
    );
};