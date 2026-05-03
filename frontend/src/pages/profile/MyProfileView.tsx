import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Loader2, Sparkles, BookOpen, Award, MapPin, Calendar,
    Share2, ChevronRight, Star, Trash2, AlertTriangle, User as UserIcon,
    MessageCircle, Check
} from 'lucide-react';
import api from '../../services/api';
import { bookService, Book } from '../../books/services/book.service';
import { BooksGrowthChart } from '../../components/stats/BooksGrowthChart';


const ConfirmDeleteAvatarModal = ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 border border-slate-100 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                    <AlertTriangle size={40} />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">¿Eliminar foto?</h3>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">Tu foto de perfil será eliminada permanentemente.</p>
                <div className="flex gap-4">
                    <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-rose-600 transition-all uppercase text-[10px] tracking-widest">Eliminar</button>
                </div>
            </div>
        </div>
    );
};


// --- MODAL DE SEGUIMIENTO  ---
const FollowModal = ({ isOpen, onClose, activeTab, setActiveTab, data, onStartChat }: any) => {
    if (!isOpen) return null;
    const list = activeTab === 'followers'
        ? data?.followerRelations?.map((f: any) => f.follower) || []
        : data?.followingRelations?.map((f: any) => f.following) || [];

    // LÓGICA DE RECIPROCIDAD
    const isReciprocal = (targetUserId: string) => {
        const followsMe = data?.followerRelations?.some((f: any) => f.follower.id === targetUserId);
        const iFollowThem = data?.followingRelations?.some((f: any) => f.following.id === targetUserId);
        return followsMe && iFollowThem;
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md animate-in fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[3rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 overflow-hidden border-[12px] border-white">
                <div className="flex border-b border-slate-50 bg-white">
                    <button onClick={() => setActiveTab('followers')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'followers' ? 'text-teal-600 bg-teal-50/30' : 'text-slate-400 hover:text-slate-600'}`}>Seguidores ({data?.followerRelations?.length || 0})</button>
                    <button onClick={() => setActiveTab('following')} className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'following' ? 'text-teal-600 bg-teal-50/30' : 'text-slate-400 hover:text-slate-600'}`}>Siguiendo ({data?.followingRelations?.length || 0})</button>
                </div>
                <div className="flex-1 overflow-y-auto p-6 space-y-3 bg-white custom-scrollbar">
                    {list.length > 0 ? list.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-slate-50 transition-all group border border-transparent hover:border-slate-100">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-full bg-slate-100 border-2 border-white shadow-sm overflow-hidden shrink-0">
                                    <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} className="w-full h-full object-cover" alt="" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-800 leading-none mb-1 uppercase tracking-tight">{u.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-bold tracking-widest uppercase">@{u.email.split('@')[0]}</p>
                                </div>
                            </div>

                            {/* EL BOTÓN DE CHATEAR SOLO SALE SI ES RECÍPROCO */}
                            {isReciprocal(u.id) ? (
                                <button
                                    onClick={() => onStartChat(u.id)}
                                    className="p-3 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                                    title="Enviar mensaje"
                                >
                                    <MessageCircle size={18} />
                                </button>
                            ) : (
                                <div className="p-3 opacity-20 grayscale" title="Debes seguirte mutuamente para chatear">
                                    <MessageCircle size={18} className="text-slate-400" />
                                </div>
                            )}
                        </div>
                    )) : (
                        <div className="py-24 text-center">
                            <UserIcon className="mx-auto text-slate-100 mb-4" size={48} />
                            <p className="text-slate-300 font-black uppercase text-[10px] tracking-[0.3em]">Lista vacía</p>
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="p-5 text-[10px] font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-[0.2em] border-t border-slate-50 bg-slate-50/50">Cerrar Ventana</button>
            </div>
        </div>
    );
};


export const MyProfileView = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Datos
    const [profileData, setProfileData] = useState<any>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [growthData, setGrowthData] = useState([]);

    // UI
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showShareTooltip, setShowShareTooltip] = useState(false);

    const [formData, setFormData] = useState({ name: '', bio: '' });
    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

    // Estados de navegación interna
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers'); 
    const [activeProfileTab, setActiveProfileTab] = useState('Actividad'); 

    const fetchAllData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setIsLoading(true);
            const [profileRes, booksRes, statsRes] = await Promise.all([
                api.get(`/users/profile/${user.id}`),
                bookService.getMyBooks(),
                api.get('/users/stats/growth')
            ]);
            setProfileData(profileRes.data);
            setBooks(booksRes);
            setGrowthData(statsRes.data);
            setFormData({ name: profileRes.data.fullName || '', bio: profileRes.data.bio || '' });
        } catch (error) {
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    const stats = {
        read: books.filter(b => b.status === "Read"),
        totalPages: books.filter(b => b.status === "Read").reduce((acc, b) => acc + (Number(b.pageCount) || 0), 0),
        reviews: books.filter(b => b.review && b.review.length > 0)
    };

    const getRank = (pages: number) => {
        if (pages > 5000) return { title: 'Erudito', icon: '🏅' };
        if (pages > 1000) return { title: 'Lector Voraz', icon: '📖' };
        return { title: 'Iniciado', icon: '👶' };
    };

    const joinDate = profileData?.createdAt ? new Intl.DateTimeFormat('es-ES', { month: 'long', year: 'numeric' }).format(new Date(profileData.createdAt)) : 'Reciente';

    const handleShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: `Perfil de ${profileData.fullName} en BookMark`,
                    text: `Echa un vistazo a mi biblioteca.`,
                    url: window.location.href,
                });
            } catch { console.log('Compartir cancelado'); }
        } else {
            navigator.clipboard.writeText(window.location.href);
            setShowShareTooltip(true);
            setTimeout(() => setShowShareTooltip(false), 2000);
        }
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]; if (!file) return;
        const fd = new FormData(); fd.append('file', file);
        setIsUploadingAvatar(true);
        try {
            const { data } = await api.post('/users/avatar', fd);
            updateUser(data);
            fetchAllData();
        } finally { setIsUploadingAvatar(false); }
    };

    const handleDeleteAvatar = async () => {
        setIsDeleteModalOpen(false);
        setIsUploadingAvatar(true);
        try {
            await api.delete('/users/avatar');
            fetchAllData();
        } finally { setIsUploadingAvatar(false); }
    };

    const handleSaveProfile = async () => {
        setIsSaving(true);
        try {
            const { data } = await api.patch('/users/profile', { fullName: formData.name, bio: formData.bio });
            updateUser(data);
            setIsEditing(false);
            fetchAllData();
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    const handleStartChat = async (targetUserId: string) => {
        try {
            const { data } = await api.post(`/chat/conversation/${targetUserId}`);
            if (data) {
                setIsFollowModalOpen(false);
                navigate('/chat');
            }
        } catch { alert("Error al iniciar chat."); }
    };

    if (isLoading || !profileData) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]"><Loader2 className="text-teal-600 animate-spin" size={40} /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-24 text-left">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div
                    className="rounded-[2.5rem] shadow-2xl mb-8 p-8 md:p-12 relative overflow-hidden bg-cover bg-center"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop')` }}
                >
                    <div className="absolute inset-0 bg-[#064E3B]/80 mix-blend-multiply"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent"></div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10">
                        {/* Avatar */}
                        <div className="relative group shrink-0 mt-2">
                            <div className="w-36 h-36 md:w-44 md:h-44 rounded-full border-[4px] border-white/20 bg-slate-800 overflow-hidden shadow-2xl relative transition-transform duration-500 group-hover:scale-[1.02]">
                                {isUploadingAvatar && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><Loader2 className="text-white animate-spin" /></div>}
                                <img src={profileData.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email}`} className="w-full h-full object-cover" alt="" />
                                <button onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white"><Camera size={28} /></button>
                            </div>
                            {profileData?.avatarUrl && (
                                <button onClick={() => setIsDeleteModalOpen(true)} className="absolute bottom-2 right-2 w-10 h-10 bg-rose-500 text-white rounded-full flex items-center justify-center hover:bg-rose-600 transition-all shadow-xl border-[3px] border-[#0F172A]">
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        {/* Info Header */}
                        <div className="flex-1 text-center md:text-left text-white mt-4">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-2">
                                <div>
                                    {isEditing ? (
                                        <input
                                            className="text-2xl md:text-4xl font-black text-white bg-white/10 border-b-2 border-teal-400 px-3 py-1 outline-none rounded-t-xl w-full"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        />
                                    ) : (
                                        <h1 className="text-3xl md:text-4xl font-black tracking-tight">{profileData.fullName}</h1>
                                    )}
                                    <p className="text-teal-300 font-bold text-sm mt-1">@{profileData.email?.split('@')[0]}</p>
                                </div>

                                <div className="flex gap-3 justify-center md:justify-end">
                                    <button
                                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                        className="px-6 py-2.5 bg-transparent border border-white/30 rounded-full font-bold text-[10px] text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : isEditing ? 'Guardar Cambios' : 'Editar Perfil'}
                                    </button>
                                    <button onClick={handleShare} className="p-2.5 bg-transparent border border-white/30 rounded-full hover:bg-white/10 text-white transition-all relative">
                                        {showShareTooltip ? <Check size={16} className="text-teal-400" /> : <Share2 size={16} />}
                                    </button>
                                </div>
                            </div>

                            {/* BIOGRAFÍA CABECERA EDITABLE */}
                            <div className="mb-6 mt-4 min-h-[40px]">
                                {isEditing ? (
                                    <textarea
                                        className="w-full max-w-xl bg-white/10 border border-white/20 p-3 rounded-xl text-white text-sm outline-none resize-none focus:border-teal-400"
                                        rows={2}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Tu biografía..."
                                    />
                                ) : (
                                    <p className="text-white/80 text-sm font-medium tracking-tight max-w-2xl leading-relaxed">
                                        {profileData.bio || "Apasionado de los libros, el café y las buenas historias."}
                                    </p>
                                )}
                            </div>

                            <div className="flex flex-wrap justify-center md:justify-start gap-6 text-white/70 text-[10px] font-bold">
                                <div className="flex items-center gap-2"><Calendar size={14} /> Miembro desde {joinDate}</div>
                            </div>
                        </div>
                    </div>

                    {/* Stats Banner con Barras Separadoras */}
                    <div className="mt-10 pt-8 border-t border-white/20 flex flex-wrap justify-center md:justify-start items-center gap-6 md:gap-10 relative z-10">
                        <StatGroup label="Reseñas" value={stats.reviews.length} />
                        <div className="w-px h-10 bg-white/20 hidden md:block"></div>
                        <StatGroup label="Libros" value={books.length} />
                        <div className="w-px h-10 bg-white/20 hidden md:block"></div>
                        <StatGroup label="Seguidores" value={profileData.followerRelations?.length || 0} onClick={() => { setActiveTab('followers'); setIsFollowModalOpen(true); }} clickable />
                        <div className="w-px h-10 bg-white/20 hidden md:block"></div>
                        <StatGroup label="Siguiendo" value={profileData.followingRelations?.length || 0} onClick={() => { setActiveTab('following'); setIsFollowModalOpen(true); }} clickable />
                    </div>
                </div>

                {/* --- TABS NAVEGACIÓN --- */}
                <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                    {['Actividad', 'Clubes', 'Eventos'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveProfileTab(tab)}
                            className={`pb-4 px-2 text-sm font-bold transition-all relative whitespace-nowrap ${activeProfileTab === tab ? 'text-teal-600' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            {tab}
                            {activeProfileTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-teal-600 rounded-t-md" />}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* IZQUIERDA: CONTENIDO PRINCIPAL */}
                    <div className="lg:col-span-8 space-y-8">
                        {activeProfileTab === 'Actividad' && (
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Actividad Reciente</h2>
                                    <div className="flex items-center gap-2 bg-teal-50 px-4 py-1.5 rounded-full text-teal-600 font-bold text-[9px] uppercase tracking-widest border border-teal-100/50">
                                        <Sparkles size={12} fill="currentColor" /> {stats.read.length} leídos este año
                                    </div>
                                </div>

                                <div className="h-[220px] mb-12"><BooksGrowthChart data={growthData} color="#0D9488" /></div>

                                <div className="space-y-4">
                                    {stats.reviews.slice(0, 3).map((book, i) => (
                                        <ActivityItem key={i} book={book} />
                                    ))}
                                    {stats.reviews.length === 0 && (
                                        <div className="text-center py-12">
                                            <BookOpen className="mx-auto text-slate-200 mb-4" size={48} />
                                            <p className="text-slate-400 font-medium">Aún no has escrito ninguna reseña.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeProfileTab === 'Clubes' && (
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Mis Clubes</h2>
                                    <div className="flex items-center gap-2 bg-teal-50 px-4 py-1.5 rounded-full text-teal-600 font-bold text-[9px] uppercase tracking-widest border border-teal-100/50">
                                        <Sparkles size={12} fill="currentColor" /> {profileData.clubs?.length || 0} clubes
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {profileData.clubs && profileData.clubs.length > 0 ? profileData.clubs.map((club: any, i: number) => (
                                        <div key={i} className="p-6 bg-slate-50/40 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl group cursor-pointer" onClick={() => navigate(`/clubs/${club.id}`)}>
                                            <div className="flex gap-5 items-start">
                                                <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center text-slate-200 font-black text-[9px] uppercase relative shadow-sm">
                                                    {club.coverUrl ? (
                                                        <img src={club.coverUrl} className="w-full h-full object-cover" alt={club.name} />
                                                    ) : (
                                                        <span className="text-2xl">{club.name?.charAt(0)}</span>
                                                    )}
                                                </div>
                                                <div className="flex-1 mt-1">
                                                    <p className="text-sm font-black text-slate-800 uppercase mb-1">{club.name}</p>
                                                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{club.description || "Sin descripción"}</p>
                                                    <div className="flex items-center gap-2 mt-3">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase">{club.members?.length || 0} miembros</span>
                                                        {club.creator?.id === user?.id && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[8px] font-bold uppercase rounded-full">Creador</span>}
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-slate-300 group-hover:text-teal-600 transition-colors" size={20} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12">
                                            <Award className="mx-auto text-slate-200 mb-4" size={48} />
                                            <p className="text-slate-400 font-medium">No te has unido a ningún club.</p>
                                            <button onClick={() => navigate('/clubs')} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-full font-bold text-xs hover:bg-teal-700 transition-colors">
                                                Descubrir Clubes
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeProfileTab === 'Eventos' && (
                            <div className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-slate-100">
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-xl font-black text-slate-900 uppercase italic tracking-tighter">Mis Eventos</h2>
                                    <div className="flex items-center gap-2 bg-teal-50 px-4 py-1.5 rounded-full text-teal-600 font-bold text-[9px] uppercase tracking-widest border border-teal-100/50">
                                        <Sparkles size={12} fill="currentColor" /> {profileData.events?.length || 0} eventos
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {profileData.events && profileData.events.length > 0 ? profileData.events.map((event: any, i: number) => (
                                        <div key={i} className="p-6 bg-slate-50/40 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl group">
                                            <div className="flex gap-5 items-start">
                                                <div className="w-16 h-16 bg-teal-50 rounded-2xl overflow-hidden shrink-0 border border-teal-100 flex items-center justify-center text-teal-600">
                                                    <Calendar size={28} />
                                                </div>
                                                <div className="flex-1 mt-1">
                                                    <p className="text-sm font-black text-slate-800 uppercase mb-1">{event.title}</p>
                                                    <p className="text-[12px] text-slate-500 font-medium leading-relaxed">{event.description || "Sin descripción"}</p>
                                                    <div className="flex items-center gap-4 mt-3">
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                            <Calendar size={12} /> {event.eventDate ? new Date(event.eventDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' }) : 'Fecha pendiente'}
                                                        </span>
                                                        <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                            <MapPin size={12} /> {event.organizer?.libraryName || 'Librería local'}
                                                        </span>
                                                    </div>
                                                </div>
                                                <ChevronRight className="text-slate-300 group-hover:text-teal-600 transition-colors" size={20} />
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-12">
                                            <Calendar className="mx-auto text-slate-200 mb-4" size={48} />
                                            <p className="text-slate-400 font-medium">No te has apuntado a ningún evento.</p>
                                            <button onClick={() => navigate('/events')} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-full font-bold text-xs hover:bg-teal-700 transition-colors">
                                                Descubrir Eventos
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* SIDEBAR */}
                    <div className="lg:col-span-4 space-y-6">

                        {/* Sobre mí */}
                        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
                            <h3 className="text-sm font-black text-slate-900 mb-6">Sobre mí</h3>
                            <div className="text-sm text-slate-500 font-medium leading-relaxed mb-8 min-h-[40px]">
                                {isEditing ? (
                                    <textarea
                                        className="w-full bg-slate-50 border border-slate-100 p-3 rounded-xl text-slate-700 outline-none resize-none focus:border-teal-500 transition-all"
                                        rows={4}
                                        value={formData.bio}
                                        onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                        placeholder="Cuéntanos sobre ti..."
                                    />
                                ) : (
                                    <p>"{profileData.bio || "Me encanta la novela histórica, la fantasía y la poesía."}"</p>
                                )}
                            </div>

                            <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-4">Géneros en mi biblioteca</h3>
                            <div className="flex flex-wrap gap-2.5">
                                {Array.from(new Set(books.map(b => b.genre).filter(Boolean))).slice(0, 5).map((g, i) => (
                                    <span key={i} className="px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-bold text-amber-700 shadow-sm">{g}</span>
                                ))}
                                {Array.from(new Set(books.map(b => b.genre).filter(Boolean))).length === 0 && <span className="text-xs text-slate-300 italic">No hay géneros definidos</span>}
                            </div>
                        </div>

                        {/* Rango */}
                        <div className="bg-[#0F172A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl mt-6">
                            <Award className="text-teal-300 mb-4" size={24} />
                            <h4 className="font-black text-lg uppercase tracking-tight leading-none mb-4">Rango Lector</h4>
                            <div className="text-4xl mb-4">{getRank(stats.totalPages).icon}</div>
                            <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">{stats.totalPages.toLocaleString()} páginas devoradas</p>
                            <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12" />
                        </div>
                    </div>
                </div>
            </div>

            {/* MODALES */}
            <FollowModal isOpen={isFollowModalOpen} onClose={() => setIsFollowModalOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab} data={profileData} onStartChat={handleStartChat} />
            <ConfirmDeleteAvatarModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAvatar} />
        </div>
    );
};


const StatGroup = ({ label, value, onClick, clickable }: any) => (
    <div className={`text-center md:text-left transition-all ${clickable ? 'cursor-pointer hover:opacity-70 active:scale-95' : ''}`} onClick={onClick}>
        <div className="text-3xl font-black text-white leading-none mb-1">{value}</div>
        <div className="text-[10px] font-medium text-white/70">{label}</div>
    </div>
);

const ActivityItem = ({ book }: { book: Book }) => (
    <div className="p-8 bg-slate-50/40 rounded-[2.5rem] border border-slate-100 transition-all duration-300 hover:bg-white hover:shadow-xl group">
        <div className="flex gap-6 items-start">
            <div className="w-20 h-28 bg-white rounded-2xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center text-slate-200 font-black uppercase text-[10px] tracking-widest relative shadow-sm group-hover:-rotate-2 transition-transform">
                <span className="absolute z-0">Book</span>
                {book.urlPortada && <img src={book.urlPortada} className="w-full h-full object-cover relative z-10" alt="" />}
            </div>
            <div className="flex-1 pt-1">
                <p className="text-[11px] text-slate-400 font-black mb-1 uppercase tracking-widest">Has reseñado <span className="text-teal-600 italic">"{book.title}"</span></p>
                <div className="flex items-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                        <Star key={i} size={14} className={`${i < (book.rating || 0) ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
                    ))}
                </div>
                <p className="text-[14px] text-slate-600 font-medium leading-relaxed italic">"{book.review}"</p>
            </div>
        </div>
    </div>
);