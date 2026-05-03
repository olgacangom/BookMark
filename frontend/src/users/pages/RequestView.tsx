import { useEffect, useState, useCallback } from 'react';
import { 
    Loader2, UserPlus, Clock, MessageCircle, Check, X as XIcon, 
    Inbox, Send, ShoppingBag, MoreVertical, History, RefreshCw
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
    const [actionId, setActionId] = useState<string | null>(null);

    const fetchData = useCallback(async () => {
        if (!user?.id) return;
        try {
            const [{ data: profile }, { data: bRequests }] = await Promise.all([
                api.get(`/users/profile/${user.id}`),
                api.get('/sustainability/requests/me')
            ]);
            
            const pendingFollows = profile.followerRelations?.filter((f: any) => f.status === 'PENDING') || [];
            setFollowRequests(pendingFollows);
            setBookRequests(bRequests);
        } catch (error) {
            console.error("Error al sincronizar interacciones:", error);
        } finally {
            setLoading(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleFollowAction = async (requestId: string, action: 'accept' | 'decline') => {
        setActionId(requestId);
        try {
            if (action === 'accept') {
                await api.post(`/users/follow/accept/${requestId}`);
            } else {
                await api.delete(`/users/follow/decline/${requestId}`);
            }
            await fetchData(); 
        } catch (error) {
            console.error("Error en acción de seguimiento:", error);
        } finally {
            setActionId(null);
        }
    };

    const handleBookAction = async (requestId: string, status: 'accepted' | 'rejected') => {
        setActionId(requestId);
        try {
            await api.patch(`/sustainability/requests/${requestId}/status`, { status });
            await fetchData();
        } catch {
            alert("No se pudo procesar la solicitud del libro");
        } finally {
            setActionId(null);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[80vh] flex-col items-center justify-center bg-[#F8FAFB]">
                <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Cargando peticiones...</p>
            </div>
        );
    }

    const receivedPending = bookRequests.filter(r => r.isOwner && r.status === 'pending');
    const sentBookRequests = bookRequests.filter(r => !r.isOwner);

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-20 text-left animate-in fade-in duration-500">
            <header className="max-w-6xl mx-auto px-6 pt-12 mb-12 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic">
                        Centro de <span className="text-teal-600">Interacción.</span>
                    </h1>
                    <p className="text-slate-400 text-[11px] font-bold uppercase tracking-[0.2em] mt-2">Acciones pendientes y red social</p>
                </div>
                <button 
                    onClick={() => { setLoading(true); fetchData(); }}
                    className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-teal-600 hover:border-teal-100 transition-all shadow-sm"
                >
                    <RefreshCw size={20} className={actionId ? 'animate-spin' : ''} />
                </button>
            </header>

            <main className="max-w-6xl mx-auto px-6 space-y-10">
                
                {/* LIBROS SOLICITADOS */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-teal-50 text-teal-600 rounded-2xl"><Inbox size={24} /></div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Libros solicitados <span className="ml-2 bg-teal-100 text-teal-700 px-2.5 py-0.5 rounded-full text-[10px]">{receivedPending.length}</span></h2>
                        </div>
                    </div>

                    {receivedPending.length === 0 ? (
                        <div className="py-12 text-center bg-slate-50/50 rounded-[2rem] border border-dashed border-slate-200">
                            <History size={32} className="mx-auto text-slate-200 mb-3" />
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sin peticiones de libros pendientes</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {receivedPending.map((req) => (
                                <div key={req.id} className="bg-slate-50/50 p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between group hover:bg-white hover:shadow-md transition-all">
                                    <div className="flex items-center gap-4">
                                        <div className="relative shrink-0 cursor-pointer" onClick={() => navigate(`/book/${req.listing.book.isbn}`)}>
                                            <img src={req.listing.book.urlPortada} className="w-12 h-16 object-cover rounded-xl shadow-sm" alt="" />
                                            <div className="absolute -bottom-2 -right-2 w-6 h-6 bg-teal-600 rounded-full border-2 border-white flex items-center justify-center text-white">
                                                {req.listing.type === 'loan' ? <Clock size={10} /> : <ShoppingBag size={10} />}
                                            </div>
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[10px] font-black text-teal-600 uppercase cursor-pointer hover:underline" onClick={() => navigate(`/profile/${req.requester.id}`)}>
                                                @{req.requester.fullName.split(' ')[0]} quiere:
                                            </p>
                                            <h4 className="font-bold text-slate-900 text-xs line-clamp-1 uppercase tracking-tight">{req.listing.book.title}</h4>
                                        </div>
                                    </div>
                                    <div className="flex gap-2">
                                        <button 
                                            disabled={!!actionId}
                                            onClick={() => handleBookAction(req.id, 'accepted')} 
                                            className="p-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            {actionId === req.id ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} strokeWidth={3}/>}
                                        </button>
                                        <button 
                                            disabled={!!actionId}
                                            onClick={() => handleBookAction(req.id, 'rejected')} 
                                            className="p-3 bg-white border border-slate-200 text-slate-400 rounded-xl hover:text-rose-500 hover:border-rose-100 transition-all shadow-sm disabled:opacity-50"
                                        >
                                            <XIcon size={16} strokeWidth={3}/>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* NUEVOS SEGUIDORES (PENDIENTES) */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl"><UserPlus size={24} /></div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Solicitudes de Seguimiento <span className="ml-2 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{followRequests.length}</span></h2>
                        </div>
                    </div>

                    {followRequests.length === 0 ? (
                        <p className="text-slate-300 italic text-[10px] uppercase font-bold text-center py-6">Tu lista de espera está vacía.</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                            {followRequests.map((req) => (
                                <div key={req.id} className="bg-slate-50/50 border border-slate-100 p-6 rounded-[2.5rem] text-center group hover:bg-white hover:shadow-xl transition-all duration-500 relative">
                                    <div className="absolute top-4 right-4">
                                        <button className="text-slate-300 hover:text-slate-600"><MoreVertical size={16} /></button>
                                    </div>
                                    <img 
                                        src={req.follower.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${req.follower.email}`} 
                                        className="w-16 h-16 rounded-full mx-auto mb-4 border-4 border-white shadow-md cursor-pointer" 
                                        alt=""
                                        onClick={() => navigate(`/profile/${req.follower.id}`)}
                                    />
                                    <h3 className="font-black text-slate-900 text-sm leading-none">{req.follower.fullName}</h3>
                                    <p className="text-[10px] text-teal-600 font-bold mt-1">@{req.follower.email.split('@')[0]}</p>
                                    <p className="text-[10px] text-slate-400 mt-3 italic line-clamp-2 h-8">"{req.follower.bio || 'Sin biografía aún'}"</p>
                                    
                                    <div className="flex gap-2 mt-6">
                                        <button 
                                            disabled={!!actionId}
                                            onClick={() => handleFollowAction(req.id, 'accept')} 
                                            className="flex-1 py-2.5 bg-teal-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-700 shadow-md disabled:opacity-50"
                                        >
                                            {actionId === req.id ? <Loader2 size={12} className="animate-spin mx-auto"/> : 'Aceptar'}
                                        </button>
                                        <button 
                                            disabled={!!actionId}
                                            onClick={() => handleFollowAction(req.id, 'decline')} 
                                            className="flex-1 py-2.5 bg-white border border-slate-200 text-slate-400 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-50 hover:text-rose-500 transition-all disabled:opacity-50"
                                        >
                                            Eliminar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </section>

                {/* MIS SOLICITUDES ENVIADAS (LIBROS) */}
                <section className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-8">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><Send size={24} /></div>
                            <h2 className="text-sm font-black uppercase tracking-widest text-slate-700">Estado de mis peticiones <span className="ml-2 bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full text-[10px]">{sentBookRequests.length}</span></h2>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {sentBookRequests.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-300 italic text-[10px] uppercase font-bold">Aún no has solicitado ningún libro.</p>
                            </div>
                        ) : (
                            sentBookRequests.map((req) => (
                                <div key={req.id} className="flex items-center gap-6 p-4 bg-white border border-slate-100 rounded-3xl group hover:shadow-lg transition-all">
                                    <div className="w-16 h-20 rounded-xl overflow-hidden shadow-md shrink-0">
                                        <img src={req.listing.book.urlPortada} className="w-full h-full object-cover" alt="Libro" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h4 className="font-black text-slate-900 text-sm uppercase truncate tracking-tight">{req.listing.book.title}</h4>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase">{req.listing.book.author}</p>
                                        <div className="mt-3 flex items-center gap-4 text-[10px] text-slate-500 font-medium italic">
                                            <span>Para: <span className="text-teal-600 not-italic font-bold">@{req.listing.user.fullName.split(' ')[0]}</span></span>
                                            <span className="hidden sm:block">Fecha: {new Date(req.createdAt).toLocaleDateString()}</span>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            req.status === 'pending' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                                            req.status === 'accepted' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 
                                            'bg-rose-50 text-rose-600 border-rose-100'
                                        }`}>
                                            {req.status === 'pending' ? 'En espera' : req.status === 'accepted' ? 'Aceptado' : 'Rechazado'}
                                        </span>
                                        {req.status === 'accepted' && (
                                            <button 
                                                onClick={() => navigate(`/chat/${req.listing.user.id}`)} 
                                                className="p-3 bg-teal-50 text-teal-600 hover:bg-teal-600 hover:text-white rounded-2xl transition-all shadow-sm"
                                                title="Contactar para entrega"
                                            >
                                                <MessageCircle size={18} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </section>
            </main>
        </div>
    );
};