import { useEffect, useState } from 'react';
import { UserCheck, UserX, Loader2, Bell, ShieldCheck, UserPlus } from 'lucide-react';
import api from '../../services/api';

interface FollowRequest {
    id: string;
    follower: {
        id: string;
        fullName: string;
        email: string;
        avatarUrl?: string;
    };
    createdAt: string;
}

export const RequestsView = () => {
    const [requests, setRequests] = useState<FollowRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    useEffect(() => {
        fetchRequests();
    }, []);

    const fetchRequests = async () => {
        try {
            const token = localStorage.getItem('token');
            const { data } = await api.get('/users/follow/requests', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setRequests(data);
        } catch (error: any) {
            console.error("Error al cargar solicitudes", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAction = async (requestId: string, action: 'accept' | 'decline') => {
        setActionLoading(requestId);
        try {
            if (action === 'accept') {
                await api.post(`/users/follow/accept/${requestId}`);
            } else {
                await api.delete(`/users/follow/decline/${requestId}`);
            }
            setRequests(prev => prev.filter(req => req.id !== requestId));
        } catch (error) {
            console.error(`Error al ${action} solicitud`, error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] flex-col items-center justify-center bg-[#F0F9F9]">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Sincronizando buzón...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-20">
            
            <header className="relative pt-10 pb-8 px-6 border-b border-slate-200/60">
                <div className="max-w-3xl mx-auto">
                    <div className="animate-in fade-in slide-in-from-left duration-700">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                            <UserPlus size={12} /> Gestión de Red
                        </div>
                        <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                            Tus <span className="text-teal-600 font-serif italic">Solicitudes.</span>
                        </h1>
                        <p className="text-slate-500 mt-2 font-medium">
                            Lectores que desean seguir tu actividad literaria.
                        </p>
                    </div>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10">
                {requests.length > 0 ? (
                    <div className="grid gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="px-2 flex items-center justify-between mb-2">
                            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                                Pendientes ({requests.length})
                            </h2>
                        </div>
                        
                        {requests.map((req) => (
                            <div
                                key={req.id}
                                className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white shadow-xl shadow-slate-200/50 flex flex-col sm:flex-row items-center justify-between group transition-all hover:shadow-2xl"
                            >
                                <div className="flex items-center gap-4 min-w-0 w-full sm:w-auto">
                                    {/* Avatar con anillo Teal */}
                                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden ring-2 ring-teal-100 shrink-0 shadow-sm transition-transform group-hover:scale-105">
                                        {req.follower.avatarUrl ? (
                                            <img src={req.follower.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-teal-600 text-white font-bold text-xl">
                                                {req.follower.fullName.charAt(0)}
                                            </div>
                                        )}
                                    </div>

                                    <div className="min-w-0">
                                        <h3 className="font-bold text-slate-900 text-base tracking-tight truncate flex items-center gap-2">
                                            {req.follower.fullName}
                                            <ShieldCheck size={16} className="text-teal-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </h3>
                                        <p className="text-xs font-medium text-slate-400">
                                            @{req.follower.email.split('@')[0]}
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                                    <button
                                        onClick={() => handleAction(req.id, 'accept')}
                                        disabled={!!actionLoading}
                                        className="flex-1 sm:flex-none bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:shadow-lg hover:shadow-teal-500/30 active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck size={16} />}
                                        <span>Confirmar</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(req.id, 'decline')}
                                        disabled={!!actionLoading}
                                        className="flex-1 sm:flex-none bg-slate-100 text-slate-500 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                                    >
                                        <UserX size={16} />
                                        <span>Rechazar</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="bg-white/60 backdrop-blur-sm rounded-[2.5rem] border border-white p-16 text-center shadow-xl shadow-slate-200/50 animate-in zoom-in-95 duration-500">
                        <div className="w-20 h-20 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner border border-teal-100">
                            <Bell className="w-8 h-8 text-teal-300" />
                        </div>
                        <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">
                            Buzón vacío
                        </h2>
                        <p className="text-slate-500 max-w-sm mx-auto text-sm font-medium leading-relaxed">
                            No tienes solicitudes pendientes. Tu círculo de lectura está actualizado.
                        </p>
                        <div className="mt-10 flex items-center justify-center gap-3">
                            <div className="h-px w-8 bg-slate-200" />
                            <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.2em]">Todo al día</span>
                            <div className="h-px w-8 bg-slate-200" />
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};