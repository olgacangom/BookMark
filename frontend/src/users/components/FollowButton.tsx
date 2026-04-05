import { useState } from 'react';
import { UserPlus, UserCheck, Clock, Loader2 } from 'lucide-react';
import api from '../../services/api';

interface Props {
  targetUserId: string;
  initialStatus: 'PENDING' | 'ACCEPTED' | null;
  className?: string;
}

export const FollowButton = ({ targetUserId, initialStatus, className = "" }: Props) => {
  const [status, setStatus] = useState<'PENDING' | 'ACCEPTED' | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollow = async () => {
    setIsLoading(true);
    try {
      if (status === 'ACCEPTED' || status === 'PENDING') {
        await api.post(`/users/unfollow/${targetUserId}`);
        setStatus(null);
      } else {
        const { data } = await api.post(`/users/follow/${targetUserId}`);
        setStatus(data.status);
      }
    } catch (error) {
      console.error("Error al gestionar seguimiento", error);
    } finally {
      setIsLoading(false);
    }
  };

  const getButtonConfig = () => {
    if (status === 'ACCEPTED') {
      return { 
        text: 'Siguiendo', 
        icon: <UserCheck className="w-4 h-4" />, 
        styles: 'bg-slate-100 text-slate-500 hover:bg-slate-200' 
      };
    }
    if (status === 'PENDING') {
      return { 
        text: 'Solicitado', 
        icon: <Clock className="w-4 h-4" />, 
        styles: 'bg-amber-50 text-amber-600 border border-amber-200 hover:bg-amber-100' 
      };
    }
    return { 
      text: 'Seguir', 
      icon: <UserPlus className="w-4 h-4" />, 
      styles: 'bg-primary text-white shadow-lg shadow-primary/20 hover:-translate-y-0.5' 
    };
  };

  const config = getButtonConfig();

  return (
    <button
      onClick={handleFollow}
      disabled={isLoading}
      className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${config.styles} ${isLoading ? 'opacity-70' : ''} ${className}`}
    >
      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <>{config.icon} {config.text}</>}
    </button>
  );
};