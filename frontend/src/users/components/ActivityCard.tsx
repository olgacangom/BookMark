import { UserPlus, BookOpen, CheckCircle2 } from 'lucide-react';
import { Activity, ActivityType } from '../services/activity.service';
import { formatDistanceToNow, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

export const ActivityCard = ({ activity }: { activity: Activity }) => {
  const date = typeof activity.createdAt === 'string' 
    ? parseISO(activity.createdAt) 
    : new Date(activity.createdAt);

  const timeAgo = formatDistanceToNow(date, { 
    addSuffix: true, 
    locale: es 
  });
  const renderContent = () => {
    switch (activity.type) {
      case ActivityType.FOLLOW:
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <UserPlus className="w-4 h-4" />
            </div>
            <p className="text-sm">
              <span className="font-bold">{activity.user.fullName}</span> ahora sigue a{' '}
              <span className="font-bold">{activity.targetUser?.fullName}</span>
            </p>
          </div>
        );
      case ActivityType.BOOK_ADDED:
        return (
          <div className="flex gap-4">
            <div className="p-2 h-fit bg-amber-50 rounded-lg text-amber-600">
              <BookOpen className="w-4 h-4" />
            </div>
            <div className="flex-1">
              <p className="text-sm mb-2">
                <span className="font-bold">{activity.user.fullName}</span> añadió un nuevo libro a su biblioteca
              </p>
              {activity.targetBook && (
                <div className="flex gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  {activity.targetBook.thumbnail && (
                    <img 
                      src={activity.targetBook.thumbnail} 
                      alt={activity.targetBook.title} 
                      className="w-12 h-16 object-cover rounded shadow-sm" 
                    />
                  )}
                  <div>
                    <h4 className="text-sm font-bold text-foreground line-clamp-1">{activity.targetBook.title}</h4>
                    <p className="text-xs text-muted-foreground">
                      {Array.isArray(activity.targetBook.authors) 
                        ? activity.targetBook.authors.join(', ') 
                        : 'Autor desconocido'}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        );
      case ActivityType.BOOK_FINISHED:
        return (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-50 rounded-lg text-green-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
            <p className="text-sm">
              <span className="font-bold">{activity.user.fullName}</span> terminó de leer{' '}
              <span className="font-bold italic">"{activity.targetBook?.title}"</span>. ¡Enhorabuena! 🎉
            </p>
          </div>
        );
      default:
        return null; 
    }
  };

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-border mb-4 transition-all hover:shadow-md">
      <div className="flex items-center gap-3 mb-4">
        <img 
          src={activity.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user.email}`} 
          className="w-8 h-8 rounded-full border border-slate-100"
          alt={activity.user.fullName}
        />
        <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60">
            {timeAgo}
        </span>
      </div>
      {renderContent()}
    </div>
  );
};