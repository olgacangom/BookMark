import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Unlock, Camera, Save, Edit, Loader2 } from 'lucide-react';
import api from '../../services/api';

export const MyProfileView = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    isPublic: true
  });

  useEffect(() => {
    const refreshData = async () => {
      if (!user?.id) return;
      try {
        const { data } = await api.get(`/users/${user.id}`);
        updateUser(data); 
      } catch (error) {
        console.error("Error al refrescar contadores:", error);
      }
    };

    refreshData();
  }, [user?.id, updateUser]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.fullName || '',
        bio: user.bio || '',
        isPublic: user.isPublic ?? true
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert("Tu sesión ha expirado. Por favor, inicia sesión de nuevo.");
      logout();
      navigate('/login');
      return;
    }

    setIsSaving(true);
    try {
      const { data } = await api.patch('/users/profile', {
        fullName: formData.name,
        bio: formData.bio,
        isPublic: formData.isPublic
      });

      updateUser(data);
      setIsEditing(false);
      console.log("✅ Perfil actualizado correctamente");
    } catch (error: any) {
      console.error("❌ Error al guardar perfil:", error);

      if (error.response?.status === 401) {
        alert("Sesión no válida. Por favor, vuelve a entrar.");
        logout();
        navigate('/login');
      } else {
        alert("Error al conectar con el servidor. Revisa tu conexión.");
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 md:py-8 pb-24 animate-in slide-in-from-bottom-4 duration-700">

      {/* Profile Header */}
      <div className="bg-white rounded-[2.5rem] md:rounded-[3rem] shadow-sm overflow-hidden mb-8 border border-border">
        <div className="h-28 md:h-32 bg-gradient-to-br from-[#9b8b7e] to-[#c5b5aa] relative">
          <button className="absolute bottom-4 right-4 md:right-8 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl border border-white/30 hover:bg-white/40 transition-all">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="px-6 md:px-10 pb-8 md:pb-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 -mt-12 md:mt-[-4rem]">

            {/* Avatar  */}
            <div className="relative group shrink-0">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                className="w-32 h-32 md:w-40 md:h-40 rounded-[2.5rem] md:rounded-[3rem] border-4 md:border-8 border-white shadow-2xl bg-white object-cover"
                alt="Avatar"
              />
            </div>

            {/* Info Container - Centrado en móvil */}
            <div className="flex-1 pt-2 md:pt-20 text-center md:text-left w-full">
              {isEditing ? (
                <input
                  className="text-2xl md:text-3xl font-black bg-muted border-none rounded-xl px-4 py-1 focus:ring-2 focus:ring-primary outline-none w-full text-center md:text-left"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  autoFocus
                />
              ) : (
                <h1 className="text-2xl md:text-4xl font-black text-foreground leading-tight break-words">
                  {user.fullName || 'Usuario de BookMark'}
                </h1>
              )}
              <p className="text-primary font-bold mt-1 text-sm md:text-base">@{user.email.split('@')[0]}</p>

              {/* Seguidores */}
              <div className="flex justify-center md:justify-start gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <span className="text-base md:text-lg font-black text-foreground">{user.followers?.length || 0}</span>
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Seguidores</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base md:text-lg font-black text-foreground">{user.following?.length || 0}</span>
                  <span className="text-[10px] md:text-[11px] font-black uppercase tracking-widest text-muted-foreground/70">Siguiendo</span>
                </div>
              </div>
            </div>

            {/* Botones de Acción - Ancho completo en móvil */}
            <div className="flex gap-3 w-full md:w-auto md:pt-20 shrink-0">
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                disabled={isSaving}
                className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-primary text-white px-6 md:px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all disabled:opacity-70"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                  isEditing ? <><Save className="w-5 h-5" /> Guardar</> : <><Edit className="w-5 h-5" /> Editar</>
                )}
              </button>
            </div>
          </div>

          {/* Biografía */}
          <div className="mt-8 md:mt-12">
            {isEditing ? (
              <textarea
                className="w-full bg-muted rounded-2xl p-4 md:p-5 border-none focus:ring-2 focus:ring-primary outline-none text-foreground font-medium text-sm md:text-base"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            ) : (
              <p className="text-base md:text-lg text-foreground leading-relaxed font-medium">
                {user.bio || 'Escribe algo sobre ti para que la comunidad te conozca...'}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Switch de Privacidad - Ajustado para móvil */}
      <div className="bg-white rounded-[2rem] p-6 md:p-8 shadow-sm border border-border flex items-center justify-between transition-all hover:shadow-md">
        <div className="flex items-center gap-4 md:gap-5">
          <div className={`p-3 md:p-4 rounded-2xl transition-colors ${formData.isPublic ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
            {formData.isPublic ? <Unlock className="w-5 h-5 md:w-6 md:h-6" /> : <Lock className="w-5 h-5 md:w-6 md:h-6" />}
          </div>
          <div>
            <h3 className="font-bold text-foreground text-sm md:text-base">Visibilidad del perfil</h3>
            <p className="text-[11px] md:text-sm text-muted-foreground font-medium">
              {formData.isPublic ? 'Perfil visible para todos' : 'Perfil privado'}
            </p>
          </div>
        </div>
        <button
          onClick={async () => {
            const newStatus = !formData.isPublic;
            setFormData(prev => ({ ...prev, isPublic: newStatus }));
            if (!isEditing) {
              try {
                setIsSaving(true);
                const { data } = await api.patch('/users/profile', {
                  fullName: formData.name,
                  bio: formData.bio,
                  isPublic: newStatus 
                });
                updateUser(data); 
                console.log("✅ Privacidad actualizada");
              } catch (error) {
                console.error("❌ Error al cambiar privacidad", error);
                setFormData(prev => ({ ...prev, isPublic: !newStatus }));
              } finally {
                setIsSaving(false);
              }
            }
          }}
          disabled={isSaving}
          className={`w-12 h-7 md:w-14 md:h-8 rounded-full transition-colors relative ${formData.isPublic ? 'bg-primary' : 'bg-slate-300'}`}
        >
          <div className={`absolute top-1 w-5 h-5 md:w-6 md:h-6 bg-white rounded-full shadow-sm transition-all ${formData.isPublic ? 'left-6 md:left-7' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
};