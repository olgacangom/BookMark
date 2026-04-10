import { useState } from 'react';
import { Activity, ActivityType, activityService, Comment } from '../services/activity.service';
import { 
    Heart, MessageCircle, Share2, Star, MoreHorizontal, 
    UserPlus, BookOpen, CheckCircle2, EyeOff, UserCircle, Flag, Send, Loader2, Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Props {
    activity: Activity;
    onLike: (id: string) => void;
    onIgnore: (id: string) => void;
    onComment: (activityId: string, comment: Comment) => void; // Nueva prop
}

export const ActivityCard = ({ activity, onLike, onIgnore, onComment }: Props) => {
    const navigate = useNavigate();
    const [showMenu, setShowMenu] = useState(false);
    const [showComments, setShowComments] = useState(false);
    const [commentText, setCommentText] = useState('');
    const [isSending, setIsSending] = useState(false);
    const [copied, setCopied] = useState(false);

    const getActivityMessage = () => {
        switch (activity.type) {
            case ActivityType.FOLLOW:
                return `Ha comenzado a seguir la biblioteca de ${activity.targetUser?.fullName || 'un nuevo lector'}.`;
            case ActivityType.BOOK_ADDED:
                return `Ha descubierto un nuevo tesoro: "${activity.targetBook?.title}" y lo ha sumado a su colección.`;
            case ActivityType.BOOK_FINISHED:
                return `¡Misión cumplida! Ha devorado "${activity.targetBook?.title}" de principio a fin.`;
            default:
                return "Compartiendo actividad con la comunidad.";
        }
    };

    const handleShare = async () => {
        const url = `${window.location.origin}/profile/${activity.user.id}`;
        if (navigator.share) {
            try {
                await navigator.share({ title: 'Actividad en BookMark', url });
            } catch (err) { console.log(err); }
        } else {
            navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleSendComment = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!commentText.trim() || isSending) return;
        setIsSending(true);
        try {
            const newComment = await activityService.addComment(activity.id, commentText);
            setCommentText('');
            onComment(activity.id, newComment); // Inyectamos el comentario en el feed
        } catch (err) { 
            console.error("Error al enviar comentario:", err); 
        } finally { 
            setIsSending(false); 
        }
    };

    return (
        <article className="bg-white rounded-[2.5rem] shadow-xl shadow-slate-200/60 border border-white overflow-visible transition-all duration-300 hover:shadow-2xl animate-in fade-in slide-in-from-bottom-4">
            
            <div className="p-6 flex items-center justify-between relative">
                <div className="flex items-center gap-4">
                    <div 
                        className="w-12 h-12 rounded-2xl overflow-hidden bg-slate-100 cursor-pointer border border-slate-100 shadow-sm hover:scale-105 transition-transform"
                        onClick={() => navigate(`/profile/${activity.user.id}`)}
                    >
                        <img src={activity.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user.id}`} className="w-full h-full object-cover" alt="" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2">
                            <h3 className="font-black text-slate-900 text-sm tracking-tight">{activity.user.fullName}</h3>
                            <ActivityBadge type={activity.type} />
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                            {new Date(activity.createdAt).toLocaleDateString('es-ES', { month: 'long', day: 'numeric' })}
                        </p>
                    </div>
                </div>

                <div className="relative">
                    <button 
                        onClick={() => setShowMenu(!showMenu)} 
                        className={`p-2 rounded-xl transition-all ${showMenu ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-600'}`}
                    >
                        <MoreHorizontal size={20} />
                    </button>

                    {showMenu && (
                        <>
                            <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                            <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 z-20 p-2 animate-in zoom-in-95 duration-200 origin-top-right">
                                <button onClick={() => { onIgnore(activity.id); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors group text-left">
                                    <EyeOff size={18} className="text-slate-400 group-hover:text-teal-600" />
                                    <span className="text-sm font-bold">No me interesa</span>
                                </button>
                                <button onClick={() => { navigate(`/profile/${activity.user.id}`); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors group text-left">
                                    <UserCircle size={18} className="text-slate-400 group-hover:text-teal-600" />
                                    <span className="text-sm font-bold">Ver cuenta</span>
                                </button>
                                <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-50 text-rose-500 transition-colors text-left">
                                    <Flag size={18} />
                                    <span className="text-sm font-bold">Reportar</span>
                                </button>
                            </div>
                        </>
                    )}
                </div>
            </div>

            <div className="px-8 pb-6">
                <p className="text-slate-600 text-sm leading-relaxed mb-6 font-medium">
                    {getActivityMessage()}
                </p>

                {activity.targetBook && (
                    <div className="bg-slate-50/50 rounded-3xl p-5 flex gap-5 border border-slate-100 group/book cursor-pointer hover:bg-slate-100/50 transition-all">
                        <div className="w-20 h-28 rounded-xl overflow-hidden shadow-lg border border-white shrink-0 group-hover/book:scale-105 transition-transform duration-500">
                            <img src={activity.targetBook.urlPortada} alt="" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 flex flex-col justify-center">
                            <h4 className="font-black text-slate-900 text-base uppercase tracking-tight leading-tight">{activity.targetBook.title}</h4>
                            <p className="text-[10px] font-bold text-teal-600 uppercase tracking-widest mt-1">{activity.targetBook.authors?.join(', ')}</p>
                            {activity.type === ActivityType.BOOK_FINISHED && (
                                <div className="flex gap-1 mt-4">
                                    {[1, 2, 3, 4, 5].map((s) => (
                                        <Star key={s} size={12} className={s <= (activity.targetBook?.rating || 0) ? "fill-amber-400 text-amber-400" : "text-slate-200"} />
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <div className="px-8 py-5 flex items-center justify-between bg-slate-50/30 border-t border-slate-100">
                <div className="flex items-center gap-8">
                    <button 
                        onClick={() => onLike(activity.id)}
                        className={`flex items-center gap-2 group transition-all ${activity.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}
                    >
                        <div className={`p-2 rounded-full transition-colors ${activity.isLiked ? 'bg-rose-50' : 'group-hover:bg-rose-50'}`}>
                            <Heart size={22} className={activity.isLiked ? 'fill-current' : ''} />
                        </div>
                        <span className="text-xs font-black">{activity.likesCount || 0}</span>
                    </button>

                    <button 
                        onClick={() => setShowComments(!showComments)}
                        className={`flex items-center gap-2 group transition-all ${showComments ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}
                    >
                        <div className={`p-2 rounded-full transition-colors ${showComments ? 'bg-teal-50' : 'group-hover:bg-teal-50'}`}>
                            <MessageCircle size={22} className={showComments ? 'fill-current' : ''} />
                        </div>
                        <span className="text-xs font-black">{activity.commentsCount || 0}</span>
                    </button>
                </div>
                
                <button onClick={handleShare} className="p-3 bg-white text-slate-500 rounded-2xl border border-slate-100 shadow-sm hover:bg-teal-600 hover:text-white transition-all active:scale-90">
                    {copied ? <Check size={20} /> : <Share2 size={20} />}
                </button>
            </div>

            {showComments && (
                <div className="px-8 pb-8 pt-4 bg-slate-50/30 border-t border-slate-100 animate-in slide-in-from-top-2 duration-300">
                    
                    <div className="space-y-4 mb-6 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {activity.comments && activity.comments.length > 0 ? (
                            activity.comments.map((comment) => (
                                <div key={comment.id} className="flex gap-3 animate-in fade-in slide-in-from-left-2">
                                    <div className="w-8 h-8 rounded-xl overflow-hidden shrink-0 border border-white shadow-sm">
                                        <img 
                                            src={comment.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.id}`} 
                                            className="w-full h-full object-cover"
                                            alt=""
                                        />
                                    </div>
                                    <div className="flex-1">
                                        <div className="bg-white px-4 py-2.5 rounded-2xl rounded-tl-none shadow-sm border border-slate-100">
                                            <p className="text-[10px] font-black text-teal-600 uppercase tracking-tighter mb-0.5">
                                                {comment.user.fullName}
                                            </p>
                                            <p className="text-xs text-slate-600 font-medium leading-relaxed">
                                                {comment.text}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest text-center py-4">
                                Sé el primero en comentar...
                            </p>
                        )}
                    </div>

                    <form onSubmit={handleSendComment} className="flex gap-3 items-center">
                        <div className="flex-1 relative">
                            <input 
                                type="text" 
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                placeholder="Escribe un comentario..." 
                                className="w-full bg-white border border-slate-200 rounded-2xl py-3 px-5 text-sm focus:border-teal-500 outline-none pr-12 transition-all shadow-inner font-medium"
                            />
                            <button 
                                type="submit"
                                disabled={!commentText.trim() || isSending}
                                className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-teal-600 hover:bg-teal-50 rounded-xl disabled:opacity-30 transition-all"
                            >
                                {isSending ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </article>
    );
};

const ActivityBadge = ({ type }: { type: ActivityType }) => {
    const config = {
        [ActivityType.FOLLOW]: { icon: <UserPlus size={10} />, color: "bg-sky-50 text-sky-600 border-sky-100", label: "Nuevo Amigo" },
        [ActivityType.BOOK_ADDED]: { icon: <BookOpen size={10} />, color: "bg-amber-50 text-amber-600 border-amber-100", label: "Nueva Lectura" },
        [ActivityType.BOOK_FINISHED]: { icon: <CheckCircle2 size={10} />, color: "bg-emerald-50 text-emerald-600 border-emerald-100", label: "Completado" }
    };
    return (
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-tighter ${config[type].color}`}>
            {config[type].icon}
            <span>{config[type].label}</span>
        </div>
    );
};