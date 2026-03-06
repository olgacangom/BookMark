import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Lock, Unlock, Camera, LogOut, Save, Edit } from 'lucide-react';
import api from '../../services/api';

export const MyProfileView = () => {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.fullName || '',
    bio: user?.bio || '',
    isPublic: user?.isPublic ?? true
  });

  if (!user) return null;

  const handleSave = async () => {
    try {
      const response = await api.patch('/users/profile', {
        fullName: formData.name, 
        bio: formData.bio,
        isPublic: formData.isPublic
      });

      updateUser(response.data);

      setIsEditing(false);
      console.log("✅ Perfil actualizado y persistido");
    } catch (error) {
      console.error("❌ Error al guardar perfil:", error);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 animate-in slide-in-from-bottom-4 duration-700">

      {/* Profile Header */}
      <div className="bg-white rounded-[3rem] shadow-sm overflow-hidden mb-8 border border-border">
        <div className="h-40 bg-gradient-to-br from-[#9b8b7e] to-[#c5b5aa] relative">
          <button className="absolute bottom-4 right-8 bg-white/20 backdrop-blur-md text-white p-2 rounded-xl border border-white/30 hover:bg-white/40 transition-all">
            <Camera className="w-5 h-5" />
          </button>
        </div>

        <div className="px-10 pb-10">
          <div className="flex flex-col md:flex-row items-start md:items-end gap-6 -mt-16">
            <div className="relative group">
              <img
                src={user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`}
                className="w-40 h-40 rounded-[3rem] border-8 border-white shadow-2xl bg-white object-cover"
              />
              <div className="absolute inset-0 bg-black/20 rounded-[3rem] opacity-0 group-hover:opacity-100 flex items-center justify-center cursor-pointer transition-opacity">
                <Camera className="text-white w-8 h-8" />
              </div>
            </div>

            <div className="flex-1">
              {isEditing ? (
                <input
                  className="text-3xl font-black bg-muted border-none rounded-xl px-4 py-1 focus:ring-2 focus:ring-primary outline-none"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              ) : (
                <h1 className="text-4xl font-black text-foreground">{formData.name}</h1>
              )}
              <p className="text-primary font-bold mt-1">@{user.email.split('@')[0]}</p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-2xl font-bold shadow-lg shadow-primary/20 hover:-translate-y-1 transition-all"
              >
                {isEditing ? <><Save className="w-5 h-5" /> Guardar</> : <><Edit className="w-5 h-5" /> Editar</>}
              </button>
              <button
                onClick={() => { logout(); navigate('/login'); }}
                className="text-muted-foreground hover:text-destructive transition-colors p-2 hover:bg-destructive/5 rounded-xl"
                title="Cerrar Sesión"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Biografía */}
          <div className="mt-10">
            <label className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-2 block">Biografía</label>
            {isEditing ? (
              <textarea
                className="w-full bg-muted rounded-2xl p-4 border-none focus:ring-2 focus:ring-primary outline-none text-foreground"
                rows={3}
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              />
            ) : (
              <p className="text-lg text-foreground leading-relaxed">{formData.bio || 'Aún no has escrito nada sobre ti...'}</p>
            )}
          </div>
        </div>
      </div>

      {/* Ajustes de Privacidad (Estilo Switch de Figma) */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-border flex items-center justify-between">
        <div className="flex items-center gap-5">
          <div className={`p-4 rounded-2xl ${formData.isPublic ? 'bg-green-50 text-green-600' : 'bg-slate-100 text-slate-500'}`}>
            {formData.isPublic ? <Unlock /> : <Lock />}
          </div>
          <div>
            <h3 className="font-bold text-foreground">Visibilidad del perfil</h3>
            <p className="text-sm text-muted-foreground">Tu biblioteca es {formData.isPublic ? 'visible para todos' : 'privada'}</p>
          </div>
        </div>
        <button
          onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
          className={`w-14 h-8 rounded-full transition-colors relative ${formData.isPublic ? 'bg-primary' : 'bg-switch-background'}`}
        >
          <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${formData.isPublic ? 'left-7' : 'left-1'}`} />
        </button>
      </div>
    </div>
  );
};