import { useEffect, useState, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import {
    Loader2, MapPin,
    Book as BookIcon, Search, X
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

    const [searchQuery, setSearchQuery] = useState('');
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

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
        } else {
            setSuggestions([]);
            setShowSuggestions(false);
        }
    };

    const selectLocation = (lat: string, lon: string, display: string) => {
        const coords: [number, number] = [parseFloat(lat), parseFloat(lon)];
        setViewPos(coords);
        setSearchQuery(display);
        setShowSuggestions(false);
        fetchBookstores(coords[0], coords[1], selectedBook?.id);
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
        <div className="flex flex-col h-[calc(100dvh-140px)] md:h-[calc(100vh-120px)] p-4 md:p-6 animate-in fade-in duration-700 text-left overflow-hidden">
            <header className="mb-4 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-4 relative shrink-0">
                <div>
                    <h1 className="text-3xl lg:text-4xl font-black text-slate-900 tracking-tighter">
                        Encuentra <span className="text-teal-600 italic font-serif">Stock.</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-1">
                        {loading ? "Actualizando mapa..." : `Explorando ${bookstores.length} puntos de venta`}
                    </p>
                </div>

                <div className="flex flex-col md:flex-row gap-2 w-full xl:w-auto">
                    {/* BUSCADOR DE LIBROS */}
                    <div className="relative w-full md:w-72 group">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="¿Buscas un libro?"
                                value={bookSearch}
                                onChange={handleBookInputChange}
                                className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 pl-10 text-xs shadow-sm focus:border-teal-600 outline-none font-bold"
                            />
                            <BookIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                            {isSearchingBook && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-teal-600" size={14} />}
                        </div>

                        {bookSuggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-2xl shadow-2xl border border-slate-100 z-[1001] overflow-hidden">
                                {bookSuggestions.map((book) => (
                                    <button
                                        key={book.id}
                                        onClick={() => selectBook(book)}
                                        className="w-full p-3 flex items-center gap-3 hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-none text-left"
                                    >
                                        <img src={book.urlPortada} className="w-8 h-12 object-cover rounded shadow-sm" alt="" />
                                        <div>
                                            <p className="text-[10px] font-black text-slate-900 uppercase leading-tight">{book.title}</p>
                                            <p className="text-[9px] text-slate-400 font-bold uppercase">{book.author}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* BUSCADOR DE LOCALIZACIÓN */}
                    <div className="relative w-full md:w-72">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Cambiar ubicación..."
                                value={searchQuery}
                                onChange={handleLocationChange}
                                className="w-full bg-slate-100 border-none rounded-2xl px-4 py-2.5 pl-10 text-xs focus:bg-white focus:ring-1 focus:ring-slate-200 outline-none font-medium"
                            />
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        </div>

                        {showSuggestions && suggestions.length > 0 && (
                            <div className="absolute top-full left-0 w-full bg-white mt-2 rounded-2xl shadow-2xl border border-slate-100 z-[1001] overflow-hidden">
                                {suggestions.map((loc: any, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => selectLocation(loc.lat, loc.lon, loc.display_name)}
                                        className="w-full p-3 text-[10px] font-bold text-slate-600 hover:bg-teal-50 hover:text-teal-700 transition-colors border-b border-slate-50 last:border-none text-left flex items-center gap-2"
                                    >
                                        <Search size={12} />
                                        <span className="truncate">{loc.display_name}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex-1 min-h-0 w-full rounded-[2.5rem] overflow-hidden shadow-2xl border-4 md:border-8 border-white relative bg-slate-50">
                {selectedBook && (
                    <div className="absolute top-4 left-4 z-[999] animate-in slide-in-from-left-4">
                        <div className="bg-white/90 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-teal-100 flex items-center gap-3">
                            <img src={selectedBook.urlPortada} className="w-8 h-12 object-cover rounded-lg shadow-sm" alt="" />
                            <div className="max-w-[120px]">
                                <p className="text-[8px] font-black text-teal-600 uppercase tracking-widest leading-none mb-1">Filtrando por:</p>
                                <h3 className="text-[10px] font-black text-slate-900 leading-tight truncate">{selectedBook.title}</h3>
                                <button onClick={clearBookFilter} className="flex items-center gap-1 mt-1 text-[8px] font-black text-rose-500 uppercase hover:text-rose-700">
                                    <X size={8} /> Quitar filtro
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {viewPos ? (
                    <MapContainer
                        center={viewPos}
                        zoom={14}
                        className="h-full w-full"
                        attributionControl={false}
                    >
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
                                    <div className="p-1 min-w-[150px] text-left">
                                        <h3 className="font-black text-slate-900 uppercase text-[10px] mb-1">{store.name}</h3>
                                        <p className="text-[9px] text-slate-500 mb-2 italic leading-tight">{store.address}</p>
                                        <div className="grid grid-cols-2 gap-2">
                                            <a href={`tel:${store.phone}`} className="py-1.5 bg-teal-600 text-white rounded-lg text-[9px] font-black uppercase text-center shadow-sm">Llamar</a>
                                            <a href={`https://www.google.com/maps/dir/?api=1&destination=${store.latitude},${store.longitude}`} target="_blank" rel="noreferrer" className="py-1.5 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase text-center shadow-sm">Ruta</a>
                                        </div>
                                    </div>
                                </Popup>
                            </Marker>
                        ))}
                    </MapContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center gap-4 bg-white/50">
                        <Loader2 className="animate-spin text-teal-600" size={48} />
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localizando...</p>
                    </div>
                )}
            </div>
        </div>
    );
};