import { useEffect, useState, useCallback } from 'react';
import api from '../../services/api';
import { CreateListingModal } from './components/CreateListingModal';
import {
    Leaf, Plus, Search, MessageCircle,
    Tag, RefreshCw, Heart, Loader2, ShoppingBag,
    Trash2, Clock
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const ActionModal = ({ isOpen, type, title, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    const configs: any = {
        delete: { icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-50', btn: 'bg-rose-600', label: 'Eliminar Anuncio', desc: '¿Quieres retirar este libro? Se borrará permanentemente de tu inventario.' },
        donate: { icon: Heart, color: 'text-amber-500', bg: 'bg-amber-50', btn: 'bg-gradient-to-r from-amber-500 to-orange-600', label: 'Confirmar Donación', desc: '¿Confirmas que has donado este libro fuera de la app? Aparecerá en tu historial de impacto.' },
        return: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50', btn: 'bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600', label: 'Confirmar Devolución', desc: '¿Has recibido el libro de vuelta? Volverá a tu inventario activo.' }
    };
    const c = configs[type] || configs.delete;
    const Icon = c.icon;

    return (
        <div className="fixed inset-0 z-[800] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[3.5rem] p-10 max-w-sm w-full shadow-2xl border-[12px] border-white text-center animate-in zoom-in-95">
                <div className={`w-20 h-20 ${c.bg} ${c.color} rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner`}>
                    <Icon size={36} strokeWidth={2.5} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic">{c.label}</h3>
                <p className="text-slate-500 text-[11px] font-medium mb-8 leading-relaxed italic px-4">
                    {title && <span className="block font-black text-slate-800 not-italic mb-2 uppercase text-[10px]">"{title}"</span>}
                    {c.desc}
                </p>
                <div className="flex flex-col gap-3">
                    <button onClick={onConfirm} className={`w-full py-4 ${c.btn} text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl active:scale-95 transition-all`}>Confirmar</button>
                    <button onClick={onClose} className="w-full py-3 text-slate-400 font-black uppercase text-[9px] tracking-widest hover:text-slate-600 transition-colors">Volver atrás</button>
                </div>
            </div>
        </div>
    );
};

export const SustainabilityView = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'market' | 'history'>('market');
    const [listings, setListings] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [listingToEdit, setListingToEdit] = useState<any>(null);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', data: null as any });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [listRes, reqRes] = await Promise.all([
                api.get('/sustainability/listings/me'),
                api.get('/sustainability/requests/me')
            ]);

            setListings(listRes.data.filter((l: any) => l.isAvailable === true));

            const completedRequests = reqRes.data.filter((r: any) => r.status !== 'pending');

            const donatedManual = listRes.data
                .filter((l: any) => l.isAvailable === false && !reqRes.data.some((r: any) => r.listing?.id === l.id && r.status !== 'rejected'))
                .map((l: any) => ({
                    ...l,
                    id: `don-${l.id}`,
                    status: 'donated',
                    isManualDonation: true,
                    listing: { ...l },
                    createdAt: l.updatedAt || l.createdAt
                }));

            const combined = [...completedRequests, ...donatedManual].sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );

            setHistory(combined);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []); 

    useEffect(() => { loadData(); }, [loadData]);

    const handleActionConfirm = async () => {
        const { type, data } = actionModal;
        try {
            const targetId = data.listing?.id || data.id;
            if (type === 'delete') await api.delete(`/sustainability/listings/${targetId}`);
            if (type === 'donate') await api.post(`/sustainability/listings/${targetId}/donate`);
            if (type === 'return') await api.patch(`/sustainability/requests/${data.id}/return`);

            setActionModal({ isOpen: false, type: '', data: null });
            loadData();
        } catch { console.error("Error"); }
    };

    if (loading) return <div className="min-h-screen bg-[#F0F9F9] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-teal-600" /></div>;

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-32 text-left">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
                <header className="mb-10">
                    <h1 className="text-4xl font-black text-slate-900 mb-2 uppercase tracking-tighter italic flex items-center gap-4">
                        <Leaf className="text-teal-600" size={40} /> Rincón Circular
                    </h1>
                    <p className="text-slate-400 font-bold text-[11px] uppercase tracking-[0.2em] italic decoration-teal-500/30 underline underline-offset-8">
                        Economía circular de {user?.fullName?.split(' ')[0]}
                    </p>
                </header>

                <div className="flex items-center gap-3 mb-10 overflow-x-auto pb-4 no-scrollbar">
                    <button
                        onClick={() => setActiveTab('market')}
                        className={`px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap shadow-sm border ${activeTab === 'market'
                            ? "bg-gradient-to-r from-slate-800 via-teal-700 to-emerald-700 text-white shadow-xl scale-105"
                            : "bg-white text-slate-400 border border-slate-100"
                            }`}
                    >
                        <ShoppingBag size={16} /> Mi Inventario
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`px-8 py-4 rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] transition-all flex items-center gap-3 whitespace-nowrap shadow-sm border ${activeTab === 'history'
                            ? "bg-gradient-to-r from-slate-800 via-teal-700 to-emerald-700 text-white shadow-xl scale-105"
                            : "bg-white text-slate-400 border border-slate-100"
                            }`}
                    >
                        <Clock size={16} /> Mi Historial
                    </button>
                </div>

                <main>
                    {activeTab === 'market' ? (
                        <MarketplaceSection
                            listings={listings}
                            onOpenModal={() => { setListingToEdit(null); setIsCreateOpen(true); }}
                            onEdit={(item: any) => { setListingToEdit(item); setIsCreateOpen(true); }}
                            onAction={(type: string, item: any) => setActionModal({ isOpen: true, type, data: item })}
                        />
                    ) : (
                        <HistorySection
                            items={history}
                            onAction={(type: string, item: any) => setActionModal({ isOpen: true, type, data: item })}
                        />
                    )}
                </main>
            </div>

            <CreateListingModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadData} listingToEdit={listingToEdit} />
            <ActionModal
                isOpen={actionModal.isOpen}
                type={actionModal.type}
                title={actionModal.data?.book?.title || actionModal.data?.listing?.book?.title}
                onClose={() => setActionModal({ isOpen: false, type: '', data: null })}
                onConfirm={handleActionConfirm}
            />
        </div>
    );
};

// --- MI INVENTARIO ---
const MarketplaceSection = ({ listings, onOpenModal, onEdit, onAction }: any) => {
    const [searchTerm, setSearchTerm] = useState('');
    const filtered = listings.filter((l: any) => l.book?.title.toLowerCase().includes(searchTerm.toLowerCase()));

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="flex flex-col md:flex-row gap-4">
                <div className="relative flex-1 group">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-300 group-focus-within:text-teal-600 transition-colors" />
                    <input type="text" placeholder="Filtrar por título..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-14 pr-6 py-5 bg-white border border-slate-100 rounded-[2rem] text-sm font-bold shadow-sm outline-none focus:ring-8 focus:ring-teal-500/5 transition-all" />
                </div>
                <button
                    onClick={onOpenModal}
                    className="flex items-center justify-center gap-3 px-10 py-5 bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white rounded-[2rem] font-black uppercase text-[11px] tracking-widest shadow-lg hover:shadow-teal-500/30 active:scale-95 transition-all"
                >
                    <Plus size={20} strokeWidth={3} /> Publicar Libro
                </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 sm:gap-8">
                {filtered.map((item: any) => (
                    <div key={item.id} className="group flex flex-col h-full bg-white rounded-[2.5rem] p-3 border border-slate-100 shadow-sm hover:shadow-2xl transition-all relative">
                        <div className="relative aspect-[2/3] rounded-[2rem] overflow-hidden mb-4 shadow-inner bg-slate-50">
                            {item.book?.urlPortada && <img src={item.book.urlPortada} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />}
                            <div className="absolute top-3 -left-1 z-20">
                                <div className={`pl-4 pr-5 py-2 ${item.type === 'sale' ? 'bg-emerald-500' : 'bg-blue-600'} rounded-r-2xl shadow-xl flex items-center gap-2 text-white border-y border-r border-white/20`}>
                                    <span className="text-[9px] font-black uppercase tracking-tighter">{item.type === 'sale' ? `${item.price}€` : 'Préstamo'}</span>
                                </div>
                            </div>
                            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-all flex flex-col justify-center items-center gap-2 p-4">
                                <button onClick={() => onEdit(item)} className="w-full py-2.5 bg-white text-slate-900 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-teal-50 transition-colors">Editar</button>
                                <button onClick={() => onAction('delete', item)} className="w-full py-2.5 bg-rose-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-600">Borrar</button>
                            </div>
                        </div>
                        <div className="px-1 pb-2 flex-1 flex flex-col text-left">
                            <h3 className="font-black text-slate-800 text-[10px] mb-3 line-clamp-2 uppercase leading-tight min-h-[2.5em]">{item.book?.title}</h3>
                            <button onClick={() => onAction('donate', item)} className="mt-auto w-full py-2.5 bg-amber-50 text-amber-600 rounded-xl text-[8px] font-black uppercase border border-amber-100 hover:bg-amber-500 hover:text-white transition-all flex items-center justify-center gap-2 shadow-sm">
                                <Heart size={12} /> Marcar Donado
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {filtered.length === 0 && <div className="text-center py-32 bg-white/50 rounded-[3rem] border-4 border-dashed border-white"><p className="text-slate-400 font-black uppercase text-xs tracking-widest">Inventario vacío</p></div>}
        </div>
    );
};

// --- HISTORIAL ---
const HistorySection = ({ items, onAction }: any) => {
    const navigate = useNavigate();

    return (
        <div className="space-y-6 animate-in fade-in duration-500 max-w-4xl mx-auto text-left">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-8 flex items-center gap-3">
                <Clock size={24} className="text-teal-600" /> Registro de actividad
            </h3>

            <div className="grid gap-4">
                {items.map((item: any) => {
                    const isManualDonation = item.status === 'donated' || item.isManualDonation;
                    const bookData = item.listing?.book || item.book;
                    const requesterName = item.requester?.fullName?.split(' ')[0] || 'Alguien';
                    const ownerName = item.listing?.user?.fullName?.split(' ')[0] || 'un lector';

                    let statusLabel = "Cancelado";
                    let statusStyles = "bg-rose-50 text-rose-600 border-rose-100";
                    let descriptionText = "";

                    if (isManualDonation) {
                        statusLabel = "Donado";
                        statusStyles = "bg-amber-50 text-amber-600 border-amber-100";
                        descriptionText = "Donación realizada fuera de la app";
                    } else if (item.listing?.type === 'sale' && item.status === 'accepted') {
                        statusLabel = "Vendido";
                        statusStyles = "bg-emerald-50 text-emerald-600 border-emerald-100";
                        descriptionText = item.isOwner ? `Vendido a @${requesterName}` : `Comprado a @${ownerName}`;
                    } else if (item.listing?.type === 'loan' && item.status === 'accepted') {
                        statusLabel = "En Préstamo";
                        statusStyles = "bg-teal-50 text-teal-700 border-teal-100";
                        descriptionText = item.isOwner ? `Cedido a @${requesterName}` : `Recibido de @${ownerName}`;
                    } else if (item.listing?.type === 'loan' && item.status === 'completed') {
                        statusLabel = "Devuelto";
                        statusStyles = "bg-blue-50 text-blue-600 border-blue-100";
                        descriptionText = item.isOwner ? `Recuperado de @${requesterName}` : `Devuelto a @${ownerName}`;
                    } else {
                        descriptionText = item.status === 'rejected' ? "Solicitud rechazada" : "Movimiento cancelado";
                    }

                    return (
                        <div key={item.id} className="bg-white p-5 rounded-[2.5rem] border border-slate-100 flex flex-col sm:flex-row items-center justify-between shadow-sm gap-6 hover:shadow-md transition-all">
                            <div className="flex items-center gap-5 flex-1 w-full">
                                <div className="relative shrink-0">
                                    {bookData?.urlPortada ? (
                                        <img src={bookData.urlPortada} className="w-16 h-24 object-cover rounded-2xl grayscale-[0.4] shadow-sm border border-slate-100" alt="" />
                                    ) : (
                                        <div className="w-16 h-24 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-300 italic text-[8px]">Sin portada</div>
                                    )}
                                    <div className="absolute -bottom-2 -right-2 bg-white p-2 rounded-full shadow-md border border-slate-50">
                                        {statusLabel === 'Donado' ? <Heart size={16} className="text-amber-500" /> : 
                                         statusLabel === 'Vendido' ? <Tag size={16} className="text-emerald-500" /> :
                                         <Clock size={16} className={statusLabel === 'Devuelto' ? "text-blue-500" : "text-teal-500"} />}
                                    </div>
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-slate-800 text-sm truncate uppercase tracking-tight leading-tight">{bookData?.title}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{descriptionText}</p>
                                    <span className={`text-[8px] px-3 py-1 rounded-full font-black uppercase mt-3 inline-block border ${statusStyles}`}>
                                        {statusLabel}
                                    </span>
                                </div>
                            </div>

                            {!isManualDonation && statusLabel !== 'Vendido' && (
                                <div className="flex gap-2 w-full sm:w-auto">
                                    {item.isOwner && statusLabel === 'En Préstamo' && (
                                        <button onClick={() => onAction('return', item)} className="flex items-center justify-center gap-2 px-4 py-1.5 bg-gradient-to-r from-slate-700 via-teal-600 to-emerald-600 text-white text-[9px] font-black uppercase tracking-widest rounded-full shadow-md shadow-teal-900/20 transition-all duration-300 hover:scale-105 hover:saturate-150 active:scale-95 whitespace-nowrap border-none outline-none">
                                            <RefreshCw size={12} strokeWidth={3} /> Confirmar Retorno
                                        </button>
                                    )}
                                    {item.status === 'accepted' && (
                                        <button onClick={() => navigate('/chat')} className="p-4 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm">
                                            <MessageCircle size={22} />
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
            {items.length === 0 && (
                <div className="text-center py-24 bg-slate-50 rounded-[3rem] border border-slate-100">
                    <p className="text-slate-400 italic text-[10px] uppercase font-black tracking-widest">Sin movimientos registrados aún</p>
                </div>
            )}
        </div>
    );
};