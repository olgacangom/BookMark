import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Lock, Unlock, Camera, Loader2, User as UserIcon,
    MessageCircle, Trash2, AlertTriangle, BarChart3, Trophy, 
    Sparkles, BookCheck, BookOpen, Bookmark, Award
} from 'lucide-react';
import api from '../../services/api';
import { bookService, Book } from '../../books/services/book.service';
import { BooksGrowthChart } from '../../components/stats/BooksGrowthChart';

// --- COMPONENTES AUXILIARES DE ESTADÍSTICAS ---
const StatCard = ({ label, value, icon, color }: any) => (
    <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-6 border border-white hover:shadow-lg transition-all shadow-sm">
        <div className={`w-10 h-10 bg-gradient-to-br ${color} rounded-xl mb-4 flex items-center justify-center shadow-lg`}>
            {icon}
        </div>
        <div className="text-2xl font-black text-slate-900 mb-0.5">{value}</div>
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{label}</div>
    </div>
);

// --- MODALES (CONFIRMACIÓN Y SEGUIDORES) ---
const ConfirmDeleteAvatarModal = ({ isOpen, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={onClose}></div>
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 border border-slate-100 text-center text-left">
                <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500"><AlertTriangle size={32} /></div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">¿Eliminar foto?</h3>
                <p className="text-slate-500 text-xs mb-8 leading-relaxed font-medium">Tu foto de perfil será eliminada y volverás a tener un avatar predeterminado.</p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-rose-600 transition-all uppercase text-[10px] tracking-widest">Eliminar</button>
                </div>
            </div>
        </div>
    );
};

const FollowModal = ({ isOpen, onClose, activeTab, setActiveTab, data, onStartChat }: any) => {
    if (!isOpen) return null;
    const list = activeTab === 'followers' ? data?.followerRelations?.map((f: any) => f.follower) || [] : data?.followingRelations?.map((f: any) => f.following) || [];
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            <div className="bg-white rounded-[2rem] md:rounded-[3rem] w-full max-w-md max-h-[80vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden border-4 md:border-8 border-white text-left">
                <div className="flex border-b border-slate-50">
                    <button onClick={() => setActiveTab('followers')} className={`flex-1 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'followers' ? 'text-teal-600 bg-teal-50/50' : 'text-slate-400 hover:text-slate-600'}`}>Seguidores ({data?.followerRelations?.length || 0})</button>
                    <button onClick={() => setActiveTab('following')} className={`flex-1 py-4 md:py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'following' ? 'text-teal-600 bg-teal-50/50' : 'text-slate-400 hover:text-slate-600'}`}>Siguiendo ({data?.followingRelations?.length || 0})</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-white">
                    {list.length > 0 ? list.map((u: any) => (
                        <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                    <img src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} className="w-full h-full object-cover" alt={u.fullName} />
                                </div>
                                <div className="text-left"><p className="text-sm font-bold text-slate-800 leading-none mb-1">{u.fullName}</p><p className="text-[10px] text-slate-400 font-medium">@{u.email.split('@')[0]}</p></div>
                            </div>
                            <button onClick={() => onStartChat(u.id)} className="p-2.5 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"><MessageCircle size={16} /></button>
                        </div>
                    )) : (
                        <div className="py-20 text-center"><UserIcon className="mx-auto text-slate-200 mb-4" size={40} /><p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">Lista vacía</p></div>
                    )}
                </div>
                <button onClick={onClose} className="p-4 text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest border-t border-slate-50 bg-slate-50/30">Cerrar</button>
            </div>
        </div>
    );
};

// --- COMPONENTE PRINCIPAL ---
export const MyProfileView = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);

    // Estados de datos
    const [profileData, setProfileData] = useState<any>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [growthData, setGrowthData] = useState([]);

    const [formData, setFormData] = useState({ name: '', bio: '', isPublic: true, libraryName: '', libraryAddress: '' });
    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

    const fetchAllData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setIsLoadingProfile(true);
            const [profileRes, booksRes, statsRes] = await Promise.all([
                api.get(`/users/profile/${user.id}`),
                bookService.getMyBooks(),
                api.get('/users/stats/growth')
            ]);

            setProfileData(profileRes.data);
            setBooks(booksRes);
            setGrowthData(statsRes.data);

            setFormData({
                name: profileRes.data.fullName || '',
                bio: profileRes.data.bio || '',
                isPublic: profileRes.data.isPublic ?? true,
                libraryName: profileRes.data.libraryName || '',
                libraryAddress: profileRes.data.libraryAddress || ''
            });
        } catch (error) {
            console.error("Error cargando datos", error);
        } finally {
            setIsLoadingProfile(false);
        }
    }, [user?.id]);

    useEffect(() => { fetchAllData(); }, [fetchAllData]);

    // Lógica de cálculo de estadísticas
    const booksRead = books.filter(b => b.status === "Read");
    const currentlyReading = books.filter(b => b.status === "Reading");
    const wantToRead = books.filter(b => b.status === "Want to Read");
    const totalPages = booksRead.reduce((acc, b) => acc + (Number(b.pageCount) || 0), 0);
    const formattedPages = totalPages >= 1000 ? `${(totalPages / 1000).toFixed(1)}k` : totalPages;
    const challengePercent = Math.min(Math.round((booksRead.length / 50) * 100), 100);


    const fetchFreshUserData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setIsLoadingProfile(true);
            const { data } = await api.get(`/users/profile/${user.id}`);
            setProfileData(data);
            setFormData({
                name: data.fullName || '',
                bio: data.bio || '',
                isPublic: data.isPublic ?? true,
                libraryName: data.libraryName || '',
                libraryAddress: data.libraryAddress || ''
            });
        } catch {
            console.error("Error cargando perfil");
        } finally {
            setIsLoadingProfile(false);
        }
    }, [user?.id]);

    useEffect(() => {
        fetchFreshUserData();
    }, [fetchFreshUserData]);

    
    const handleStartChat = async (targetUserId: string) => {
        try {
            const { data } = await api.post(`/chat/conversation/${targetUserId}`);
            if (data) {
                setIsFollowModalOpen(false);
                navigate('/chat');
            }
        } catch {
            alert("Para chatear debéis seguiros mutuamente.");
        }
    };
    
    // Handlers
    const handleAvatarClick = () => fileInputRef.current?.click();
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        setIsUploadingAvatar(true);
        try {
            const { data } = await api.post('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
            updateUser(data);
            fetchAllData();
        } catch { console.error("Error avatar"); } finally { setIsUploadingAvatar(false); }
    };

    const handleDeleteAvatarConfirm = async () => {
        setIsDeleteModalOpen(false);
        setIsUploadingAvatar(true);
        try {
            const { data } = await api.delete('/users/avatar');
            updateUser(data);
            fetchFreshUserData();
        } catch { console.error("Error al borrar avatar"); } finally { setIsUploadingAvatar(false); }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const payload: any = { fullName: formData.name, bio: formData.bio, isPublic: formData.isPublic };
            if (user.role === 'librero') { payload.libraryName = formData.libraryName; payload.libraryAddress = formData.libraryAddress; }
            const { data } = await api.patch('/users/profile', payload);
            updateUser(data);
            setIsEditing(false);
            fetchAllData();
        } catch (e) { console.error(e); } finally { setIsSaving(false); }
    };

    const togglePrivacy = async () => {
        const newStatus = !formData.isPublic;
        setFormData(prev => ({ ...prev, isPublic: newStatus }));
        try {
            const { data } = await api.patch('/users/profile', { isPublic: newStatus });
            updateUser(data);
        } catch { setFormData(prev => ({ ...prev, isPublic: !newStatus })); }
    };

    if (!user || isLoadingProfile) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="text-teal-600 animate-spin" size={40} /></div>;

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-24 text-left">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            {/* HEADER PERFIL */}
            <div className="relative mb-6 md:mb-12">
                <div className="h-32 md:h-64 bg-gradient-to-br from-slate-700 via-teal-600 to-emerald-600 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-16 md:-mt-44 flex flex-col md:flex-row items-center md:items-end gap-6 md:gap-8 z-10">
                        {/* AVATAR */}
                        <div className="relative group shrink-0">
                            <div className="w-32 h-32 md:w-56 md:h-56 rounded-[2rem] md:rounded-[2.5rem] border-[6px] md:border-[10px] border-white bg-white shadow-2xl overflow-hidden relative">
                                {isUploadingAvatar && <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><Loader2 className="text-white animate-spin" /></div>}
                                <img src={profileData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} className="w-full h-full object-cover" alt="Avatar" />
                            </div>
                            <div className="absolute -bottom-2 right-2 flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-100 gap-1">
                                <button onClick={handleAvatarClick} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"><Camera size={18} /></button>
                                {profileData?.avatarUrl && <button onClick={() => setIsDeleteModalOpen(true)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"><Trash2 size={18} /></button>}
                            </div>
                        </div>

                        {/* INFO BÁSICA */}
                        <div className="flex-1 w-full">
                            <div className="bg-white/90 backdrop-blur-xl rounded-[2rem] md:rounded-[3rem] p-6 md:p-10 border border-white shadow-xl">
                                <div className="flex flex-col md:flex-row justify-between items-center md:items-start gap-6 mb-6 md:mb-8 text-left">
                                    <div className="min-w-0 flex-1 text-left w-full">
                                        {isEditing ? (
                                            <input className="text-lg md:text-2xl font-black text-slate-900 bg-slate-50 border-b-2 border-teal-500 px-3 py-2 outline-none w-full rounded-lg" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
                                        ) : (
                                            <h1 className="text-xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">{profileData?.fullName}</h1>
                                        )}
                                        {user.role === 'user' && (
                                            <div className="flex items-center justify-start gap-6 mt-4 text-left">
                                                <button onClick={() => { setActiveTab('followers'); setIsFollowModalOpen(true); }} className="flex items-baseline gap-1.5 hover:opacity-60 transition-all">
                                                    <span className="text-xl font-black text-slate-900">{profileData?.followerRelations?.length || 0}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguidores</span>
                                                </button>
                                                <button onClick={() => { setActiveTab('following'); setIsFollowModalOpen(true); }} className="flex items-baseline gap-1.5 hover:opacity-60 transition-all">
                                                    <span className="text-xl font-black text-slate-900">{profileData?.followingRelations?.length || 0}</span>
                                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siguiendo</span>
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                    <button onClick={() => isEditing ? handleSave() : setIsEditing(true)} className="w-full md:w-auto px-8 py-4 md:py-3 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase hover:bg-teal-600 transition-all shadow-lg">{isSaving ? <Loader2 size={16} className="animate-spin" /> : isEditing ? 'Guardar' : 'Editar Perfil'}</button>
                                </div>
                                <div className="bg-slate-50/80 border border-slate-100 rounded-[1.5rem] p-5 shadow-inner text-left">
                                    <div className="pl-4 border-l-4 border-teal-500">
                                        {isEditing ? <textarea className="w-full bg-transparent border-none focus:ring-0 text-sm italic resize-none" rows={3} value={formData.bio} onChange={(e) => setFormData({ ...formData, bio: e.target.value })} /> : <p className="text-slate-600 text-sm italic font-medium leading-relaxed">"{profileData?.bio || 'Sin biografía todavía...'}"</p>}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
                {/* BLOQUE VISIBILIDAD */}
                {user.role === 'user' && (
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2rem] p-6 border border-white flex justify-between items-center shadow-lg">
                        <div className="flex items-center gap-4">
                            <div className={`p-4 rounded-2xl ${formData.isPublic ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>{formData.isPublic ? <Unlock size={28} /> : <Lock size={28} />}</div>
                            <div className="text-left"><h3 className="font-black text-slate-900 text-sm uppercase tracking-tight">Visibilidad</h3><p className="text-[10px] text-slate-500 font-medium">{formData.isPublic ? 'Tu perfil es visible para otros lectores' : 'Solo tú puedes ver tu perfil'}</p></div>
                        </div>
                        <button onClick={togglePrivacy} className={`w-16 h-9 rounded-full relative transition-all ${formData.isPublic ? 'bg-teal-500' : 'bg-slate-300'}`}><div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all shadow-md ${formData.isPublic ? 'left-8' : 'left-1'}`} /></button>
                    </div>
                )}

                {/* --- SECCIÓN DE ESTADÍSTICAS --- */}
                {user.role === 'user' && (
                    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
                        <div className="flex items-center gap-3 mb-8 px-2">
                            <BarChart3 className="text-teal-600" size={24} />
                            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter italic">Mi Actividad Literaria</h2>
                        </div>

                        {/* GRID CARDS */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                            <StatCard label="Leídos" value={booksRead.length} icon={<BookCheck className="text-white" size={20} />} color="from-slate-700 to-slate-800" />
                            <StatCard label="Páginas" value={formattedPages} icon={<Trophy className="text-white" size={20} />} color="from-sky-600 to-cyan-600" />
                            <StatCard label="Leyendo" value={currentlyReading.length} icon={<BookOpen className="text-white" size={20} />} color="from-teal-600 to-emerald-600" />
                            <StatCard label="Lista Deseos" value={wantToRead.length} icon={<Bookmark className="text-white" size={20} />} color="from-amber-500 to-orange-500" />
                        </div>

                        <div className="grid lg:grid-cols-12 gap-6">
                            {/* GRÁFICO */}
                            <div className="lg:col-span-8 bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-xl">
                                <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-8">Evolución de Lectura</h3>
                                <div className="h-[250px]">
                                    <BooksGrowthChart data={growthData} color="#0D9488" />
                                </div>
                            </div>

                            {/* RANGO Y META */}
                            <div className="lg:col-span-4 space-y-6">
                                <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                                    <Award className="text-teal-400 mb-4" size={24} />
                                    <h4 className="font-black text-lg uppercase tracking-tight leading-none mb-1">Rango</h4>
                                    <p className="text-teal-400 text-[10px] font-black uppercase tracking-widest mb-4">
                                        {totalPages > 5000 ? 'Erudito' : totalPages > 1000 ? 'Lector Voraz' : 'Iniciado'}
                                    </p>
                                    <div className="text-3xl mb-4">{totalPages > 5000 ? '🏅' : totalPages > 1000 ? '📖' : '👶'}</div>
                                    <p className="text-[10px] text-slate-400 font-bold uppercase">{totalPages} páginas devoradas</p>
                                    <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-teal-500/10 rotate-12" />
                                </div>

                                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-8 border border-white shadow-xl">
                                    <div className="flex justify-between items-end mb-4">
                                        <h4 className="text-xs font-black text-slate-900 uppercase">Meta {new Date().getFullYear()}</h4>
                                        <span className="text-sm font-black text-teal-600">{booksRead.length}/50</span>
                                    </div>
                                    <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden p-0.5 shadow-inner">
                                        <div className="h-full bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full transition-all duration-1000" style={{ width: `${challengePercent}%` }} />
                                    </div>
                                    <p className="text-[9px] text-slate-400 font-bold uppercase mt-4 text-center">Progreso anual al {challengePercent}%</p>
                                </div>
                            </div>
                        </div>
                    </section>
                )}
            </div>

            {/* MODALES EXISTENTES */}
            <FollowModal isOpen={isFollowModalOpen} onClose={() => setIsFollowModalOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab} data={profileData} onStartChat={handleStartChat} />
            <ConfirmDeleteAvatarModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAvatarConfirm} />
        </div>
    );
};