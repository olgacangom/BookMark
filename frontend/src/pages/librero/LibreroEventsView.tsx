import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import {
    Calendar, Clock, Users, Trash2, Plus,
    ChevronLeft, Loader2, Sparkles, AlertTriangle,
    UserCheck, X
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { CreateEventModal } from './CreateEventModal';

const ConfirmDeleteEventModal = ({ isOpen, onClose, onConfirm, title }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[400] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <AlertTriangle size={32} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">¿Cancelar evento?</h3>
                <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium">
                    Vas a eliminar <span className="font-bold text-slate-800 italic">"{title}"</span>. Se notificará a los usuarios apuntados.
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
        <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-[3rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl border-8 border-white overflow-hidden animate-in zoom-in-95">
                <div className="p-8 border-b border-slate-50 flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-black text-slate-900 uppercase">Asistentes</h3>
                        <p className="text-[10px] text-teal-600 font-bold uppercase tracking-widest mt-1">
                            {attendees.length} personas confirmadas
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20} /></button>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-3 no-scrollbar">
                    {loading ? (
                        <div className="py-10 flex justify-center"><Loader2 className="animate-spin text-teal-600" /></div>
                    ) : attendees.length > 0 ? (
                        attendees.map(user => (
                            <div key={user.id} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <img
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                    className="w-10 h-10 rounded-full bg-teal-100 object-cover border-2 border-white shadow-sm"
                                    alt=""
                                />
                                <div className="text-left overflow-hidden">
                                    <p className="text-sm font-bold text-slate-800 leading-none mb-1 truncate">{user.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-medium truncate">{user.email}</p>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className="py-12 text-center">
                            <UserCheck className="mx-auto text-slate-200 mb-4" size={40} />
                            <p className="text-slate-400 text-xs font-medium px-10">Aún no se ha apuntado nadie a este evento.</p>
                        </div>
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

    const handleConfirmDelete = async () => {
        if (!selectedEvent) return;
        try {
            await api.delete(`/librero/events/${selectedEvent.id}`);
            setEvents(events.filter(e => e.id !== selectedEvent.id));
            setIsDeleteModalOpen(false);
            setSelectedEvent(null);
        } catch { alert("No se pudo eliminar"); }
    };

    const openManagement = (event: any) => {
        setSelectedEvent(event);
        setIsCreateModalOpen(true);
    };

    const handleOpenAttendees = (e: React.MouseEvent, event: any) => {
        e.stopPropagation(); 
        setSelectedEvent(event);
        setIsAttendeesModalOpen(true);
    };

    const handleOpenDelete = (e: React.MouseEvent, event: any) => {
        e.stopPropagation(); 
        setSelectedEvent(event);
        setIsDeleteModalOpen(true);
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

    return (
        <div className="py-6 sm:py-8 animate-in fade-in duration-700 text-left px-4">

            {/* HEADER */}
            <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-6">
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <button onClick={() => navigate(-1)} className="p-2 bg-white rounded-full shadow-sm border border-slate-100"><ChevronLeft size={20} /></button>
                    <div>
                        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 uppercase tracking-tighter italic leading-none">Quedadas Físicas</h2>
                        <p className="text-slate-400 text-[10px] sm:text-sm font-medium mt-1">Gestión de eventos y asistencia</p>
                    </div>
                </div>

                <button
                    onClick={() => { setSelectedEvent(null); setIsCreateModalOpen(true); }}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-4 sm:py-3 bg-teal-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-teal-700 shadow-lg shadow-teal-600/20 transition-all"
                >
                    <Plus size={18} /> Nuevo Evento
                </button>
            </header>

            {/* GRID DE EVENTOS */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-8">
                {events.length > 0 ? events.map(event => (
                    <div
                        key={event.id}
                        onClick={() => openManagement(event)}
                        className="bg-white rounded-[2rem] sm:rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden flex flex-col group hover:shadow-2xl hover:scale-[1.01] transition-all duration-500 cursor-pointer relative"
                    >
                        <div className="p-6 sm:p-8 flex-1">
                            <div className="flex justify-between items-start mb-5">
                                <div className="p-2.5 sm:p-3 bg-teal-50 text-teal-600 rounded-xl sm:rounded-2xl">
                                    <Calendar size={22} className="sm:w-7 sm:h-7" />
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={(e) => handleOpenAttendees(e, event)}
                                        className="p-2.5 bg-slate-50 text-slate-400 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm border border-slate-100"
                                        title="Ver asistentes"
                                    >
                                        <Users size={18} />
                                    </button>
                                    <button
                                        onClick={(e) => handleOpenDelete(e, event)}
                                        className="p-2.5 bg-white/90 text-rose-500 rounded-xl hover:bg-rose-500 hover:text-white transition-all shadow-md border border-slate-100"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>

                            <h3 className="text-lg sm:text-2xl font-black text-slate-900 uppercase mb-2 leading-tight group-hover:text-teal-600 transition-colors">
                                {event.title}
                            </h3>
                            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 mb-6 font-medium italic leading-relaxed">
                                "{event.description}"
                            </p>

                            <div className="space-y-4 pt-5 border-t border-slate-100">
                                {/* FECHA */}
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                                        <Clock size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Horario</span>
                                        <span className="text-[11px] sm:text-[12px] font-bold text-teal-800 leading-none">
                                            {new Date(event.eventDate).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                                        </span>
                                    </div>
                                </div>

                                {/* AFORO / ASISTENTES */}
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-teal-50 flex items-center justify-center text-teal-600 shrink-0">
                                        <UserCheck size={14} strokeWidth={2.5} />
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Ocupación</span>
                                        <span className="text-[11px] sm:text-[12px] font-bold text-teal-800 leading-none">
                                            {event.attendeesCount || 0} / {event.maxCapacity || '∞'} plazas ocupadas
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )) : (
                    <div className="col-span-full py-16 sm:py-24 text-center bg-white/50 rounded-[2.5rem] border-4 border-dashed border-slate-100 px-6">
                        <Sparkles className="mx-auto text-slate-200 mb-4 w-12 h-12 sm:w-16 sm:h-16" />
                        <p className="text-slate-400 font-black uppercase text-[10px] sm:text-xs tracking-[0.3em]">Crea tu primera actividad presencial</p>
                    </div>
                )}
            </div>

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