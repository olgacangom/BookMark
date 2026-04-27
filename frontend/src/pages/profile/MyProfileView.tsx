import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate } from 'react-router-dom'; 
import { 
    Lock, Unlock, Camera, Loader2, User as UserIcon, MessageCircle 
} from 'lucide-react';
import api from '../../services/api';

const FollowModal = ({ 
    isOpen, 
    onClose, 
    activeTab, 
    setActiveTab, 
    data,
    onStartChat 
}: { 
    isOpen: boolean; 
    onClose: () => void; 
    activeTab: 'followers' | 'following';
    setActiveTab: (tab: 'followers' | 'following') => void;
    data: any;
    onStartChat: (targetId: string) => void;
}) => {
    if (!isOpen) return null;

    const list = activeTab === 'followers' 
        ? data?.followerRelations?.map((f: any) => f.follower) || []
        : data?.followingRelations?.map((f: any) => f.following) || [];

    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={onClose}></div>
            
            <div className="bg-white rounded-[3rem] w-full max-w-md max-h-[70vh] flex flex-col shadow-2xl relative animate-in zoom-in-95 duration-300 overflow-hidden border-8 border-white">
                <div className="flex border-b border-slate-50">
                    <button 
                        onClick={() => setActiveTab('followers')}
                        className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'followers' ? 'text-teal-600 bg-teal-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Seguidores ({data?.followerRelations?.length || 0})
                    </button>
                    <button 
                        onClick={() => setActiveTab('following')}
                        className={`flex-1 py-5 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'following' ? 'text-teal-600 bg-teal-50/50' : 'text-slate-400 hover:text-slate-600'}`}
                    >
                        Siguiendo ({data?.followingRelations?.length || 0})
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-2 no-scrollbar bg-white">
                    {list.length > 0 ? (
                        list.map((u: any) => (
                            <div key={u.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-slate-50 transition-colors group">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-teal-100 border-2 border-white shadow-sm overflow-hidden flex-shrink-0">
                                        <img 
                                            src={u.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${u.email}`} 
                                            className="w-full h-full object-cover"
                                            alt={u.fullName}
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-sm font-bold text-slate-800 leading-none mb-1">{u.fullName}</p>
                                        <p className="text-[10px] text-slate-400 font-medium">@{u.email.split('@')[0]}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => onStartChat(u.id)}
                                    className="p-2.5 bg-teal-50 text-teal-600 rounded-xl hover:bg-teal-600 hover:text-white transition-all shadow-sm"
                                >
                                    <MessageCircle size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="py-20 text-center">
                            <UserIcon className="mx-auto text-slate-200 mb-4" size={40} />
                            <p className="text-slate-300 font-bold uppercase text-[10px] tracking-[0.2em]">Lista vacía</p>
                        </div>
                    )}
                </div>

                <button 
                    onClick={onClose}
                    className="p-4 text-xs font-black text-slate-400 hover:text-rose-500 transition-colors uppercase tracking-widest border-t border-slate-50 bg-slate-50/30"
                >
                    Cerrar
                </button>
            </div>
        </div>
    );
};

export const MyProfileView = () => {
    const { user, updateUser } = useAuth();
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
    const [isLoadingProfile, setIsLoadingProfile] = useState(true);
    
    const [profileData, setProfileData] = useState<any>(null);
    const [formData, setFormData] = useState({ name: '', bio: '', isPublic: true });

    const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
    const [activeTab, setActiveTab] = useState<'followers' | 'following'>('followers');

    const fetchFreshUserData = useCallback(async () => {
        if (!user?.id) return;
        try {
            setIsLoadingProfile(true);
            const { data } = await api.get(`/users/profile/${user.id}`);
            setProfileData(data);
            setFormData({
                name: data.fullName || '',
                bio: data.bio || '',
                isPublic: data.isPublic ?? true
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

    if (!user || isLoadingProfile) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="text-teal-600 animate-spin" size={40} />
            </div>
        );
    }

    const handleAvatarClick = () => fileInputRef.current?.click();
    
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const fd = new FormData();
        fd.append('file', file);
        setIsUploadingAvatar(true);
        try {
            const { data } = await api.post('/users/avatar', fd, { headers: { 'Content-Type': 'multipart/form-data' }});
            updateUser(data);
            fetchFreshUserData();
        } catch { 
            console.error("Error avatar"); 
        } finally { 
            setIsUploadingAvatar(false); 
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { data } = await api.patch('/users/profile', {
                fullName: formData.name,
                bio: formData.bio,
                isPublic: formData.isPublic
            });
            updateUser(data);
            setIsEditing(false);
            fetchFreshUserData();
        } catch { 
            console.error("Error save"); 
        } finally { 
            setIsSaving(false); 
        }
    };

    const togglePrivacy = async () => {
        const newStatus = !formData.isPublic;
        setFormData(prev => ({ ...prev, isPublic: newStatus }));
        try {
            const { data } = await api.patch('/users/profile', { isPublic: newStatus });
            updateUser(data);
        } catch { 
            setFormData(prev => ({ ...prev, isPublic: !newStatus })); 
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-24">
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />

            <div className="relative mb-12">
                <div className="h-48 md:h-64 bg-gradient-to-br from-slate-700 via-teal-600 to-emerald-600 relative overflow-hidden">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="relative -mt-32 md:-mt-44 flex flex-col md:flex-row items-center md:items-end gap-8 z-10">
                        <div className="relative group">
                            <div className="w-44 h-44 md:w-56 md:h-56 rounded-[2.5rem] border-[10px] border-white bg-white shadow-2xl overflow-hidden relative">
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10"><Loader2 className="text-white animate-spin" /></div>
                                )}
                                <img
                                    src={profileData?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            </div>
                            <div className="absolute -bottom-2 right-4 flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-100 gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={handleAvatarClick} className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"><Camera size={18} /></button>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-6 md:p-10 border border-white shadow-xl">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8 text-left">
                                    <div className="min-w-0 flex-1">
                                        {isEditing ? (
                                            <input
                                                className="text-xl md:text-2xl font-black text-slate-900 bg-slate-50 border-b-2 border-teal-500 px-3 py-1 outline-none w-full rounded-lg"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        ) : (
                                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase truncate">
                                                {profileData?.fullName || 'Lector'}
                                            </h1>
                                        )}
                                        
                                        <div className="flex items-center gap-6 mt-4">
                                            <button 
                                                onClick={() => { setActiveTab('followers'); setIsFollowModalOpen(true); }}
                                                className="flex items-baseline gap-1.5 hover:opacity-60 transition-all"
                                            >
                                                <span className="text-xl font-black text-slate-900">{profileData?.followerRelations?.length || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguidores</span>
                                            </button>
                                            <div className="w-1.5 h-1.5 bg-teal-500/20 rounded-full"></div>
                                            <button 
                                                onClick={() => { setActiveTab('following'); setIsFollowModalOpen(true); }}
                                                className="flex items-baseline gap-1.5 hover:opacity-60 transition-all"
                                            >
                                                <span className="text-xl font-black text-slate-900">{profileData?.followingRelations?.length || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siguiendo</span>
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                            disabled={isSaving}
                                            className="flex-1 md:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase hover:bg-teal-600 transition-all"
                                        >
                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : isEditing ? 'Guardar' : 'Editar Perfil'}
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="bg-slate-50/80 border border-slate-100 rounded-[2rem] p-5 shadow-inner">
                                    <div className="pl-4 text-left border-l-4 border-teal-500">
                                        {isEditing ? (
                                            <textarea
                                                className="w-full bg-transparent border-none focus:ring-0 text-sm italic resize-none"
                                                rows={3}
                                                value={formData.bio}
                                                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                            />
                                        ) : (
                                            <p className="text-slate-600 text-sm italic font-medium">
                                                "{profileData?.bio || 'Sin biografía todavía...'}"
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BLOQUE DE PRIVACIDAD (SOLO PARA ROL 'user') --- */}
            {user.role === 'user' && (
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 animate-in slide-in-from-bottom-4 duration-500">
                    <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white flex justify-between items-center shadow-xl">
                        <div className="flex items-center gap-5">
                            <div className={`p-4 rounded-[1.5rem] ${formData.isPublic ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                                {formData.isPublic ? <Unlock size={28} /> : <Lock size={28} />}
                            </div>
                            <div className="text-left">
                                <h3 className="font-black text-slate-900 text-lg uppercase">Visibilidad</h3>
                                <p className="text-xs text-slate-500 font-medium">{formData.isPublic ? 'Perfil público' : 'Perfil privado'}</p>
                            </div>
                        </div>
                        <button onClick={togglePrivacy} className={`w-16 h-9 rounded-full relative transition-all ${formData.isPublic ? 'bg-teal-500' : 'bg-slate-300'}`}>
                            <div className={`absolute top-1 w-7 h-7 bg-white rounded-full transition-all ${formData.isPublic ? 'left-8' : 'left-1'}`} />
                        </button>
                    </div>
                </div>
            )}

            <FollowModal 
                isOpen={isFollowModalOpen} 
                onClose={() => setIsFollowModalOpen(false)} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                data={profileData}
                onStartChat={handleStartChat} 
            />
        </div>
    );
};