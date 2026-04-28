import { X, Calendar, Clock, MapPin, Users, Loader2, Sparkles, Store, UserCheck, Info } from 'lucide-react';
import api from '../../services/api';
import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';

export const JoinEventModal = ({ isOpen, onClose, event, onStatusChange }: any) => {
    const { user: currentUser } = useAuth();
    const [loading, setLoading] = useState(false);

    if (!isOpen || !event) return null;

    const isJoined = event.registrations?.some((reg: any) =>
        (reg.user?.id === currentUser?.id) || (reg.userId === currentUser?.id)
    );

    const attendees = event.attendeesCount || 0;
    const spotsLeft = event.maxCapacity ? event.maxCapacity - attendees : null;
    const isFull = spotsLeft !== null && spotsLeft <= 0;

    const handleJoin = async () => {
        if (isJoined) return;
        setLoading(true);
        try {
            await api.post(`/librero/events/${event.id}/join`);
            onStatusChange();
            onClose();
        } catch (e: any) {
            alert(e.response?.data?.message || "No se pudo completar la inscripción");
        } finally { setLoading(false); }
    };

    return (
        <div className="fixed inset-0 z-[600] flex items-center justify-center bg-slate-900/40 backdrop-blur-md p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3.5rem] w-full max-w-lg overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.2)] border-[12px] border-white animate-in zoom-in-95 duration-500 text-left relative">

                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 z-50 p-2 bg-slate-900/5 hover:bg-slate-900/10 text-slate-500 rounded-full transition-all"
                >
                    <X size={20} />
                </button>

                {/* Decoración Superior */}
                <div className={`h-24 bg-gradient-to-br ${isJoined ? 'from-teal-500 to-emerald-600' : 'from-slate-800 to-slate-900'} relative flex items-end px-10 pb-4`}>
                    <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                        <div className="absolute top-4 left-10 w-20 h-20 rounded-full border-4 border-white" />
                        <div className="absolute -top-10 right-10 w-32 h-32 rounded-full border-[12px] border-white" />
                    </div>
                    <div className="bg-white p-4 rounded-[2rem] shadow-xl translate-y-10 border-4 border-white">
                        {isJoined ? <UserCheck className="text-teal-600" size={32} /> : <Calendar className="text-slate-900" size={32} />}
                    </div>
                </div>

                {/* Cuerpo del Modal */}
                <div className="pt-16 px-10 pb-10 bg-white">
                    {/* Badges de Estado */}
                    <div className="flex flex-wrap gap-2 mb-6">
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-teal-50 text-teal-700 rounded-full">
                            <Store size={12} strokeWidth={3} />
                            <span className="text-[10px] font-black uppercase tracking-tighter">{event.organizer?.libraryName}</span>
                        </div>
                    </div>

                    {/* Títulos */}
                    <h3 className="text-4xl font-black text-slate-900 uppercase leading-[0.85] tracking-tighter mb-3">
                        {event.title}
                    </h3>
                    <p className="text-slate-400 text-base font-medium italic leading-relaxed mb-10 border-l-4 border-slate-100 pl-4">
                        "{event.description}"
                    </p>

                    <div className="grid grid-cols-2 gap-4 mb-10">
                        {/* CARD HORARIO */}
                        <div className="group bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-teal-500/5 border border-slate-100 p-5 rounded-[2.5rem] transition-all duration-300">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Clock size={12} className="text-teal-500" /> Cuándo
                            </p>
                            <p className="text-[13px] font-black text-slate-800 leading-none">
                                {new Date(event.eventDate).toLocaleDateString([], { day: 'numeric', month: 'long' })}
                            </p>
                            <p className="text-[11px] font-bold text-teal-600 mt-1 uppercase">
                                {new Date(event.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} H
                            </p>
                        </div>

                        {/* CARD DISPONIBILIDAD */}
                        <div className="group bg-slate-50 hover:bg-white hover:shadow-xl hover:shadow-teal-500/5 border border-slate-100 p-5 rounded-[2.5rem] transition-all duration-300">
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                <Users size={12} className="text-teal-500" /> DISPONIBILIDAD
                            </p>
                            <p className={`text-xs font-black ${isFull ? 'text-rose-500' : 'text-teal-600'}`}>
                                {spotsLeft !== null ? `${spotsLeft} plazas libres` : 'Entrada libre'}
                            </p>
                        </div>
                    </div>

                    <button
                        onClick={handleJoin}
                        disabled={isFull || loading || isJoined}
                        className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] transition-all duration-500 shadow-xl relative overflow-hidden group
                            ${isJoined
                                ? 'bg-emerald-500 text-white cursor-default shadow-emerald-200'
                                : isFull
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                                    : 'bg-slate-900 text-white hover:bg-teal-600 hover:-translate-y-1 active:scale-95 shadow-slate-200 hover:shadow-teal-200'}`}
                    >
                        <div className="flex items-center justify-center gap-3 relative z-10">
                            {loading ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : isJoined ? (
                                <><UserCheck size={18} strokeWidth={3} /> Ya estás en la lista</>
                            ) : isFull ? (
                                <><Info size={18} /> Evento Completo</>
                            ) : (
                                <><Sparkles size={18} /> Confirmar Asistencia</>
                            )}
                        </div>
                    </button>

                    {/* Ubicación al final como pie de página */}
                    <div className="mt-8 flex items-center justify-center gap-2 py-3 bg-slate-50 rounded-2xl border border-slate-100">
                        <MapPin size={12} className="text-rose-500" />
                        <p className="text-[12px] font-semibold text-slate-800 uppercase ">
                            Lugar: {event.organizer?.libraryAddress}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};