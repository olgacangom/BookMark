import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { 
    Lock, Unlock, Camera, Save, Loader2, 
    Share2, Trash2, AlertCircle, Edit2
} from 'lucide-react';
import api from '../../services/api';

export const MyProfileView = () => {
    const { user, updateUser } = useAuth();
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [showShareMenu, setShowShareMenu] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false); 
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        bio: '',
        isPublic: true
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.fullName || '',
                bio: user.bio || '',
                isPublic: user.isPublic ?? true
            });
        }
    }, [user, isEditing]);

    if (!user) return null;

    const handleAvatarClick = () => fileInputRef.current?.click();

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formDataImage = new FormData();
        formDataImage.append('file', file);
        setIsUploadingAvatar(true);
        try {
            const { data } = await api.post('/users/avatar', formDataImage, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            updateUser(data);
        } catch { 
            console.error("Error al subir el avatar");
        } finally { setIsUploadingAvatar(false); }
    };

    const confirmDeleteAvatar = async () => {
        setIsUploadingAvatar(true);
        setShowDeleteModal(false);
        try {
            const { data } = await api.patch('/users/profile', { avatarUrl: null });
            updateUser(data);
        } catch { 
            console.error("Error al eliminar el avatar");
        } finally { setIsUploadingAvatar(false); }
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
        } catch { 
            console.error("Error al guardar el perfil");
        } finally { setIsSaving(false); }
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
                            <div className="w-44 h-44 md:w-56 md:h-56 rounded-[2.5rem] border-[10px] border-white bg-white shadow-2xl overflow-hidden relative transition-transform duration-500 hover:scale-[1.02]">
                                {isUploadingAvatar && (
                                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10 backdrop-blur-sm">
                                        <Loader2 className="text-white animate-spin" />
                                    </div>
                                )}
                                <img
                                    src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                                    className="w-full h-full object-cover"
                                    alt="Avatar"
                                />
                            </div>
                            
                            <div className="absolute -bottom-2 right-4 flex bg-white p-1.5 rounded-2xl shadow-xl border border-slate-100 gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                                {user.avatarUrl && (
                                    <button 
                                        onClick={() => setShowDeleteModal(true)}
                                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                )}
                                <button 
                                    onClick={handleAvatarClick}
                                    className="p-2 text-teal-600 hover:bg-teal-50 rounded-xl transition-colors"
                                >
                                    <Camera size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="flex-1 w-full">
                            <div className="bg-white/90 backdrop-blur-xl rounded-[3rem] p-6 md:p-10 border border-white shadow-xl">
                                <div className="flex flex-col md:flex-row justify-between items-start gap-6 mb-8">
                                    <div className="text-left">
                                        {isEditing ? (
                                            <input
                                                className="text-xl md:text-2xl font-black text-slate-900 bg-slate-50 border-b-2 border-teal-500 px-3 py-1 outline-none w-full rounded-lg"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                                autoFocus
                                            />
                                        ) : (
                                            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight leading-tight uppercase">
                                                {user.fullName || 'Lector Pro'}
                                            </h1>
                                        )}
                                        
                                        <div className="flex items-center gap-6 mt-4">
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-xl font-black text-slate-900">{user.followers?.length || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Seguidores</span>
                                            </div>
                                            <div className="w-1.5 h-1.5 bg-teal-500/20 rounded-full"></div>
                                            <div className="flex items-baseline gap-1.5">
                                                <span className="text-xl font-black text-slate-900">{user.following?.length || 0}</span>
                                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Siguiendo</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 mt-4">
                                            <p className="text-teal-600 font-bold text-xs tracking-widest uppercase opacity-80">@{user.email.split('@')[0]}</p>
                                        </div>
                                    </div>

                                    <div className="flex gap-3 w-full md:w-auto">
                                        <button
                                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                                            disabled={isSaving}
                                            className="flex-1 md:flex-none px-8 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-teal-600 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg"
                                        >
                                            {isSaving ? <Loader2 size={16} className="animate-spin" /> : isEditing ? <><Save size={16}/> Guardar</> : <><Edit2 size={16}/> Editar Perfil</>}
                                        </button>
                                        <button onClick={() => setShowShareMenu(!showShareMenu)} className="p-3 bg-white text-slate-500 rounded-2xl border border-slate-100 shadow-md hover:bg-teal-600 hover:text-white transition-all">
                                            <Share2 size={20} />
                                        </button>
                                    </div>
                                </div>
                                
                                <div className="relative">
                                    <div className="bg-slate-50/80 border border-slate-100 rounded-[2rem] p-5 md:p-8 shadow-inner relative overflow-hidden group/bio">
                                        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-teal-500 to-emerald-500 rounded-full opacity-40 group-hover/bio:opacity-100 transition-opacity"></div>
                                        <div className="pl-4">
                                            {isEditing ? (
                                                <textarea
                                                    className="w-full bg-transparent border-none focus:ring-0 text-sm text-slate-600 italic leading-relaxed resize-none font-medium"
                                                    rows={3}
                                                    value={formData.bio}
                                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                                />
                                            ) : (
                                                <p className="text-slate-600 text-sm md:text-base italic leading-relaxed font-semibold">
                                                    "{user.bio || 'Este lector prefiere mantener su historia en privado de momento...'}"
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12">
                <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white flex flex-col md:flex-row items-center justify-between shadow-2xl transition-all hover:shadow-teal-500/5">
                    <div className="flex items-center gap-5 mb-4 md:mb-0">
                        <div className={`p-4 rounded-[1.5rem] transition-all shadow-inner ${formData.isPublic ? 'bg-teal-50 text-teal-600' : 'bg-slate-100 text-slate-400'}`}>
                            {formData.isPublic ? <Unlock size={28} /> : <Lock size={28} />}
                        </div>
                        <div>
                            <h3 className="font-black text-slate-900 text-lg tracking-tight uppercase">Visibilidad del Perfil</h3>
                            <p className="text-xs text-slate-500 font-medium">{formData.isPublic ? 'Tu estante literario es visible para otros lectores' : 'Solo tú puedes ver tu biblioteca y progreso'}</p>
                        </div>
                    </div>
                    <button
                        onClick={togglePrivacy}
                        className={`w-16 h-9 rounded-full relative transition-all duration-500 shadow-inner ${formData.isPublic ? 'bg-teal-500' : 'bg-slate-300'}`}
                    >
                        <div className={`absolute top-1 w-7 h-7 bg-white rounded-full shadow-lg transition-all duration-300 ${formData.isPublic ? 'left-8' : 'left-1'}`} />
                    </button>
                </div>
            </div>

            {showDeleteModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowDeleteModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white">
                        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center text-rose-500 mb-6 mx-auto">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 text-center mb-2 uppercase">¿Eliminar foto?</h3>
                        <p className="text-sm text-slate-500 text-center mb-8 font-medium">Esta acción no se puede deshacer. Volverás a tener tu avatar predeterminado.</p>
                        <div className="flex flex-col gap-3">
                            <button 
                                onClick={confirmDeleteAvatar}
                                className="w-full py-4 bg-rose-500 text-white rounded-2xl font-bold text-sm hover:bg-rose-600 transition-colors shadow-lg shadow-rose-500/20"
                            >
                                Sí, eliminar foto
                            </button>
                            <button 
                                onClick={() => setShowDeleteModal(false)}
                                className="w-full py-4 bg-slate-100 text-slate-500 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-colors"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};