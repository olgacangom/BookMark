import { useState } from 'react';
import { ThreadPost } from '../service/club.service';
import { Lock, CheckCircle2 } from 'lucide-react';

interface Props {
    post: ThreadPost;
    userCurrentPage: number;
}

export const ThreadPostItem = ({ post, userCurrentPage }: Props) => {
    const isSpoiler = post.spoilerPage > 0 && post.spoilerPage > userCurrentPage;
    const [revealAnyway, setRevealAnyway] = useState(false);

    const shouldBlur = isSpoiler && !revealAnyway;

    const formatTime = (dateString: string | Date) => {
        if (!dateString) return '...';

        try {
            const date = new Date(dateString);

            if (isNaN(date.getTime())) return '...';

            return new Intl.DateTimeFormat('es-ES', {
                hour: '2-digit',
                minute: '2-digit',
                hour12: false,
                timeZone: 'Europe/Madrid' 
            }).format(date);

        } catch {
            return '...';
        }
    };

    return (
        <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="shrink-0">
                <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                    <img
                        src={post.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`}
                        alt=""
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            <div className="flex-1 max-w-[80%]">
                <div className="flex items-center gap-2 mb-1 ml-1">
                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-tight">
                        {post.author.fullName}
                    </span>
                    <span className="text-[8px] font-bold text-slate-300 uppercase">
                        {formatTime(post.createdAt)}
                    </span>
                </div>

                <div className={`relative bg-white p-4 rounded-[1.5rem] rounded-tl-none border border-slate-100 shadow-sm transition-all ${shouldBlur ? 'overflow-hidden' : ''}`}>
                    <div className={`transition-all duration-700 ${shouldBlur ? 'blur-xl opacity-20 select-none pointer-events-none' : 'opacity-100'}`}>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">
                            {post.content}
                        </p>
                    </div>

                    {shouldBlur && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/10 backdrop-blur-sm p-4 text-center">
                            <div className="w-8 h-8 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-2 shadow-inner">
                                <Lock size={16} />
                            </div>
                            <p className="text-[9px] font-black text-slate-800 uppercase tracking-tighter">Spoiler: Pág. {post.spoilerPage}</p>
                            <button
                                onClick={() => setRevealAnyway(true)}
                                className="mt-2 text-[8px] font-bold text-teal-600 uppercase tracking-widest hover:underline"
                            >
                                Revelar mensaje
                            </button>
                        </div>
                    )}

                    {post.spoilerPage > 0 && !shouldBlur && (
                        <div className="absolute -right-2 -bottom-2 bg-emerald-500 text-white p-1 rounded-full shadow-lg border-2 border-white">
                            <CheckCircle2 size={10} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};