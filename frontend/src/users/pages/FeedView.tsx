import { useState, useEffect } from 'react';
import { activityService, Activity, Comment } from '../services/activity.service';
import { Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ActivityCard } from '../components/ActivityCard';

export const FeedView = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            const data = await activityService.getFeed();
            setActivities(data);
        } catch (err) {
            console.error("Error al cargar el feed:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchFeed(); }, []);

    const handleToggleLike = async (activityId: string) => {
        setActivities(current => current.map(act => {
            if (act.id === activityId) {
                const isAdding = !act.isLiked;
                const currentLikes = Number(act.likesCount) || 0;
                return {
                    ...act,
                    isLiked: isAdding,
                    likesCount: isAdding ? currentLikes + 1 : Math.max(0, currentLikes - 1)
                };
            }
            return act;
        }));
        try { await activityService.toggleLike(activityId); } catch (e) { console.log(e); }
    };

    const handleIgnoreActivity = async (activityId: string) => {
        setActivities(current => current.filter(act => act.id !== activityId));
        try { await activityService.ignoreActivity(activityId); } catch (e) { console.log(e); }
    };

    const handleCommentAdded = (activityId: string, newComment: Comment) => {
        setActivities(current => current.map(act => {
            if (act.id === activityId) {
                return {
                    ...act,
                    commentsCount: (Number(act.commentsCount) || 0) + 1,
                    comments: [...(act.comments || []), newComment]
                };
            }
            return act;
        }));
    };

    if (loading && activities.length === 0) return (
        <div className="flex h-[80vh] flex-col items-center justify-center bg-[#F0F9F9]">
            <Loader2 className="w-10 h-10 animate-spin text-teal-600" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mt-6 text-center">Sincronizando cronología...</p>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F0F9F9] font-sans text-slate-900 pb-24">
            <header className="max-w-2xl mx-auto pt-12 pb-10 px-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-slate-900">
                            The <span className="text-teal-600 italic font-serif">Feed.</span>
                        </h1>
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Actividad de tus contactos</p>
                    </div>
                    <button onClick={fetchFeed} disabled={loading} className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-teal-600 transition-all shadow-sm active:scale-90 disabled:opacity-50">
                        <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </header>

            <main className="max-w-2xl mx-auto px-4 space-y-8">
                {activities.length > 0 ? (
                    activities.map((activity) => (
                        <ActivityCard 
                            key={activity.id} 
                            activity={activity} 
                            onLike={handleToggleLike}
                            onIgnore={handleIgnoreActivity}
                            onComment={handleCommentAdded} 
                        />
                    ))
                ) : (
                    <div className="text-center py-20 bg-white/50 border-2 border-dashed border-slate-200 rounded-[3rem]">
                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No hay actividad reciente</p>
                    </div>
                )}

                {activities.length > 0 && (
                    <div className="text-center py-10 animate-in fade-in duration-1000">
                        <div className="inline-flex items-center gap-3 px-6 py-3 bg-white border border-slate-200 rounded-full shadow-sm text-slate-400">
                            <CheckCircle2 size={18} className="text-teal-500" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Estás al día</span>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};