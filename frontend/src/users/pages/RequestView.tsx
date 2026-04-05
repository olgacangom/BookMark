import { useEffect, useState } from 'react';
import { UserCheck, UserX, User as UserIcon, Loader2, Bell } from 'lucide-react';
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
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setRequests(data);
        } catch (error: any) {
            console.error("Error al cargar solicitudes", error);

            if (error.response?.status === 401) {
                console.error("Sesión expirada o token no válido");
            }
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
            console.log(`✅ Solicitud ${action === 'accept' ? 'aceptada' : 'rechazada'}`);
        } catch (error) {
            console.error(`Error al ${action} solicitud`, error);
        } finally {
            setActionLoading(null);
        }
    };

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
        </div>
    );

    return (
        <div className="max-w-2xl mx-auto px-4 py-10 animate-in fade-in duration-500 pb-24">

            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <Bell className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-[#564e4e] tracking-tight">Solicitudes</h1>
                    <p className="text-sm text-muted-foreground font-medium">Gestiona quién puede seguir tu actividad lectora</p>
                </div>
            </div>

            {/* Lista de Solicitudes */}
            <div className="space-y-4">
                {requests.length > 0 ? (
                    requests.map((req) => (
                        <div
                            key={req.id}
                            className="bg-white p-4 md:p-5 rounded-[2rem] border border-border flex items-center justify-between shadow-sm hover:shadow-md transition-all group"
                        >
                            <div className="flex items-center gap-4">
                                {/* Avatar */}
                                <div className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-slate-100 overflow-hidden border border-slate-200 shrink-0">
                                    {req.follower.avatarUrl ? (
                                        <img src={req.follower.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center">
                                            <UserIcon className="w-6 h-6 text-slate-300" />
                                        </div>
                                    )}
                                </div>

                                {/* Info del usuario */}
                                <div className="min-w-0">
                                    <h3 className="font-bold text-foreground text-sm md:text-base truncate">
                                        {req.follower.fullName}
                                    </h3>
                                    <p className="text-[10px] md:text-xs font-bold text-primary/60 uppercase tracking-widest truncate">
                                        @{req.follower.email.split('@')[0]}
                                    </p>
                                </div>
                            </div>

                            {/* Botones de Acción */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => handleAction(req.id, 'accept')}
                                    disabled={!!actionLoading}
                                    className="bg-primary text-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-primary/90 transition-all flex items-center gap-2"
                                >
                                    {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-4 h-4" />}
                                    Confirmar
                                </button>
                                <button
                                    onClick={() => handleAction(req.id, 'decline')}
                                    disabled={!!actionLoading}
                                    className="bg-slate-100 text-slate-500 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-tighter hover:bg-slate-200 transition-all flex items-center gap-2"
                                >
                                    <UserX className="w-4 h-4" />
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="text-center py-10 bg-white rounded-[3rem] border border-dashed border-slate-200 shadow-inner">
                        <div className="bg-slate-50 p-6 rounded-full inline-block mb-4">
                            <Bell className="w-10 h-10 text-slate-300" />
                        </div>
                        <h3 className="text-lg font-bold text-foreground italic">No hay nuevas solicitudes</h3>
                    </div>
                )}
            </div>
        </div>
    );
};