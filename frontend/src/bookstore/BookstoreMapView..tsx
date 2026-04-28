import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { 
    Loader2, MapPinHouse, MapPin, 
    Book as BookIcon, X, ShoppingBag,  
} from 'lucide-react';
import api from './../services/api';

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

const iconBookInStock = new L.Icon({
    iconUrl: 'https://cdn-icons-png.flaticon.com/512/167/167756.png',
    iconSize: [40, 40],
    iconAnchor: [20, 40],
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

    // ESTADOS PARA BÚSQUEDA DE UBICACIÓN
    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    // ESTADOS PARA BÚSQUEDA DE LIBRO
    const [bookSearch, setBookSearch] = useState('');
    const [bookSuggestions, setBookSuggestions] = useState<any[]>([]);
    const [selectedBook, setSelectedBook] = useState<any | null>(null);
    const [isSearchingBook, setIsSearchingBook] = useState(false);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const fetchBookstores = useCallback(async (lat: number, lon: number, bookId?: number) => {
        try {
            setLoading(true);
            let data;
            if (bookId) {
                const res = await api.get(`/librero/find-stores/${bookId}`);
                data = res.data.map((item: any) => ({
                    id: item.store.id,
                    name: item.store.libraryName,
                    address: item.store.libraryAddress,
                    latitude: parseFloat(item.store.libraryAddress.split(',')[0]) || lat + (Math.random() - 0.5) / 100,
                    longitude: parseFloat(item.store.libraryAddress.split(',')[1]) || lon + (Math.random() - 0.5) / 100,
                    phone: item.store.libraryPhone,
                    hasStock: true
                }));
            } else {
                const response = await fetch(`http://localhost:3000/bookstores/nearby?lat=${lat}&lon=${lon}`);
                data = await response.json();
            }
            setBookstores(data);
        } catch (error) {
            console.error("Error cargando librerías:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleBookInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setBookSearch(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);

        if (value.length > 2) {
            debounceRef.current = setTimeout(async () => {
                setIsSearchingBook(true);
                try {
                    const res = await api.get(`/books/search?query=${value}`);
                    setBookSuggestions(res.data);
                } finally { setIsSearchingBook(false); }
            }, 300);
        } else {
            setBookSuggestions([]);
        }
    };

    const selectBook = (book: any) => {
        setSelectedBook(book);
        setBookSearch(book.title);
        setBookSuggestions([]);
        if (viewPos) fetchBookstores(viewPos[0], viewPos[1], book.id);
    };

    const clearBookFilter = () => {
        setSelectedBook(null);
        setBookSearch('');
        if (viewPos) fetchBookstores(viewPos[0], viewPos[1]);
    };

    const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value;
        setSearchQuery(value);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        if (value.length > 2) {
            debounceRef.current = setTimeout(async () => {
                const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(value)}&limit=5`);
                const data = await res.json();
                setSuggestions(data);
                setShowSuggestions(true);
            }, 300);
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
        <div className="h-[calc(100vh-140px)] p-6 animate-in fade-in duration-700 text-left">
            <header className="mb-6 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6 relative">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                        Encuentra <span className="text-teal-600 italic font-serif">Stock.</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
                        {loading ? (
                            <span className="flex items-center gap-2 text-teal-600"><Loader2 size={12} className="animate-spin"/> Actualizando mapa...</span>
                        ) : selectedBook ? (
                            <span className="flex items-center gap-1 text-teal-600"><ShoppingBag size={12}/> Mostrando tiendas con este ejemplar</span>
                        ) : (
                            `Explorando ${bookstores.length} puntos de venta`
                        )}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                    <div className="relative w-full md:w-80">
                        <div className={`relative group transition-all ${selectedBook ? 'ring-2 ring-teal-500 rounded-2xl' : ''}`}>
                            <input
                                type="text"
                                placeholder="¿Buscas un libro concreto?"
                                value={bookSearch}
                                onChange={handleBookInputChange}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-3 pl-12 text-sm shadow-md focus:border-teal-600 outline-none font-bold"
                            />
                            {isSearchingBook ? (
                                <Loader2 className="absolute left-4 top-1/2 -translate-y-1/2 text-teal-600 animate-spin" size={18} />
                            ) : (
                                <BookIcon className={`absolute left-4 top-1/2 -translate-y-1/2 ${selectedBook ? 'text-teal-600' : 'text-slate-400'}`} size={18} />
                            )}
                            {selectedBook && (
                                <button onClick={clearBookFilter} className="absolute right-4 top-1/2 -translate-y-1/2 text-rose-500"><X size={16}/></button>
                            )}
                        </div>
                        {bookSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1001]">
                                {bookSuggestions.map((b) => (
                                    <button key={b.id} onClick={() => selectBook(b)} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-teal-50 text-left border-b border-slate-50 last:border-0">
                                        <img src={b.urlPortada} className="w-8 h-10 object-cover rounded-md" alt="" />
                                        <div>
                                            <p className="text-xs font-bold text-slate-800 truncate">{b.title}</p>
                                            <p className="text-[10px] text-slate-400 uppercase">{b.author}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="relative w-full md:w-80">
                        <div className="relative group">
                            <input
                                type="text"
                                placeholder="Cambiar ubicación..."
                                value={searchQuery}
                                onChange={handleLocationChange}
                                className="w-full bg-slate-100 border-none rounded-2xl px-6 py-3 pl-12 text-sm focus:bg-white focus:ring-4 focus:ring-teal-500/5 outline-none transition-all font-medium"
                            />
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                        </div>
                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden z-[1000]">
                                {suggestions.map((s, i) => (
                                    <button key={i} onClick={() => { setViewPos([parseFloat(s.lat), parseFloat(s.lon)]); setSearchQuery(s.display_name); setShowSuggestions(false); fetchBookstores(parseFloat(s.lat), parseFloat(s.lon), selectedBook?.id); }} className="w-full flex items-center gap-3 px-4 py-3 hover:bg-slate-50 text-left border-b border-slate-50 last:border-0">
                                        <MapPin size={14} className="text-teal-600" />
                                        <span className="text-xs text-slate-600 truncate">{s.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="h-full rounded-[3rem] overflow-hidden shadow-2xl border-8 border-white relative bg-slate-50">
                {selectedBook && (
                    <div className="absolute top-6 left-6 z-[999] animate-in slide-in-from-left-4">
                        <div className="bg-white/90 backdrop-blur-md p-4 rounded-3xl shadow-xl border border-teal-100 flex items-center gap-4">
                            <img src={selectedBook.urlPortada} className="w-12 h-16 object-cover rounded-xl shadow-md" alt="" />
                            <div>
                                <p className="text-[10px] font-black text-teal-600 uppercase tracking-widest">Buscando ejemplar:</p>
                                <h3 className="text-sm font-black text-slate-900 leading-tight">{selectedBook.title}</h3>
                                <button onClick={clearBookFilter} className="text-[10px] font-bold text-rose-500 underline uppercase mt-1">Quitar filtro</button>
                            </div>
                        </div>
                    </div>
                )}

                {viewPos ? (
                    <MapContainer center={viewPos} zoom={14} className="h-full w-full">
                        <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                        <ChangeView center={viewPos} />

                        <Marker position={viewPos} icon={iconUser}>
                            <Popup><span className="font-bold">Tu ubicación</span></Popup>
                        </Marker>

                        {bookstores.map(store => (
                            <Marker 
                                key={store.id} 
                                position={[store.latitude, store.longitude]} 
                                icon={selectedBook ? iconBookInStock : iconBookstore}
                            >
                                <Popup>
                                    <div className="p-2 min-w-[180px] text-left">
                                        <div className="flex items-center gap-2 mb-2">
                                            <div className="w-8 h-8 bg-teal-50 rounded-lg flex items-center justify-center text-teal-600"><MapPinHouse size={16} /></div>
                                            <h3 className="font-black text-slate-900 uppercase text-[10px] leading-tight">{store.name}</h3>
                                        </div>
                                        {selectedBook && (
                                            <div className="mb-3 p-2 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center gap-2">
                                                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                <p className="text-[9px] font-black text-emerald-700 uppercase">¡Libro disponible!</p>
                                            </div>
                                        )}
                                        <p className="text-[9px] text-slate-500 mb-3 italic">{store.address}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <a href={`tel:${store.phone}`} className="py-2 bg-teal-600 text-white rounded-xl text-[9px] font-black uppercase text-center">Llamar</a>
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`} target="_blank" rel="noreferrer" className="py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase text-center">Ruta</a>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4">
                        <Loader2 className="animate-spin text-teal-600" size={48} />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-widest">Sincronizando satélites...</p>
                    </div>
                )}
            </div>
        </div>
    );
};