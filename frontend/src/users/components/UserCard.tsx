import { FollowButton } from './FollowButton';

interface UserCardProps {
  user: {
    id: string;
    fullName: string;
    email: string;
    avatarUrl?: string; 
    followStatus: 'PENDING' | 'ACCEPTED' | null;
  };
}

export const UserCard = ({ user }: UserCardProps) => {
  const username = user.email.split('@')[0];

  return (
    <div className="bg-white p-5 rounded-[2rem] border border-border flex flex-col items-center text-center shadow-sm hover:shadow-md transition-all duration-300 group">
      
      {/* Avatar Container */}
      <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-white shadow-sm overflow-hidden mb-4 shrink-0 transition-transform group-hover:scale-105 flex items-center justify-center">
        {user.avatarUrl ? (
          <img 
            src={user.avatarUrl} 
            className="w-full h-full object-cover" 
            alt={user.fullName} 
            onError={(e) => {
              (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`;
            }}
          />
        ) : (
          <img 
            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`} 
            className="w-full h-full object-cover opacity-80" 
            alt="Avatar temporal" 
          />
        )}
      </div>

      <div className="w-full mb-5 flex-1">
        <h3 className="font-black text-base text-foreground truncate px-2">{user.fullName}</h3>
        <p className="text-[10px] font-black uppercase tracking-widest text-primary/60 mt-0.5">@{username}</p>
      </div>

      <FollowButton 
        targetUserId={user.id} 
        initialStatus={user.followStatus} 
        className="w-full !rounded-xl py-2" 
      />
    </div>
  );
};