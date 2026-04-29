import { useEffect, useState, useCallback } from 'react';
import { 
    UserCheck, UserX, Loader2, UserPlus, 
    Clock, MessageCircle, Check, X as XIcon, 
    Inbox, Send, ShoppingBag
} from 'lucide-react';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export const RequestsView = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    
    const [followRequests, setFollowRequests] = useState<any[]>([]);
    const [bookRequests, setBookRequests] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setLoading(true);
            const [{ data: profile }, { data: bRequests }] = await Promise.all([
                api.get(`/users/profile/${user.id}`),
                api.get('/sustainability/requests/me')
            ]);
            
            setFollowRequests(profile.followerRelations.filter((f: any) => f.status === 'PENDING'));
            setBookRequests(bRequests);
        } catch { console.error("Error al sincronizar buzón"); } 
        finally { setLoading(false); }
    }, [user?.id]);

    useEffect(() => { fetchData(); }, [fetchData]);

    const handleFollowAction = async (requestId: string, action: 'accept' | 'decline') => {
        setActionLoading(requestId);
        try {
            if (action === 'accept') await api.post(`/users/follow/accept/${requestId}`);
            else await api.delete(`/users/follow/decline/${requestId}`);
            fetchData();
        } finally { setActionLoading(null); }
    };

    const handleBookAction = async (requestId: string, status: 'accepted' | 'rejected') => {
        try {
            await api.patch(`/sustainability/requests/${requestId}/status`, { status });
            fetchData();
        } catch { alert("Error al procesar libro"); }
    };

    if (loading) return <div className="flex h-[80vh] flex-col items-center justify-center bg-[#F0F9F9]"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>;

    const receivedPending = bookRequests.filter(r => r.isOwner && r.status === 'pending');
    const sentBookRequests = bookRequests.filter(r => !r.isOwner);

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-20 text-left animate-in fade-in duration-500">
            <header className="relative pt-10 pb-8 px-6 border-b border-slate-200/60 max-w-3xl mx-auto">
                <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight leading-none">
                    Centro de <span className="text-teal-600 font-serif italic">Interacción.</span>
                </h1>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-4">Acciones pendientes y red social</p>
            </header>

            <main className="max-w-3xl mx-auto px-6 py-10 space-y-16">
                
                {/* PETICIONES DE LIBROS RECIBIDAS */}
                <section>
                    <h2 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Inbox size={14} /> Libros solicitados ({receivedPending.length})
                    </h2>
                    <div className="grid gap-4">
                        {receivedPending.map((req) => (
                            <div key={req.id} className="bg-white p-5 rounded-[2.5rem] border-4 border-white shadow-xl flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="relative shrink-0">
                                        <img src={req.listing.book.urlPortada} className="w-12 h-16 object-cover rounded-2xl shadow-md" alt="" />
                                        <div className="absolute -bottom-2 -right-2 w-7 h-7 bg-teal-600 rounded-full border-2 border-white flex items-center justify-center text-white shadow-lg">
                                            {req.listing.type === 'loan' ? <Clock size={12} strokeWidth={3}/> : <ShoppingBag size={12} strokeWidth={3}/>}
                                        </div>
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[10px] font-black text-slate-400 uppercase">@{req.requester.fullName.split(' ')[0]} quiere:</p>
                                        <h4 className="font-bold text-slate-900 text-sm">{req.listing.book.title}</h4>
                                        <span className="text-[8px] bg-amber-50 text-amber-600 px-2 py-0.5 rounded-full font-black uppercase">{req.listing.type}</span>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button onClick={() => handleBookAction(req.id, 'accepted')} className="p-3 bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg active:scale-90"><Check size={18} strokeWidth={3}/></button>
                                    <button onClick={() => handleBookAction(req.id, 'rejected')} className="p-3 bg-slate-100 text-slate-400 rounded-2xl hover:bg-rose-500 hover:text-rose-600 transition-all active:scale-90"><XIcon size={18} strokeWidth={3}/></button>
                                </div>
                            </div>
                        ))}
                        {receivedPending.length === 0 && <p className="text-slate-300 italic text-[10px] uppercase font-bold text-center py-4">No tienes peticiones de libros pendientes.</p>}
                    </div>
                </section>

                {/* SOLICITUDES DE SEGUIMIENTO */}
                <section>
                    <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <UserPlus size={14} /> Nuevos Seguidores ({followRequests.length})
                    </h2>
                    <div className="grid gap-4">
                        {followRequests.map((req) => (
                            <div key={req.id} className="bg-white/80 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white shadow-xl flex flex-col sm:flex-row items-center justify-between group">
                                <div className="flex items-center gap-4 w-full sm:w-auto">
                                    <div className="w-14 h-14 rounded-full bg-slate-100 overflow-hidden ring-4 ring-white shrink-0 shadow-inner">
                                        <img src={req.follower.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.follower.email}`} className="w-full h-full object-cover" alt="" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-bold text-slate-900 text-base leading-tight">{req.follower.fullName}</h3>
                                        <p className="text-xs font-medium text-slate-400">@{req.follower.email.split('@')[0]}</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 mt-4 sm:mt-0 w-full sm:w-auto">
                                    <button onClick={() => handleFollowAction(req.id, 'accept')} className="flex-1 sm:flex-none bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:shadow-lg transition-all flex items-center justify-center gap-2">
                                        {actionLoading === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck size={16} />}
                                        <span>Confirmar</span>
                                    </button>
                                    <button onClick={() => handleFollowAction(req.id, 'decline')} className="flex-1 sm:flex-none bg-slate-100 text-slate-500 px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider hover:bg-rose-50 hover:text-rose-600 transition-all flex items-center justify-center gap-2">
                                        <UserX size={16} />
                                        <span>Rechazar</span>
                                    </button>
                                </div>
                            </div>
                        ))}
                        {followRequests.length === 0 && <p className="text-slate-300 italic text-[10px] uppercase font-bold text-center py-4">No hay seguidores por confirmar.</p>}
                    </div>
                </section>

                {/* MIS PETICIONES ENVIADAS */}
                <section>
                    <h2 className="text-[10px] font-black text-teal-600 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                        <Send size={14} /> Mis solicitudes enviadas ({sentBookRequests.length})
                    </h2>
                    <div className="grid gap-3">
                        {sentBookRequests.map((req) => (
                            <div key={req.id} className="bg-white/50 p-4 rounded-[2rem] border border-white flex items-center justify-between shadow-sm">
                                <div className="flex items-center gap-4">
                                    <img src={req.listing.book.urlPortada} className="w-10 h-14 object-cover rounded-xl grayscale-[0.2]" />
                                    <div className="text-left">
                                        <h4 className="font-bold text-slate-800 text-xs truncate max-w-[150px]">{req.listing.book.title}</h4>
                                        <p className="text-[9px] text-slate-400 font-bold uppercase">Dueño: @{req.listing.user.fullName.split(' ')[0]}</p>
                                        <span className={`px-2 py-0.5 rounded-full text-[7px] font-black uppercase mt-1 inline-block ${
                                            req.status === 'pending' ? 'bg-amber-50 text-amber-600' : 
                                            req.status === 'accepted' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                        }`}>
                                            {req.status === 'pending' ? 'Pendiente' : req.status}
                                        </span>
                                    </div>
                                </div>
                                {req.status === 'accepted' && (
                                    <button onClick={() => navigate('/chat')} className="p-2.5 bg-teal-600 text-white rounded-xl shadow-lg active:scale-90 transition-all"><MessageCircle size={16} /></button>
                                )}
                            </div>
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
};