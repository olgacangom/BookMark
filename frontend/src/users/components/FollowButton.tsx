import { useState } from 'react';
import { UserPlus, UserCheck, Clock, Loader2, AlertTriangle } from 'lucide-react';
import api from '../../services/api';

interface Props {
  targetUserId: string;
  initialStatus: 'PENDING' | 'ACCEPTED' | null;
  className?: string;
}

export const FollowButton = ({ targetUserId, initialStatus, className = "" }: Props) => {
  const [status, setStatus] = useState<'PENDING' | 'ACCEPTED' | null>(initialStatus);
  const [isLoading, setIsLoading] = useState(false);
  const [showUnfollowModal, setShowUnfollowModal] = useState(false);

  const handleFollow = async () => {
    if (isLoading) return;

    if (status === 'ACCEPTED') {
      setShowUnfollowModal(true);
      return;
    }

    setIsLoading(true);

    try {
      if (status === 'PENDING') {
        await api.post(`/users/unfollow/${targetUserId}`);

        setStatus(null);
        return;
      }

      const { data } = await api.post(`/users/follow/${targetUserId}`);

      setStatus(data.status);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const confirmUnfollow = async () => {
    setIsLoading(true);
    try {
      await api.post(`/users/unfollow/${targetUserId}`);
      setStatus(null);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
      setShowUnfollowModal(false);
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
    <>
      <button
        onClick={handleFollow}
        disabled={isLoading}
        className={`flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest transition-all ${config.styles} ${isLoading ? 'opacity-70' : ''} ${className}`}
      >
        {isLoading
          ? <Loader2 className="w-4 h-4 animate-spin" />
          : <>{config.icon} {config.text}</>
        }
      </button>

      {showUnfollowModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
          <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">

            <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
              <AlertTriangle size={24} />
            </div>

            <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">
              ¿Dejar de seguir?
            </h3>

            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
              Vas a dejar de seguir a este usuario. Podrás volver a seguirlo cuando quieras.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowUnfollowModal(false)}
                className="flex-1 py-3 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest"
              >
                Cancelar
              </button>

              <button
                onClick={confirmUnfollow}
                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-rose-600 transition-all uppercase text-[10px] tracking-widest"
              >
                Dejar de seguir
              </button>
            </div>

          </div>
        </div>
      )}
    </>
  );

};