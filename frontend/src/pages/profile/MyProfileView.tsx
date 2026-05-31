import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
    Camera, Loader2, Sparkles, BookOpen, Award, MapPin, Calendar,
    Share2, ChevronRight, Star, Trash2, User as UserIcon,
    MessageCircle, Check, Settings, LogOut, UserMinus, Globe, Lock,
    Store
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
                    <Trash2 size={40} />
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

const PrivacyModal = ({ isOpen, onClose, onConfirm, isPublic, actionLoading }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={!actionLoading ? onClose : undefined}></div>
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 border border-slate-100 text-center">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ${isPublic ? 'bg-slate-100 text-slate-500' : 'bg-teal-50 text-teal-500'}`}>
                    {isPublic ? <Lock size={40} /> : <Globe size={40} />}
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
                    Hacer cuenta {isPublic ? 'Privada' : 'Pública'}
                </h3>
                <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
                    {isPublic
                        ? 'Si haces tu cuenta privada, solo los usuarios que te sigan podrán ver tus libros, reseñas y actividad.'
                        : 'Si haces tu cuenta pública, cualquier usuario podrá visitar tu perfil y ver tu biblioteca.'}
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={actionLoading}
                        className={`w-full py-4 text-white rounded-2xl font-black shadow-lg transition-all uppercase text-[10px] tracking-widest flex justify-center items-center gap-2 ${isPublic ? 'bg-slate-800 hover:bg-slate-900' : 'bg-teal-600 hover:bg-teal-700'}`}
                    >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Confirmar Cambio'}
                    </button>
                    <button onClick={onClose} disabled={actionLoading} className="w-full py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors uppercase text-[10px] tracking-widest">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const DeactivateAccountModal = ({ isOpen, onClose, onConfirm, actionLoading }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in" onClick={!actionLoading ? onClose : undefined}></div>
            <div className="bg-white rounded-[2.5rem] p-10 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 border border-slate-100 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                    <UserMinus size={40} />
                </div>
                <h3 className="text-xl font-black text-rose-600 mb-2 uppercase tracking-tight">Suspender Cuenta</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed font-medium">
                    ¿Estás segura de que quieres suspender tu cuenta? <br /><br />
                    Serás desconectada inmediatamente y <span className="font-bold text-slate-800">solo un Administrador</span> podrá reactivarla.
                </p>
                <div className="flex flex-col gap-3">
                    <button
                        onClick={onConfirm}
                        disabled={actionLoading}
                        className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg hover:bg-rose-700 transition-all uppercase text-[10px] tracking-widest flex justify-center items-center gap-2"
                    >
                        {actionLoading ? <Loader2 size={16} className="animate-spin" /> : 'Sí, suspender mi cuenta'}
                    </button>
                    <button onClick={onClose} disabled={actionLoading} className="w-full py-4 font-black text-slate-400 hover:bg-slate-50 rounded-2xl transition-colors uppercase text-[10px] tracking-widest">
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    );
};

const FollowModal = ({ isOpen, onClose, activeTab, setActiveTab, data, onStartChat }: any) => {
    if (!isOpen) return null;
    const list = activeTab === 'followers'
        ? data?.followerRelations?.map((f: any) => f.follower) || []
        : data?.followingRelations?.map((f: any) => f.following) || [];

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
                <div className="flex-1 overflow-y-auto p-6 space-y-3  custom-scrollbar">
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

                            {isReciprocal(u.id) ? (
                                <button onClick={() => onStartChat(u.id)} className="p-3 bg-teal-50 text-teal-600 rounded-2xl hover:bg-teal-600 hover:text-white transition-all shadow-sm" title="Enviar mensaje">
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
    const { user, updateUser, logout } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const [profileData, setProfileData] = useState<any>(null);
    const [books, setBooks] = useState<Book[]>([]);
    const [growthData, setGrowthData] = useState([]);

    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [showShareTooltip, setShowShareTooltip] = useState(false);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);

    const [formData, setFormData] = useState({ name: '', bio: '' });
    const [isPublic, setIsPublic] = useState<boolean>(true);

    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
    const [isDeactivateModalOpen, setIsDeactivateModalOpen] = useState(false);

    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');
    const [activeProfileTab, setActiveProfileTab] = useState('Actividad');
    const isLibrero = user?.role === 'librero';
    const isReader = user?.role === 'user';
    const [myStock, setMyStock] = useState<any[]>([]);
    const navigate = useNavigate();

    const canTogglePrivacy = isReader;

    const fetchInventory = useCallback(async () => {
        if (user?.role !== 'librero') return;

        try {
            const res = await api.get('/librero/inventory');
            setMyStock(res.data);
        } catch (error) {
            console.error("Error al cargar inventario", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.role]);

    const fetchAllData = useCallback(async () => {
        if (!user?.id) return;
        setIsLoading(true);

        try {
            const profileRes = await api.get(`/users/profile/${user.id}`);
            setProfileData(profileRes.data);

            setIsPublic(profileRes.data.isPublic);

            if (isReader || isLibrero) {
                bookService.getMyBooks().then(setBooks).catch(() => { });
            }

            if (isReader) {
                api.get('/users/stats/growth').then(res => setGrowthData(res.data)).catch(() => { });
            }

            setFormData({ name: profileRes.data.fullName || '', bio: profileRes.data.bio || '' });
        } catch (error) {
            console.error("Error cargando perfil", error);
        } finally {
            setIsLoading(false);
        }
    }, [user?.id, isReader, isLibrero]);

    useEffect(() => {
        fetchAllData();

        if (isLibrero) {
            fetchInventory();
        }
    }, [fetchAllData, fetchInventory, isLibrero]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
                await navigator.share({ title: `Perfil de ${profileData.fullName} en BookMark`, text: `Echa un vistazo a mi biblioteca.`, url: window.location.href });
            } catch (error) {
                console.error(error)
            }
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

    const confirmTogglePrivacy = async () => {
        const newState = !isPublic;
        setActionLoading(true);
        try {
            await api.patch('/users/profile', { isPublic: newState });
            setIsPublic(newState);
            setIsPrivacyModalOpen(false);
        } catch (error) {
            console.error("Error al actualizar privacidad:", error);
            alert("Hubo un error. Comprueba tu conexión.");
        } finally {
            setActionLoading(false);
        }
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

    // DESACTIVAR CUENTA 
    const confirmDeactivateAccount = async () => {
        setActionLoading(true);
        try {
            await api.patch(`/users/deactivate-me`);
            logout();
            navigate('/');
        } catch (error) {
            console.error("Error desactivando la cuenta:", error);
            alert("Hubo un error. Asegúrate de que tu backend tenga el endpoint de desactivación.");
        } finally {
            setActionLoading(false);
            setIsDeactivateModalOpen(false);
        }
    };

    if (isLoading || !profileData) return <div className="min-h-screen flex items-center justify-center bg-[#F8FAFB]"><Loader2 className="text-teal-600 animate-spin" size={40} /></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-24 text-left">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleAvatarUpload} />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

                <div
                    className="rounded-[2.5rem] shadow-2xl mb-8 p-8 md:p-12 relative overflow-visible bg-cover bg-center"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?q=80&w=2074&auto=format&fit=crop')` }}
                >
                    <div className="absolute inset-0 bg-[#064E3B]/80 mix-blend-multiply rounded-[2.5rem]"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0F172A]/90 via-[#0F172A]/40 to-transparent rounded-[2.5rem]"></div>

                    <div className="flex flex-col md:flex-row items-center md:items-start gap-8 relative z-10 mt-8 md:mt-0">
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
                        <div className="flex-1 text-center md:text-left text-white mt-4 w-full">
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

                                    {profileData.province && (
                                        <div className="flex items-center justify-center md:justify-start gap-1.5 mt-2 text-white/70 text-[11px] font-bold uppercase tracking-wider">
                                            <MapPin size={12} />
                                            <span>{profileData.province}</span>
                                        </div>
                                    )}
                                </div>

                                {/* RUEDA DE AJUSTES */}
                                <div className="flex gap-3 justify-center md:justify-end items-center" ref={dropdownRef}>
                                    <button
                                        onClick={() => isEditing ? handleSaveProfile() : setIsEditing(true)}
                                        className="px-6 py-2.5 bg-transparent border border-white/30 rounded-full font-bold text-[10px] text-white hover:bg-white/10 transition-all flex items-center gap-2"
                                    >
                                        {isSaving ? <Loader2 size={14} className="animate-spin" /> : isEditing ? 'Guardar Cambios' : 'Editar Perfil'}
                                    </button>

                                    <button onClick={handleShare} className="p-2.5 bg-transparent border border-white/30 rounded-full hover:bg-white/10 text-white transition-all relative">
                                        {showShareTooltip ? <Check size={16} className="text-teal-400" /> : <Share2 size={16} />}
                                    </button>

                                    <div className="relative">
                                        <button
                                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                            className={`p-2.5 bg-transparent border rounded-full transition-all flex items-center justify-center relative group ${isDropdownOpen ? 'bg-white text-slate-900 border-white' : 'border-white/30 text-white hover:bg-white/10'}`}
                                            title={isReader ? (isPublic ? 'Cuenta Pública' : 'Cuenta Privada') : 'Cuenta'}
                                        >
                                            <Settings size={16} className={isPublic && isReader ? 'group-hover:rotate-90 transition-transform duration-500' : ''} />
                                            {/* Indicador de privacidad */}
                                            {isReader && (isPublic ? (
                                                <div className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full border border-slate-900"></div>
                                            ) : (
                                                <div className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-rose-500 rounded-full border-[1.5px] border-slate-900 flex items-center justify-center">
                                                    <Lock size={8} className="text-white" />
                                                </div>
                                            ))}
                                        </button>

                                        {/* Dropdown Menu */}


                                        {isDropdownOpen && (
                                            <div className="absolute right-0 top-[120%] w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden animate-in fade-in slide-in-from-top-2 z-50">
                                                <div className="py-2">
                                                    {canTogglePrivacy && (
                                                        <>
                                                            <button
                                                                className="w-full px-4 py-3 hover:bg-slate-50 flex items-center justify-between transition-colors cursor-pointer group"
                                                                onClick={() => {
                                                                    setIsDropdownOpen(false);
                                                                    setIsPrivacyModalOpen(true);
                                                                }}
                                                            >
                                                                <div className="flex items-center gap-3">
                                                                    {isPublic ? (
                                                                        <Globe size={18} className="text-teal-500" />
                                                                    ) : (
                                                                        <Lock size={18} className="text-slate-400" />
                                                                    )}
                                                                    <div className="flex flex-col text-left">
                                                                        <span className="font-bold text-sm text-slate-700">Privacidad</span>
                                                                        <span className="text-[10px] text-slate-400">
                                                                            {isPublic ? 'Pública (Haz clic para cambiar)' : 'Privada (Haz clic para cambiar)'}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </button>

                                                            <div className="h-px bg-slate-100 my-1 mx-4"></div>
                                                        </>
                                                    )}

                                                    <button
                                                        className="w-full text-left px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 flex items-center gap-3 transition-colors"
                                                        onClick={() => {
                                                            setIsDropdownOpen(false);
                                                            logout();
                                                            navigate('/');
                                                        }}
                                                    >
                                                        <LogOut size={18} className="text-slate-400" />
                                                        <span className="font-bold">Cerrar sesión</span>
                                                    </button>

                                                    <div className="h-px bg-slate-100 my-1 mx-4"></div>

                                                    {user?.role !== 'admin' && (
                                                        <button
                                                            className="w-full text-left px-4 py-3 text-sm text-rose-600 hover:bg-rose-50 flex items-center gap-3 transition-colors"
                                                            onClick={() => {
                                                                setIsDropdownOpen(false);
                                                                setIsDeactivateModalOpen(true);
                                                            }}
                                                        >
                                                            <UserMinus size={18} className="text-rose-500" />
                                                            <span className="font-bold">Desactivar cuenta</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

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

                    {isReader && (
                        <div className="mt-10 pt-8 border-t border-white/20 flex flex-wrap justify-center md:justify-start items-center gap-6 md:gap-10 relative z-10">
                            <StatGroup label="Reseñas" value={stats.reviews.length} />
                            <div className="w-px h-10 bg-white/20 hidden md:block"></div>
                            <StatGroup label="Libros" value={books.length} />
                            <div className="w-px h-10 bg-white/20 hidden md:block"></div>
                            <StatGroup label="Seguidores" value={profileData.followerRelations?.length || 0} onClick={() => { setActiveTab('followers'); setIsFollowModalOpen(true); }} clickable />
                            <div className="w-px h-10 bg-white/20 hidden md:block"></div>
                            <StatGroup label="Siguiendo" value={profileData.followingRelations?.length || 0} onClick={() => { setActiveTab('following'); setIsFollowModalOpen(true); }} clickable />
                        </div>
                    )}
                </div>

                {isReader && (
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
                )}

                <div className="grid lg:grid-cols-12 gap-8 items-start">

                    {/* IZQUIERDA: CONTENIDO PRINCIPAL */}
                    {isReader && (
                        <div className="lg:col-span-8 space-y-8 min-w-0">
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
                                                            <img
                                                                src={club.coverUrl}
                                                                className="w-full h-full object-cover"
                                                                alt={club.name} />
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
                                            <Sparkles size={12} fill="currentColor" /> {profileData.attendedEvents?.length || 0} eventos
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        {profileData.attendedEvents && profileData.attendedEvents.length > 0 ? profileData.attendedEvents.map((event: any, i: number) => {

                                            const hasValidImage = event.imageUrl && event.imageUrl.trim().length > 0;

                                            const eventImage = hasValidImage
                                                ? event.imageUrl
                                                : `https://picsum.photos/seed/${event.id}/600/400`;

                                            return (
                                                <div
                                                    key={i}
                                                    onClick={() => navigate('/events', { state: { initialTab: 'mine' } })}
                                                    className="p-6 bg-slate-50/40 rounded-[2rem] border border-slate-100 transition-all hover:bg-white hover:shadow-xl group cursor-pointer"
                                                >
                                                    <div className="flex gap-5 items-start">

                                                        <div className="w-16 h-16 bg-white rounded-2xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center text-slate-200 font-black text-[9px] uppercase relative shadow-sm">
                                                            <img
                                                                src={eventImage}
                                                                className="w-full h-full object-cover"
                                                                alt="event"
                                                                onError={(e: any) => {
                                                                    e.target.src = `https://picsum.photos/seed/${event.id}/600/400`;
                                                                }}
                                                            />
                                                        </div>

                                                        <div className="flex-1 mt-1">
                                                            <p className="text-sm font-black text-slate-800 uppercase mb-1">
                                                                {event.title}
                                                            </p>

                                                            <div className="flex items-center gap-4 mt-3">
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                                    <Calendar size={12} />
                                                                    {event.eventDate
                                                                        ? new Date(event.eventDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })
                                                                        : 'Fecha pendiente'}
                                                                </span>
                                                                <span className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1">
                                                                    <MapPin size={12} className='text-rose-500 shrink-0' />
                                                                    {event.organizer?.libraryAddress}, {event.organizer?.province}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <ChevronRight className="text-slate-300 group-hover:text-teal-600 transition-colors" size={20} />
                                                    </div>
                                                </div>
                                            );
                                        }) : (
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
                    )}

                    {/* SIDEBAR LECTOR */}
                    {isReader && (
                        <div className="space-y-6 lg:col-span-4 min-w-0">
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

                                <h3 className="text-[10px] font-bold text-slate-400 uppercase mb-4">
                                    Géneros en mi biblioteca
                                </h3>

                                <div className="flex flex-wrap gap-2.5">
                                    {Array.from(new Set(books.map(b => b.genre).filter(Boolean)))
                                        .slice(0, 5)
                                        .map((g, i) => (
                                            <span
                                                key={i}
                                                className="px-4 py-1.5 bg-amber-50 border border-amber-200 rounded-xl text-[10px] font-bold text-amber-700 shadow-sm"
                                            >
                                                {g as React.ReactNode}
                                            </span>
                                        ))}

                                    {Array.from(new Set(books.map(b => b.genre).filter(Boolean))).length === 0 && (
                                        <span className="text-xs text-slate-300 italic">
                                            No hay géneros definidos
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="bg-[#0F172A] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-xl mt-6">
                                <Award className="text-teal-300 mb-4" size={24} />

                                <h4 className="font-black text-lg uppercase tracking-tight leading-none mb-4">
                                    Rango Lector
                                </h4>

                                <div className="text-4xl mb-4">
                                    {getRank(stats.totalPages).icon}
                                </div>

                                <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest">
                                    {stats.totalPages.toLocaleString()} páginas devoradas
                                </p>

                                <Sparkles className="absolute -right-4 -top-4 w-24 h-24 text-white/5 rotate-12" />
                            </div>
                        </div>
                    )}
                </div>
                {user?.role === 'librero' && profileData && (
                    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8">
                        <LibreroStatsCard
                            profileData={{
                                ...profileData,
                                books: myStock,
                                events: profileData.organizedEvents
                            }}
                            navigate={navigate}
                        />
                    </div>
                )}
            </div>

            {/* MODALES RECOPILADOS */}
            <FollowModal isOpen={isFollowModalOpen} onClose={() => setIsFollowModalOpen(false)} activeTab={activeTab} setActiveTab={setActiveTab} data={profileData} onStartChat={handleStartChat} />
            <ConfirmDeleteAvatarModal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} onConfirm={handleDeleteAvatar} />

            <PrivacyModal
                isOpen={isPrivacyModalOpen}
                onClose={() => setIsPrivacyModalOpen(false)}
                onConfirm={confirmTogglePrivacy}
                isPublic={isPublic}
                actionLoading={actionLoading}
            />

            <DeactivateAccountModal
                isOpen={isDeactivateModalOpen}
                onClose={() => setIsDeactivateModalOpen(false)}
                onConfirm={confirmDeactivateAccount}
                actionLoading={actionLoading}
            />
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

const LibreroStatsCard = ({ profileData, navigate }: { profileData: any, navigate: any }) => {
    const now = new Date();
    const upcomingEvents = profileData.organizedEvents?.filter((ev: any) => new Date(ev.eventDate) >= now) || [];
    const pastEvents = profileData.organizedEvents?.filter((ev: any) => new Date(ev.eventDate) < now) || [];

    return (
        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-[0_20px_50px_rgba(0,0,0,0.05)] relative overflow-hidden transition-all duration-300 hover:border-teal-300 hover:shadow-xl hover:shadow-teal-100/50">
            <div className="absolute top-0 right-0 w-80 h-80 bg-teal-50/50 rounded-full blur-[100px] -mr-20 -mt-20 pointer-events-none"></div>

            <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-slate-900 rounded-3xl flex items-center justify-center text-white shadow-xl shadow-slate-200">
                        <Store size={24} />
                    </div>
                    <div>
                        <h3 className="font-black text-slate-900 uppercase tracking-tight text-xl">Mi Librería</h3>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mt-0.5">
                            {profileData.libraryName || 'Gestión de Inventario'}
                        </p>
                    </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10">
                    {/* Card Ubicación */}
                    <div className="p-6 bg-slate-50 rounded-3xl border border-teal-200 flex items-center gap-4 transition-transform">
                        <div className="p-4 bg-white rounded-2xl text-teal-600 shadow-sm"><MapPin size={20} /></div>
                        <div className="min-w-0">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Ubicación</p>
                            <p className="font-bold text-slate-800 text-sm truncate">{profileData.libraryAddress || 'No especificada'}, {profileData.province}</p>
                        </div>
                    </div>

                    {/* Card Libros */}
                    <div
                        onClick={() => navigate('/librero/catalog')}
                        className="p-6 bg-slate-900 rounded-3xl flex items-center gap-4 shadow-xl text-white cursor-pointer hover:bg-slate-800 transition-all hover:scale-[1.02]"
                    >
                        <div className="p-4 bg-white/10 rounded-2xl text-teal-400"><BookOpen size={20} /></div>
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Libros registrados</p>
                            <p className="font-black text-2xl">{profileData.books?.length || 0}</p>
                        </div>
                    </div>
                </div>

                {/* Eventos */}
                <div className="grid md:grid-cols-2 gap-8">
                    {/* Próximos */}
                    <div>
                        <p className="text-[10px] font-black text-teal-600 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                            <Calendar size={12} /> Próximos: {upcomingEvents.length}
                        </p>
                        {upcomingEvents.length > 0 ? (
                            <div className="space-y-3">
                                {upcomingEvents.map((ev: any) => (
                                    <div key={ev.id} className="group p-4 bg-white border border-slate-100 rounded-2xl hover:border-teal-200 hover:shadow-md transition-all">
                                        <p className="font-black text-xs text-slate-800 mb-1 group-hover:text-teal-700">{ev.title}</p>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(ev.eventDate).toLocaleDateString()} · {new Date(ev.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-[9px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">{ev.registrations?.length || 0} inscritos</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs text-slate-400 italic">Sin eventos próximos.</p>}
                    </div>

                    {/* Pasados */}
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Eventos pasados</p>
                        {pastEvents.length > 0 ? (
                            <div className="space-y-2">
                                {pastEvents.map((ev: any) => (
                                    <div key={ev.id} className="p-3 bg-slate-50 rounded-xl border border-slate-100 opacity-60">
                                        <span className="font-bold text-[11px] text-slate-500 line-through">{ev.title}</span>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[9px] font-bold text-slate-400 uppercase">{new Date(ev.eventDate).toLocaleDateString()} · {new Date(ev.eventDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-[9px] font-black bg-teal-50 text-teal-700 px-2 py-0.5 rounded-lg">{ev.registrations?.length || 0} inscritos</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-xs text-slate-400 italic">Sin historial.</p>}
                    </div>
                </div>
            </div>
        </div>
    );
};