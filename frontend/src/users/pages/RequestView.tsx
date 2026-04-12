import { useEffect, useState, useCallback } from 'react';
import { 
    UserCheck, UserX, Loader2, 
    UserPlus, Heart, Clock, MessageCircle 
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const RequestsView = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [pendingRequests, setPendingRequests] = useState<any[]>([]);
    const [recentAccepted, setRecentAccepted] = useState<any[]>([]);
    
    const [myFollowingIds, setMyFollowingIds] = useState<{ accepted: Set<string>, pending: Set<string> }>({
        accepted: new Set(),
        pending: new Set()
    });
    
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const { data: profile } = await api.get(`/users/profile/${user.id}`);
            
            const allFollowers = profile.followerRelations || [];
            setPendingRequests(allFollowers.filter((f: any) => f.status === 'PENDING'));
            setRecentAccepted(allFollowers.filter((f: any) => f.status === 'ACCEPTED'));

            const following = profile.followingRelations || [];
            setMyFollowingIds({
                accepted: new Set<string>(following.filter((f: any) => f.status === 'ACCEPTED').map((f: any) => f.following.id)),
                pending: new Set<string>(following.filter((f: any) => f.status === 'PENDING').map((f: any) => f.following.id))
            });

        } catch {
            console.error("Error al sincronizar red");
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleAction = async (requestId: string, action: 'accept' | 'decline') => {
        setActionLoading(requestId);
        try {
            if (action === 'accept') {
                await api.post(`/users/follow/accept/${requestId}`);
            } else {
                await api.delete(`/users/follow/decline/${requestId}`);
            }
            await fetchData(); 
            window.dispatchEvent(new Event('refresh_unread_global'));
        } catch {
            console.error("Error en la acción de solicitud");
        } finally {
            setActionLoading(null);
        }
    };

    const handleFollowBack = async (targetUserId: string) => {
        try {
            await api.post(`/users/follow/${targetUserId}`);
            fetchData(); 
        } catch {
            console.error("Error al seguir de vuelta");
        }
    };

    const handleStartChat = async (targetUserId: string) => {
        try {
            const { data } = await api.post(`/chat/conversation/${targetUserId}`);
            if (data) navigate('/chat');
        } catch {
            alert("No se pudo iniciar el chat.");
        }
    };

    if (loading) return (
        <div className="flex h-[80vh] flex-col items-center justify-center bg-[#F0F9F9]">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            <p className="text-slate-400 font-bold uppercase tracking-[0.2em] text-[10px] mt-4">Sincronizando buzón...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-20 text-left animate-in fade-in duration-500">
            <header className="relative pt-10 pb-8 px-6 border-b border-slate-200/60">
                <div className="max-w-3xl mx-auto">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-teal-50 border border-teal-100 rounded-full text-teal-700 text-[10px] font-bold uppercase tracking-widest mb-3">
                        <UserPlus size={12} /> Gestión de Red
                    </div>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
                        Tus <span className="text-teal-600 font-serif italic">Solicitudes.</span>
                    </h1>
                </div>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10 space-y-16">
                <section>
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-6">
                        Por Confirmar ({pendingRequests.length})
                    </h2>
                    
                    {pendingRequests.length > 0 ? (
                        <div className="grid gap-4">
                            {pendingRequests.map((req) => (
                                <div key={req.id} className="bg-white/80 backdrop-blur-xl p-5 rounded-2xl border border-white shadow-xl flex flex-col sm:flex-row items-center justify-between group">
                                    <div className="flex items-center gap-4 w-full sm:w-auto">
                                        <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden ring-2 ring-teal-100 shrink-0">
                                            <img src={req.follower.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.follower.email}`} className="w-full h-full object-cover" alt="Avatar" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 text-base">{req.follower.fullName}</h3>
                                            <p className="text-xs font-medium text-slate-400">@{req.follower.email.split('@')[0]}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                                        <button
                                            onClick={() => handleAction(req.id, 'accept')}
                                            disabled={!!actionLoading}
                                            className="flex-1 sm:flex-none bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:shadow-lg transition-all flex items-center justify-center gap-2"
                                        >
                                            {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck size={16} />}
                                            <span>Confirmar</span>
                                        </button>
                                        <button
                                            onClick={() => handleAction(req.id, 'decline')}
                                            disabled={!!actionLoading}
                                            className="flex-1 sm:flex-none bg-slate-100 text-slate-500 px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2"
                                        >
                                            <UserX size={16} />
                                            <span>Rechazar</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white/40 rounded-[2.5rem] p-12 text-center border border-white/50 border-dashed">
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-widest">Buzón de entrada vacío</p>
                        </div>
                    )}
                </section>

                {recentAccepted.length > 0 && (
                    <section>
                        <h2 className="text-xs font-bold text-teal-600/60 uppercase tracking-widest mb-6">
                            Lectores que te siguen
                        </h2>
                        <div className="grid gap-3">
                            {recentAccepted.map((rel) => {
                                const isFollowingBack = myFollowingIds.accepted.has(rel.follower.id);
                                const isPendingSent = myFollowingIds.pending.has(rel.follower.id);
                                
                                return (
                                    <div key={rel.id} className="bg-white/50 p-4 rounded-2xl border border-white flex items-center justify-between shadow-sm">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full border-2 border-teal-100 overflow-hidden grayscale-[0.3]">
                                                <img src={rel.follower.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rel.follower.email}`} className="w-full h-full object-cover" alt="Avatar" />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">
                                                {rel.follower.fullName} <span className="font-normal text-slate-400 italic text-xs ml-1">forma parte de tu red</span>
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {isFollowingBack ? (
                                                <>
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-teal-100 text-teal-700 rounded-xl text-[9px] font-black uppercase tracking-widest border border-teal-200">
                                                        <Heart size={10} fill="currentColor" /> Ya os seguís
                                                    </div>
                                                    <button 
                                                        onClick={() => handleStartChat(rel.follower.id)}
                                                        className="p-2.5 bg-teal-600 text-white rounded-xl hover:bg-teal-700 transition-all shadow-md shadow-teal-600/20 active:scale-90"
                                                        title="Enviar mensaje"
                                                    >
                                                        <MessageCircle size={14} />
                                                    </button>
                                                </>
                                            ) : isPendingSent ? (
                                                <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-600 border border-amber-100 rounded-xl text-[9px] font-black uppercase tracking-widest">
                                                    <Clock size={10} /> Solicitado
                                                </div>
                                            ) : (
                                                <button 
                                                    onClick={() => handleFollowBack(rel.follower.id)}
                                                    className="flex items-center gap-2 text-teal-600 font-black text-[9px] uppercase tracking-widest bg-white px-4 py-2 rounded-xl border border-teal-100 shadow-sm hover:bg-teal-600 hover:text-white transition-all active:scale-95"
                                                >
                                                    <UserPlus size={12} /> Seguir también
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </section>
                )}
            </main>
        </div>
    );
};