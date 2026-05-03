import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../services/api';
import {
    Clock, Users, Trash2, Plus,
    ChevronLeft, Loader2, AlertTriangle,
    X, ChevronRight, Search
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateEventModal } from './CreateEventModal';


const FALLBACK_IMAGE = "https://images.unsplash.com/photo-1512820663732-2d1410f44bb1?q=80&w=600";

const ConfirmDeleteEventModal = ({ isOpen, onClose, onConfirm, title }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">¿Cancelar evento?</h3>
                <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium text-center">
                    Vas a eliminar <span className="font-bold text-slate-800 italic">"{title}"</span>. Se notificará a los usuarios confirmados.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 uppercase text-[10px] tracking-widest">Volver</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-rose-600 transition-all uppercase text-[10px] tracking-widest">Eliminar</button>
                </div>
            </div>
        </div>
    );
};

const AttendeesModal = ({ isOpen, onClose, event }: any) => {
    const [attendees, setAttendees] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen && event) {
            setLoading(true);
            api.get(`/librero/events/${event.id}/attendees`)
                .then(res => setAttendees(res.data))
                .catch(() => setAttendees([]))
                .finally(() => setLoading(false));
        }
    }, [isOpen, event]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-[3rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border-8 border-white overflow-hidden animate-in zoom-in-95">
                <div className="p-8 border-b border-slate-50 flex justify-between items-start bg-white sticky top-0 z-10">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter">Asistentes</h3>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">
                            {attendees.length} personas confirmadas
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                    {loading ? (
                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-teal-600" /></div>
                    ) : attendees.length > 0 ? (
                        attendees.map(user => (
                            <div key={user.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <img src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-10 h-10 rounded-full bg-teal-100 object-cover border-2 border-white shadow-sm" alt="" />
                                <div className="text-left overflow-hidden">
                                    <p className="text-sm font-bold text-slate-800 leading-none mb-1 truncate">{user.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center text-slate-400 font-medium text-xs">Lista de asistencia vacía.</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export const LibreroEventsView = () => {
    const navigate = useNavigate();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAttendeesModalOpen, setIsAttendeesModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);

    const fetchEvents = useCallback(async () => {
        try {
            const res = await api.get('/librero/events');
            setEvents(res.data);
        } catch { console.error("Error cargando eventos"); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const filteredEvents = useMemo(() => {
        const now = new Date();
        return events.filter(e => {
            const eventDate = new Date(e.eventDate);
            const matchesTab = activeTab === 'upcoming' ? eventDate >= now : eventDate < now;
            const matchesSearch = e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                e.description.toLowerCase().includes(searchTerm.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }, [events, activeTab, searchTerm]);

    const handleConfirmDelete = async () => {
        if (!selectedEvent) return;
        try {
            await api.delete(`/librero/events/${selectedEvent.id}`);
            setEvents(events.filter(e => e.id !== selectedEvent.id));
            setIsDeleteModalOpen(false);
            setSelectedEvent(null);
        } catch { alert("No se pudo eliminar"); }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

    return (
        <div className="max-w-[1400px] mx-auto py-10 px-6 sm:px-10 animate-in fade-in duration-700 text-left">

            {/* HEADER */}
            <header className="flex justify-between items-center mb-10">
                <div className="flex items-center gap-5">
                    <button
                        onClick={() => navigate(-1)}
                        className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm hover:bg-slate-50"
                    >
                        <ChevronLeft size={22} />
                    </button>

                    <div>
                        <h2 className="text-4xl font-black text-slate-900 italic tracking-tight">
                            Quedadas físicas
                        </h2>
                        <p className="text-sm text-slate-400 font-medium">
                            Gestiona tus eventos y asistencia
                        </p>
                    </div>
                </div>

                <button
                    onClick={() => { setSelectedEvent(null); setIsCreateModalOpen(true); }}
                    className="flex items-center gap-2 px-6 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm hover:bg-teal-700 shadow-md"
                >
                    <Plus size={16} /> Nuevo evento
                </button>
            </header>

            {/* BUSCADOR */}
            <div className="relative max-w-xl mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                <input
                    type="text"
                    placeholder="Buscar eventos..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-white border border-slate-100 rounded-xl py-3 pl-12 pr-4 text-sm shadow-sm focus:ring-2 focus:ring-teal-100 outline-none"
                />
            </div>

            {/* TABS */}
            <div className="flex gap-3 mb-10">
                {[
                    { id: 'upcoming', label: 'Próximos' },
                    { id: 'past', label: 'Pasados' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as any)}
                        className={`px-5 py-2 rounded-full text-sm font-semibold transition ${activeTab === tab.id
                                ? 'bg-teal-600 text-white'
                                : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                            }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* GRID */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

                {filteredEvents.map(event => {
                    const percent = Math.min(100, Math.round((event.attendeesCount || 0) / (event.maxCapacity || 1) * 100));
                    const eventImage = `https://picsum.photos/seed/${event.id}/800/500`;

                    return (
                        <div
                            key={event.id}
                            className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden group hover:shadow-xl transition cursor-pointer"
                        >

                            {/* IMAGE */}
                            <div className="relative h-44 overflow-hidden">
                                <img
                                    src={event.imageUrl || eventImage}
                                    onError={(e: any) => e.target.src = FALLBACK_IMAGE}
                                    className="w-full h-full object-cover group-hover:scale-105 transition"
                                />

                                {/* ACTIONS (hover) */}
                                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setIsAttendeesModalOpen(true); }}
                                        className="p-2 bg-white/90 rounded-lg shadow"
                                    >
                                        <Users size={14} />
                                    </button>
                                    <button
                                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(event); setIsDeleteModalOpen(true); }}
                                        className="p-2 bg-white/90 rounded-lg text-rose-500 shadow"
                                    >
                                        <Trash2 size={14} />
                                    </button>
                                </div>
                            </div>

                            {/* CONTENT */}
                            <div className="p-5">

                                <h3 className="font-bold text-slate-900 text-lg mb-1 line-clamp-2">
                                    {event.title}
                                </h3>

                                <p className="text-sm text-slate-400 italic mb-4 line-clamp-2">
                                    {event.description}
                                </p>

                                {/* INFO */}
                                <div className="flex justify-between text-sm mb-4">
                                    <div className="flex items-center gap-2 text-slate-600">
                                        <Clock size={14} />
                                        {new Date(event.eventDate).toLocaleDateString()} · {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>

                                {/* OCCUPATION */}
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-slate-600">
                                        {event.attendeesCount || 0} / {event.maxCapacity || '∞'} asistentes
                                    </span>
                                    <span className="text-xs text-slate-400">
                                        {percent}%
                                    </span>
                                </div>

                                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden mb-4">
                                    <div
                                        className="h-full bg-teal-500 transition-all"
                                        style={{ width: `${percent}%` }}
                                    />
                                </div>

                                {/* AVATARS */}
                                <div className="flex items-center justify-between">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <img
                                                key={i}
                                                src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${event.id + i}`}
                                                className="w-7 h-7 rounded-full border-2 border-white bg-slate-100"
                                            />
                                        ))}
                                    </div>

                                    <ChevronRight className="text-slate-300 group-hover:translate-x-1 transition" />
                                </div>

                            </div>
                        </div>
                    )
                })}

                {/* CTA */}
                <div
                    onClick={() => { setSelectedEvent(null); setIsCreateModalOpen(true); }}
                    className="flex flex-col justify-center items-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-10 text-center hover:border-teal-400 hover:bg-teal-50 transition cursor-pointer"
                >
                    <Plus size={32} className="text-teal-600 mb-4" />
                    <h3 className="font-bold text-slate-800 mb-1">Crear evento</h3>
                    <p className="text-sm text-slate-400">
                        Organiza una nueva quedada literaria
                    </p>
                </div>

            </div>

            {/* MODALES */}
            <CreateEventModal
                isOpen={isCreateModalOpen}
                onClose={() => { setIsCreateModalOpen(false); setSelectedEvent(null); }}
                eventToEdit={selectedEvent}
                onSuccess={() => { setIsCreateModalOpen(false); fetchEvents(); }}
            />

            <AttendeesModal
                isOpen={isAttendeesModalOpen}
                onClose={() => { setIsAttendeesModalOpen(false); setSelectedEvent(null); }}
                event={selectedEvent}
            />

            <ConfirmDeleteEventModal
                isOpen={isDeleteModalOpen}
                onClose={() => { setIsDeleteModalOpen(false); setSelectedEvent(null); }}
                title={selectedEvent?.title}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};