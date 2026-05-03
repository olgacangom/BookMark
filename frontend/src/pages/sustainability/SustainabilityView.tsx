import { useEffect, useState, useCallback, useMemo } from 'react';
import api from '../../services/api';
import { CreateListingModal } from './components/CreateListingModal';
import {
    Leaf, Plus, Search,
    RefreshCw, Heart, Loader2, 
    Trash2, Clock, Tag, 
    ShoppingBag, Info, Globe, Sparkle,
    Edit3, Users, Calendar, X, Check, HandHelping
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

const ActionModal = ({ isOpen, type, title, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    const configs: any = {
        delete: { icon: Trash2, color: 'text-rose-500', bg: 'bg-rose-50', btn: 'bg-slate-900', label: 'Eliminar Anuncio', desc: '¿Quieres retirar este libro? Se borrará permanentemente.' },
        donate: { icon: Heart, color: 'text-amber-500', bg: 'bg-amber-50', btn: 'bg-amber-500', label: 'Confirmar Donación', desc: '¿Confirmas que has donado este libro fuera de la app?' },
        return: { icon: RefreshCw, color: 'text-blue-500', bg: 'bg-blue-50', btn: 'bg-[#407B75]', label: 'Confirmar Devolución', desc: '¿Has recibido el libro de vuelta?' }
    };
    const c = configs[type] || configs.delete;
    const Icon = c.icon;

    return (
        <div className="fixed inset-0 z-[1200] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl border-4 border-white text-center animate-in zoom-in-95">
                <div className={`w-14 h-14 ${c.bg} ${c.color} rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner`}><Icon size={24} strokeWidth={2.5} /></div>
                <h3 className="text-lg font-black text-slate-900 mb-1 uppercase tracking-tight">{c.label}</h3>
                <p className="text-slate-500 text-[10px] font-medium mb-6 italic px-2">
                    {title && <span className="block font-black text-slate-800 not-italic mb-1 uppercase">"{title}"</span>}
                    {c.desc}
                </p>
                <div className="flex flex-col gap-2">
                    <button onClick={onConfirm} className={`w-full py-3.5 ${c.btn} text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all shadow-md`}>Confirmar</button>
                    <button onClick={onClose} className="w-full py-2 text-slate-400 font-black uppercase text-[9px] hover:text-slate-600 transition-colors">Cancelar</button>
                </div>
            </div>
        </div>
    );
};

// MODAL DETALLES AMIGOS ---
const SocialDetailsModal = ({ isOpen, onClose, listing, onToggleRequest, isRequested }: any) => {
    if (!isOpen || !listing) return null;
    const isSale = listing.type === 'sale';

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-slate-900/60 backdrop-blur-md p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] w-full max-w-sm overflow-hidden shadow-2xl border-[8px] border-white animate-in zoom-in-95 flex flex-col relative">
                
                <header className="relative h-56 bg-slate-100 shrink-0">
                    <img src={listing.book?.urlPortada} className="w-full h-full object-cover blur-lg opacity-40 scale-110" alt="" />
                    <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center pt-4">
                        <img src={listing.book?.urlPortada} className="h-40 w-28 object-cover rounded-xl shadow-xl border-2 border-white rotate-[-1deg]" alt="" />
                    </div>
                    <button onClick={onClose} className="absolute top-3 right-3 p-1.5 bg-black/5 hover:bg-black/10 text-slate-700 rounded-full transition-all"><X size={16}/></button>
                </header>

                <div className="px-6 pb-8 pt-2 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest mb-3 border ${isSale ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'}`}>
                        {isSale ? `Venta • ${listing.price}€` : `Préstamo • ${listing.maxLoanDays || 15} Días`}
                    </span>

                    <h3 className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-tight mb-0.5">{listing.book?.title}</h3>
                    <p className="text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-6">{listing.book?.author}</p>

                    <div className="space-y-2 mb-8 bg-slate-50/50 p-4 rounded-2xl">
                        <div className="flex justify-between items-center py-2 border-b border-slate-100/50">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Dueño</span>
                            <div className="flex items-center gap-1.5">
                                <img src={listing.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${listing.user?.email}`} className="w-4 h-4 rounded-full" alt="" />
                                <span className="text-[10px] font-bold text-slate-700">@{listing.user?.fullName?.split(' ')[0]}</span>
                            </div>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-slate-100/50">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">{isSale ? 'Precio' : 'Días Préstamo'}</span>
                            <span className="text-[10px] font-bold text-slate-700">{isSale ? `${listing.price}€` : `${listing.maxLoanDays || 15} días`}</span>
                        </div>
                        <div className="flex justify-between items-center py-2">
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Estado</span>
                            <span className="text-[10px] font-bold text-slate-700 uppercase">{listing.condition?.replace('_', ' ') || 'Excelente'}</span>
                        </div>
                    </div>

                    <button 
                        onClick={() => onToggleRequest(listing.id, isRequested)}
                        className={`w-full py-4 rounded-xl font-black uppercase text-[10px] tracking-[0.2em] transition-all shadow-lg active:scale-95 ${isRequested ? 'bg-amber-500 text-white' : 'bg-slate-900 text-white hover:bg-teal-600'}`}
                    >
                        {isRequested ? 'Solicitado' : 'Solicitar ahora'}
                    </button>
                </div>
            </div>
        </div>
    );
};

// --- MODAL DE FEEDBACK ---
const FeedbackModal = ({ isOpen, onClose, type }: any) => {
    if (!isOpen) return null;
    const isSuccess = type === 'success';
    return (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-xs w-full shadow-2xl text-center animate-in zoom-in-95 border-4 border-white">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isSuccess ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    {isSuccess ? <Check size={32} strokeWidth={3} /> : <X size={32} strokeWidth={3} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{isSuccess ? '¡Enviado!' : 'Cancelado'}</h3>
                <p className="text-slate-500 text-xs font-medium italic mb-6 leading-relaxed">{isSuccess ? 'Tu petición ya está en el buzón del dueño.' : 'Has retirado la solicitud.'}</p>
                <button onClick={onClose} className="w-full py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-600 transition-all">Cerrar</button>
            </div>
        </div>
    );
};

export const SustainabilityView = () => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState<'market' | 'history' | 'social'>('market');
    const [listings, setListings] = useState<any[]>([]);
    const [history, setHistory] = useState<any[]>([]);
    const [socialListings, setSocialListings] = useState<any[]>([]);
    const [mySentRequestIds, setMySentRequestIds] = useState<string[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [listingToEdit, setListingToEdit] = useState<any>(null);
    const [feedback, setFeedback] = useState<{ isOpen: boolean, type: 'success' | 'cancel' }>({ isOpen: false, type: 'success' });
    const [socialModalData, setSocialModalData] = useState<any>(null);
    const [actionModal, setActionModal] = useState({ isOpen: false, type: '', data: null as any });

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [listRes, reqRes] = await Promise.all([
                api.get('/sustainability/listings/me'),
                api.get('/sustainability/requests/me')
            ]);
            try {
                const socialRes = await api.get('/sustainability/listings/social');
                setSocialListings(socialRes.data || []);
            } catch { setSocialListings([]); }

            setListings(listRes.data.filter((l: any) => l.isAvailable === true));
            const sent = reqRes.data.filter((r: any) => !r.isOwner && r.status === 'pending');
            setMySentRequestIds(sent.map((r: any) => r.listing.id));

            const completedRequests = reqRes.data.filter((r: any) => r.status !== 'pending');
            const donatedManual = listRes.data
                .filter((l: any) => l.isAvailable === false && !reqRes.data.some((r: any) => r.listing?.id === l.id && r.status !== 'rejected'))
                .map((l: any) => ({ ...l, id: `don-${l.id}`, status: 'donated', isManualDonation: true, listing: { ...l }, createdAt: l.updatedAt || l.createdAt }));

            const combined = [...completedRequests, ...donatedManual].sort((a: any, b: any) =>
                new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
            setHistory(combined);
        } catch (e) { console.error(e); }
        finally { setLoading(false); }
    }, []);

    useEffect(() => { loadData(); }, [loadData]);

    const impactStats = useMemo(() => ({
        donated: history.filter(i => i.status === 'donated' || i.isManualDonation).length,
        sold: history.filter(i => i.listing?.type === 'sale' && i.status === 'accepted').length,
        returned: history.filter(i => i.listing?.type === 'loan' && i.status === 'completed').length,
    }), [history]);

    const handleToggleRequest = async (listingId: string, isRequested: boolean) => {
        try {
            if (isRequested) {
                await api.delete(`/sustainability/requests/cancel/${listingId}`);
                setMySentRequestIds(prev => prev.filter(id => id !== listingId));
                setFeedback({ isOpen: true, type: 'cancel' });
            } else {
                await api.post('/sustainability/requests', { listingId });
                setMySentRequestIds(prev => [...prev, listingId]);
                setFeedback({ isOpen: true, type: 'success' });
            }
            if (socialModalData) setSocialModalData(null);
            loadData();
        } catch (e) { console.error(e); }
    };

    const handleActionConfirm = async () => {
        const { type, data } = actionModal;
        try {
            const targetId = data.listing?.id || data.id;
            if (type === 'delete') await api.delete(`/sustainability/listings/${targetId}`);
            if (type === 'donate') await api.post(`/sustainability/listings/${targetId}/donate`);
            setActionModal({ isOpen: false, type: '', data: null });
            loadData();
        } catch { console.error("Error"); }
    };

    if (loading) return <div className="min-h-screen bg-[#F8FAFB] flex items-center justify-center"><Loader2 className="w-10 h-10 animate-spin text-[#407B75]" /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-[#1E293B] pb-32 text-left">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
                
                <header className="flex justify-between items-start mb-12">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-[#F0FDF4] rounded-2xl border border-[#CCFBF1]"><Leaf className="text-[#407B75]" size={32} /></div>
                        <div>
                            <h1 className="text-3xl font-black text-[#1E293B] uppercase tracking-tighter italic leading-none mb-1">Rincón Circular</h1>
                            <p className="text-[#94A3B8] font-bold text-[9px] uppercase tracking-widest italic leading-none">Economía de {user?.fullName?.split(' ')[0]}</p>
                        </div>
                    </div>
                    <button onClick={() => { setListingToEdit(null); setIsCreateOpen(true); }} className="flex items-center gap-2 px-6 py-3 bg-[#2F4858] text-white rounded-[1rem] font-bold text-[10px] uppercase shadow-md hover:bg-[#1E2E38] transition-all tracking-widest"><Plus size={16} strokeWidth={3} /> Publicar Libro</button>
                </header>

                <div className="grid lg:grid-cols-12 gap-8">
                    <div className="lg:col-span-9">
                        <div className="flex items-center gap-2 bg-white p-2 rounded-2xl w-fit shadow-sm border border-slate-100/50 mb-10 overflow-x-auto no-scrollbar">
                            {[
                                { id: 'market', icon: ShoppingBag, label: 'Mi Inventario' },
                                { id: 'history', icon: Clock, label: 'Mi Historial' },
                                { id: 'social', icon: Users, label: 'Biblioteca Amigos' }
                            ].map((tab) => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id as any)} className={`px-8 py-3.5 rounded-xl font-black uppercase text-[10px] tracking-[0.15em] transition-all flex items-center gap-2 whitespace-nowrap ${activeTab === tab.id ? "bg-[#1E293B] text-white shadow-md scale-[1.02]" : "text-[#94A3B8] bg-white hover:bg-slate-50"}`}>
                                    <tab.icon size={14} strokeWidth={2.5}/> {tab.label}
                                </button>
                            ))}
                        </div>

                        <main>
                            {activeTab === 'market' && <MarketplaceSection listings={listings} onEdit={(item: any) => { setListingToEdit(item); setIsCreateOpen(true); }} loadData={loadData} onAction={(type: string, item: any) => setActionModal({ isOpen: true, type, data: item })} />}
                            {activeTab === 'history' && <HistorySection items={history} />}
                            {activeTab === 'social' && <SocialSection listings={socialListings} onOpenDetails={(item: any) => setSocialModalData(item)} myRequests={mySentRequestIds} />}
                        </main>
                    </div>

                    <aside className="lg:col-span-3 space-y-6 h-fit sticky top-8">
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="text-[#407B75]"><Sparkle size={20} fill="currentColor"/></div>
                                <h3 className="font-black text-[#1E293B] uppercase text-[11px] tracking-widest mt-1">Tu Impacto</h3>
                            </div>
                            <div className="space-y-6">
                                <ImpactItem icon={Heart} color="text-amber-500" count={impactStats.donated} label="Libros donados" />
                                <ImpactItem icon={Tag} color="text-[#407B75]" count={impactStats.sold} label="Libros vendidos" />
                                <ImpactItem icon={RefreshCw} color="text-[#5B6BF9]" count={impactStats.returned} label="Libros recuperados" />
                            </div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50 text-center">
                            <h3 className="font-black text-[#1E293B] uppercase text-[10px] tracking-widest mb-4">Un pequeño gesto</h3>
                            <p className="text-[11px] text-[#64748B] font-medium leading-relaxed mb-6">Cada libro que compartes genera un gran impacto ambiental.</p>
                            <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto text-indigo-500 border border-indigo-100/50 shadow-inner"><HandHelping size={24} /></div>
                        </div>

                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-50">
                            <h3 className="font-black text-[#1E293B] uppercase text-[10px] tracking-widest mb-4 flex items-center gap-2">¿Sabías que? <Info size={12}/></h3>
                            <p className="text-[11px] text-[#64748B] font-medium leading-relaxed">Reutilizar un libro ahorra hasta 10kg de CO₂.</p>
                            <div className="mt-6 flex justify-end">
                                <div className="p-2.5 bg-emerald-50 rounded-full"><Globe size={16} className="text-emerald-600" /></div>
                            </div>
                        </div>
                    </aside>
                </div>
            </div>

            <CreateListingModal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} onSuccess={loadData} listingToEdit={listingToEdit} />
            <FeedbackModal isOpen={feedback.isOpen} onClose={() => setFeedback({ ...feedback, isOpen: false })} type={feedback.type} />
            <ActionModal isOpen={actionModal.isOpen} type={actionModal.type} title={actionModal.data?.book?.title || actionModal.data?.listing?.book?.title} onClose={() => setActionModal({ isOpen: false, type: '', data: null })} onConfirm={handleActionConfirm} />
            <SocialDetailsModal 
                isOpen={!!socialModalData} 
                listing={socialModalData} 
                onClose={() => setSocialModalData(null)} 
                onToggleRequest={handleToggleRequest}
                isRequested={socialModalData ? mySentRequestIds.includes(socialModalData.id) : false}
            />
        </div>
    );
};

const ImpactItem = ({ icon: Icon, color, count, label }: any) => (
    <div className="flex items-center gap-4">
        <div className={`w-9 h-9 flex items-center justify-center rounded-xl bg-slate-50`}><Icon size={20} className={color} strokeWidth={2.5}/></div>
        <div>
            <div className="text-[16px] font-black text-[#1E293B] leading-none mb-0.5">{count}</div>
            <div className="text-[9px] font-bold text-[#94A3B8] uppercase tracking-widest">{label}</div>
        </div>
    </div>
);

// --- SECCIÓN MI INVENTARIO ---
const MarketplaceSection = ({ listings, onEdit, onAction }: any) => {
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Todos');

    const filtered = useMemo(() => listings.filter((l: any) => {
        const matchesSearch = l.book?.title.toLowerCase().includes(search.toLowerCase());
        const matchesStatus = statusFilter === 'Todos' || (statusFilter === 'Venta' ? l.type === 'sale' : l.type === 'loan');
        return matchesSearch && matchesStatus;
    }), [listings, search, statusFilter]);

    return (
        <div className="space-y-8 animate-in fade-in">
            <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1 group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                    <input type="text" placeholder="Buscar por libro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-14 pr-6 py-4 bg-white border border-slate-100 rounded-2xl text-[11px] font-bold shadow-sm outline-none focus:ring-2 focus:ring-[#407B75]/10" />
                </div>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="px-6 py-4 bg-white border border-slate-100 rounded-2xl text-[10px] font-black uppercase text-slate-500 outline-none cursor-pointer shadow-sm">
                    <option value="Todos">TODOS LOS ESTADOS</option>
                    <option value="Venta">VENTA</option>
                    <option value="Prestamo">PRÉSTAMO</option>
                </select>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-6">
                {filtered.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-[2rem] p-4 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 flex flex-col group relative">
                        <div className="relative aspect-[3/4.5] rounded-[1.5rem] overflow-hidden mb-4 bg-slate-50">
                            {item.book?.urlPortada && <img src={item.book.urlPortada} className="w-full h-full object-cover" alt="" />}
                            <div className="absolute top-0 left-0 right-0 p-3 flex flex-col items-center gap-1.5">
                                <div className={`px-4 py-1.5 ${item.type === 'sale' ? 'bg-[#407B75]' : 'bg-[#5B6BF9]'} text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-md`}>
                                    {item.type === 'sale' ? `${item.price}€` : 'PRÉSTAMO'}
                                </div>
                                {item.type === 'loan' && (
                                    <div className="px-3 py-1 bg-white/90 backdrop-blur-sm text-blue-600 text-[7px] font-black uppercase rounded-full border border-blue-100/50 flex items-center gap-1 shadow-sm">
                                        <Clock size={8} /> {item.maxLoanDays || 15} DÍAS
                                    </div>
                                )}
                            </div>
                            <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                                <button onClick={() => onEdit(item)} className="p-2 bg-white text-[#407B75] rounded-lg shadow-xl hover:bg-[#407B75] hover:text-white transition-all"><Edit3 size={14} /></button>
                                <button onClick={() => onAction('delete', item)} className="p-2 bg-white text-rose-500 rounded-lg shadow-xl hover:bg-rose-500 hover:text-white transition-all"><Trash2 size={14} /></button>
                            </div>
                        </div>
                        <div className="text-left flex-1 flex flex-col px-1">
                            <h3 className="font-black text-[#1E293B] text-[12px] mb-1 uppercase tracking-tight line-clamp-1 leading-none">{item.book?.title}</h3>
                            <p className="text-[#94A3B8] font-bold text-[8px] mb-4 uppercase tracking-widest">{item.book?.author}</p>
                            <div className="mt-auto space-y-3">
                                <div className="flex justify-center">
                                    <div className={`inline-flex px-3 py-1 rounded-full text-[6px] font-black uppercase tracking-widest ${item.isAvailable ? 'bg-[#F0FDF4] text-[#407B75]' : 'bg-amber-50 text-amber-600'}`}>
                                        • {item.isAvailable ? 'DISPONIBLE' : 'OCUPADO'}
                                    </div>
                                </div>
                                <button onClick={() => onAction('donate', item)} className="w-full py-3.5 bg-amber-50 text-amber-600 rounded-2xl text-[8px] font-black uppercase tracking-widest hover:bg-amber-100 transition-all shadow-sm border border-amber-200/30 flex items-center justify-center gap-2">
                                    <Heart size={14} /> MARCAR DONADO
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const HistorySection = ({ items }: any) => {
    return (
        <div className="space-y-6 animate-in fade-in">
            <div className="grid gap-4">
                {items.map((item: any) => {
                    const isManualDonation = item.status === 'donated' || item.isManualDonation;
                    const bookData = item.listing?.book || item.book;
                    const date = new Date(item.createdAt);
                    const statusLabel = isManualDonation ? "DONADO" : item.status.toUpperCase();
                    const statusStyles = item.status === 'donated' ? "bg-amber-50 text-amber-600" : "bg-[#F0FDF4] text-[#407B75]";

                    return (
                        <div key={item.id} className="bg-white p-5 rounded-[2rem] border border-slate-100 flex items-center justify-between shadow-sm hover:shadow-md transition-all group">
                            <div className="flex items-center gap-6 flex-1 text-left">
                                <img src={bookData?.urlPortada} className="w-16 h-24 object-cover rounded-xl shadow-sm grayscale-[0.3]" alt="" />
                                <div>
                                    <h4 className="font-black text-[#1E293B] text-[14px] uppercase tracking-tight mb-1">{bookData?.title}</h4>
                                    <p className="text-[11px] text-[#64748B] font-medium italic mb-3">{isManualDonation ? "Donación externa realizada" : `Intercambio con @${item.requester?.fullName?.split(' ')[0]}`}</p>
                                    <span className={`text-[8px] px-3 py-1 rounded-full font-black tracking-widest ${statusStyles}`}>{statusLabel}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-8">
                                <div className="text-right hidden sm:flex items-center gap-3 bg-slate-50 px-4 py-2.5 rounded-2xl border border-slate-100">
                                    <Calendar className="text-[#94A3B8]" size={14} />
                                    <div className="text-[10px] font-black text-[#64748B] uppercase tracking-widest">{date.toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

const SocialSection = ({ listings, error, onOpenDetails, myRequests }: any) => {
    if (error) return <EmptyState text="Error al cargar amigos" isSocial />;
    
    return (
        <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {listings.map((item: any) => (
                    <div key={item.id} className="bg-white rounded-[2rem] p-5 shadow-sm border border-slate-100 hover:shadow-xl transition-all duration-500 flex flex-col group">
                        <div className="relative aspect-[3/4.5] rounded-[1.5rem] overflow-hidden mb-5 bg-slate-50">
                            <img src={item.book?.urlPortada} className="w-full h-full object-cover" alt="" />
                            <div className="absolute bottom-4 left-0 right-0 flex justify-center">
                                <div className="flex items-center gap-2 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full shadow-sm">
                                    <img src={item.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user?.email}`} className="w-5 h-5 rounded-full object-cover" alt="" />
                                    <span className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">@{item.user?.fullName?.split(' ')[0]}</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-left px-1 flex-1 flex flex-col">
                            <h3 className="font-black text-[#1E293B] text-[13px] mb-1 uppercase line-clamp-1 leading-none">{item.book?.title}</h3>
                            <p className="text-[#94A3B8] font-bold text-[9px] mb-5 uppercase tracking-widest">{item.book?.author}</p>
                            <button 
                                onClick={() => onOpenDetails(item)} 
                                className={`mt-auto w-full py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-md transition-all ${myRequests.includes(item.id) ? 'bg-amber-500 text-white' : 'bg-[#407B75] text-white hover:bg-[#2b534f]'}`}
                            >
                                {myRequests.includes(item.id) ? 'Solicitado' : 'Ver detalles'}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            {listings.length === 0 && <EmptyState text="Sigue a otros para ver sus libros" isSocial />}
        </div>
    );
};

const EmptyState = ({ text, isSocial }: any) => (
    <div className={`text-center ${isSocial ? 'py-32' : 'py-40'} bg-white/50 rounded-[4rem] border-2 border-dashed border-slate-200`}>
        {isSocial ? <Users className="mx-auto text-slate-300 mb-4 w-10 h-10" /> : <ShoppingBag className="mx-auto text-slate-300 mb-4 w-10 h-10" />}
        <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest leading-none mb-1">{text}</p>
    </div>
);