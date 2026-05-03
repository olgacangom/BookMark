import { useEffect, useState, useCallback } from 'react';
import {
    Search, Clock, MapPin,
    ChevronRight, Check, Sparkles, Loader2, Calendar, Users
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { JoinEventModal } from '../../users/pages/JoinEventModal';

const FALLBACK_EVENT_IMAGE = "https://images.unsplash.com/photo-1512820663732-2d1410f44bb1?q=80&w=600";

export const EventsView = () => {
    const { user } = useAuth();
    const [events, setEvents] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'mine'>('upcoming');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
    const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);

    const fetchEvents = useCallback(async () => {
        setLoading(true);
        try {
            const res = await api.get('/librero/events/all');
            let data = res.data;
            data.sort((a: any, b: any) => new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime());

            if (activeTab === 'mine') {
                data = data.filter((e: any) =>
                    e.registrations?.some((reg: any) => reg.user?.id === user?.id || reg.userId === user?.id)
                );
            }
            setEvents(data);
        } catch (error) {
            console.error("Error cargando eventos", error);
        } finally {
            setLoading(false);
        }
    }, [activeTab, user?.id]);

    useEffect(() => { fetchEvents(); }, [fetchEvents]);

    const filteredEvents = events.filter(e =>
        e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        e.description.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20 text-left">
            <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-10 py-8">

                {/* HEADER */}
                <header className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-5">
                        <div>
                            <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Eventos</h1>
                            <p className="text-slate-400 text-[10px] font-bold mt-2 uppercase tracking-[0.2em]">Gestión de quedadas físicas en librerías</p>
                        </div>
                    </div>
                </header>

                <div className="grid lg:grid-cols-12 gap-10">
                    <div className="lg:col-span-8 space-y-6">
                        {/* Buscador */}
                        <div className="relative group">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-600 transition-colors" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar eventos, librerías o temas..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-16 pr-6 py-4 bg-white border border-slate-100 rounded-[1.5rem] shadow-sm outline-none focus:ring-4 focus:ring-teal-500/5 transition-all font-medium text-sm"
                            />
                        </div>

                        {/* TABS REFINADAS */}
                        <div className="flex items-center gap-8 border-b border-slate-100 mb-8 h-12">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all h-full relative ${activeTab === 'upcoming' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-500'}`}
                            >
                                <Calendar size={14} /> Próximos
                                {activeTab === 'upcoming' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-full" />}
                            </button>
                            <button
                                onClick={() => setActiveTab('mine')}
                                className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all h-full relative ${activeTab === 'mine' ? 'text-teal-600' : 'text-slate-400 hover:text-slate-500'}`}
                            >
                                <Users size={14} /> Mis eventos
                                {activeTab === 'mine' && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-full" />}
                            </button>
                        </div>

                        <div className="space-y-6">
                            {loading ? (
                                <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>
                            ) : filteredEvents.length > 0 ? (
                                filteredEvents.map((event) => (
                                    <EventCard
                                        key={event.id}
                                        event={event}
                                        currentUser={user}
                                        onOpenJoin={() => {
                                            setSelectedEvent(event);
                                            setIsJoinModalOpen(true);
                                        }}
                                    />
                                ))
                            ) : (
                                <div className="py-24 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-100 px-10">
                                    <Sparkles className="mx-auto text-slate-100 mb-4" size={48} />
                                    <h3 className="text-slate-400 font-black uppercase text-xs tracking-widest">No se encontraron eventos</h3>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* COLUMNA DERECHA: SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-teal-50 rounded-xl text-teal-600"><Calendar size={18} /></div>
                                <h3 className="font-black text-slate-800 uppercase text-[11px] tracking-widest">Próximos eventos</h3>
                            </div>

                            <div className="mb-8">
                                <div className="flex items-end gap-2 mb-2">
                                    <span className="text-4xl font-black text-slate-900 leading-none">{events.length}</span>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter pb-1">eventos agendados</span>
                                </div>
                                <div className="w-full h-1.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                    <div className="h-full bg-teal-500 rounded-full" style={{ width: '40%' }} />
                                </div>
                            </div>

                            <div className="space-y-5">
                                {events.slice(0, 3).map(se => (
                                    <div key={se.id} className="flex items-start gap-4 p-2 hover:bg-slate-50 rounded-2xl transition-colors cursor-pointer">
                                        <div className="text-center shrink-0 w-8">
                                            <div className="text-base font-black text-slate-800 leading-none">{new Date(se.eventDate).getDate()}</div>
                                            <div className="text-[8px] font-black text-teal-600 uppercase">{new Date(se.eventDate).toLocaleString('es-ES', { month: 'short' }).replace('.', '')}</div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[10px] font-black text-slate-800 uppercase truncate">{se.title}</div>
                                            <div className="text-[9px] font-bold text-slate-400">{new Date(se.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}h</div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <button className="w-full mt-6 pt-4 border-t border-slate-50 flex items-center justify-center gap-2 text-[9px] font-black text-teal-600 uppercase tracking-[0.2em] hover:text-teal-700 transition-all">
                                Ver agenda completa <ChevronRight size={12} />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <JoinEventModal
                isOpen={isJoinModalOpen}
                onClose={() => setIsJoinModalOpen(false)}
                event={selectedEvent}
                onStatusChange={fetchEvents}
            />
        </div>
    );
};

const EventCard = ({ event, onOpenJoin, currentUser }: any) => {
    const isJoined = event.registrations?.some((reg: any) => reg.userId === currentUser?.id || reg.user?.id === currentUser?.id);
    const date = new Date(event.eventDate);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('es-ES', { month: 'short' }).toUpperCase();
    const weekday = date.toLocaleString('es-ES', { weekday: 'long' }).toUpperCase();

    const hasValidImage = event.imageUrl && event.imageUrl.trim().length > 0;
    const eventImage = hasValidImage
        ? event.imageUrl
        : `https://picsum.photos/seed/${event.id}/600/400`;

    return (
        <div className="bg-white rounded-[2.5rem] p-5 border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col md:flex-row gap-6 items-center relative group">

            <div className="w-20 h-24 bg-slate-50 rounded-[2rem] flex flex-col items-center justify-center border border-slate-100 shrink-0">
                <span className="text-2xl font-black text-slate-900 leading-none">{day}</span>
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">{month}</span>
                <div className="mt-2 px-2 py-0.5 bg-white rounded-lg border border-slate-100 text-[7px] font-black text-teal-600 uppercase shadow-sm">{weekday}</div>
            </div>

            <div className="w-28 h-28 rounded-[2rem] overflow-hidden shrink-0 shadow-inner bg-slate-50 border-2 border-slate-100 p-1">
                <img
                    src={eventImage}
                    className="w-full h-full object-cover rounded-[1.8rem] group-hover:scale-110 transition-transform duration-700"
                    alt="event"
                    onError={(e: any) => { e.target.src = FALLBACK_EVENT_IMAGE }} 
                />
            </div>

            <div className="flex-1 min-w-0 text-left">
                <div className="mb-2">
                    <h3 className="text-base font-black text-slate-900 uppercase tracking-tight leading-tight line-clamp-1 group-hover:text-teal-600 transition-colors">{event.title}</h3>
                    <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded-md uppercase mt-1 inline-block tracking-widest border border-indigo-100/50">{event.category || 'CLUB DE LECTURA'}</span>
                </div>

                <p className="text-slate-400 text-[10px] font-medium italic mb-4 line-clamp-2 leading-relaxed">"{event.description}"</p>

                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <Clock size={12} className="text-teal-600" />
                        <span className="text-[10px] font-bold text-slate-700 uppercase">{date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}H</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <MapPin size={12} className="text-rose-500" />
                        <span className="text-[10px] font-bold text-slate-700 truncate max-w-[120px] uppercase">{event.organizer?.libraryName || 'Búho Sabio'}</span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-center justify-center self-stretch shrink-0 border-l border-slate-50 pl-6 gap-2 min-w-[120px]">
                <div className="text-center">
                    <div className="text-lg font-black text-slate-800 leading-none">{event.attendeesCount || 0} / {event.maxCapacity || '40'}</div>
                    <div className="text-[9px] font-black text-slate-300 uppercase mt-1">Asistentes</div>
                </div>

                <button
                    onClick={onOpenJoin}
                    className={`mt-2 flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${isJoined
                        ? 'bg-[#F0FDF4] text-teal-600 border border-teal-100'
                        : 'bg-white border-2 border-slate-100 text-slate-700 hover:border-teal-500 hover:text-teal-600'
                        }`}
                >
                    {isJoined ? <><Check size={12} strokeWidth={4} /> Asistiré</> : <>Ver detalles <ChevronRight size={12} /></>}
                </button>
            </div>
        </div>
    );
};