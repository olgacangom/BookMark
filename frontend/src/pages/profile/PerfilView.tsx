import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { ArrowLeft, UserPlus, MessageCircle, Trophy, Lock } from 'lucide-react';
import api from '../../services/api';

export const PerfilView = () => {
  const { id } = useParams();
  const { user: currentUser } = useAuth();
  const [targetUser, setTargetUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data } = await api.get(`/users/profile/${id}`);
        setTargetUser(data);
      } catch {
        console.error("Usuario no encontrado");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [id]);

  if (loading) return <div className="p-20 text-center">Cargando perfil...</div>;

  if (!targetUser || (!targetUser.isPublic && targetUser.id !== currentUser?.id)) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center">
        <div className="bg-white rounded-[2.5rem] p-12 shadow-sm border border-border">
          <Lock className="w-16 h-16 mx-auto mb-4 text-primary opacity-20" />
          <h2 className="text-2xl font-bold text-foreground">Perfil Privado</h2>
          <p className="text-muted-foreground mt-2 mb-6">Este usuario prefiere mantener su biblioteca en privado.</p>
          <Link to="/dashboard" className="text-primary font-bold hover:underline">← Volver al inicio</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 pb-24 animate-in fade-in duration-500">
      <Link to="/dashboard" className="flex items-center gap-2 text-muted-foreground hover:text-primary mb-6 font-medium transition-colors">
        <ArrowLeft className="w-4 h-4" /> Volver
      </Link>

      {/* Profile Header con Tonos Tierra */}
      <div className="bg-white rounded-[2.5rem] shadow-sm overflow-hidden mb-8 border border-border">
        <div className="h-40 bg-gradient-to-r from-[#a4a99f] via-[#9b8b7e] to-[#b5a99a]" />
        <div className="px-8 pb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-end gap-6 -mt-20">
            <img 
              src={targetUser.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetUser.id}`} 
              className="w-36 h-36 rounded-[2.5rem] border-8 border-white object-cover shadow-xl bg-white"
            />
            <div className="flex-1">
              <h1 className="text-3xl font-black text-foreground">{targetUser.fullName}</h1>
              <p className="text-primary font-bold">@{targetUser.email.split('@')[0]}</p>
            </div>
            <div className="flex gap-3">
              <button className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-bold hover:shadow-lg transition-all active:scale-95">
                <UserPlus className="w-5 h-5" /> Seguir
              </button>
              <button className="p-3 border border-border rounded-2xl text-primary hover:bg-muted transition-colors">
                <MessageCircle className="w-6 h-6" />
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4 pt-8 border-t border-border">
            <StatBox label="Leídos" value="24" />
            <StatBox label="Racha" value="12 🔥" />
            <StatBox label="Seguidores" value="142" />
            <StatBox label="Siguiendo" value="89" />
          </div>
        </div>
      </div>

      {/* Grid de Contenido Inferior */}
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-border">
          <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
             <Trophy className="w-5 h-5 text-secondary" /> Logros destacados
          </h2>
          <div className="flex gap-4">
             <div className="p-4 bg-orange-50 rounded-2xl text-center flex-1">
                <span className="text-3xl">📚</span>
                <p className="text-xs font-bold mt-2">Ratón de Biblioteca</p>
             </div>
             <div className="p-4 bg-blue-50 rounded-2xl text-center flex-1">
                <span className="text-3xl">✍️</span>
                <p className="text-xs font-bold mt-2">Crítico Experto</p>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const StatBox = ({ label, value }: any) => (
  <div className="text-center">
    <p className="text-2xl font-black text-foreground">{value}</p>
    <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
  </div>
);