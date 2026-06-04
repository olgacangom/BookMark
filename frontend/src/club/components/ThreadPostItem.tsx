import { useState } from 'react';
import { ThreadPost } from '../service/club.service';
import { Lock } from 'lucide-react';

interface Props {
    post: ThreadPost;
    userCurrentPage: number;
}

export const ThreadPostItem = ({ post, userCurrentPage }: Props) => {
    const isSpoiler = post.spoilerPage > 0 && post.spoilerPage > userCurrentPage;
    const [revealAnyway, setRevealAnyway] = useState(false);
    const shouldBlur = isSpoiler && !revealAnyway;

    return (
        <div className="flex gap-4 group animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="shrink-0">
                <div className="w-10 h-10 rounded-2xl overflow-hidden border-2 border-white shadow-sm bg-slate-100">
                    <img src={post.author.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author.id}`} className="w-full h-full object-cover" alt="" />
                </div>
            </div>

            <div className="flex-1 max-w-[85%]">
                <div className="flex items-center gap-3 mb-1.5 ml-1">
                    <span className="text-[11px] font-black text-slate-900 uppercase tracking-tight">{post.author.fullName}</span>
                    <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">{new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div className={`relative bg-white p-5 rounded-[2rem] rounded-tl-none border border-slate-100 shadow-sm transition-all ${shouldBlur ? 'overflow-hidden' : ''}`}>
                    <div className={`transition-all duration-700 ${shouldBlur ? 'blur-2xl opacity-10 select-none' : 'opacity-100'}`}>
                        <p className="text-sm text-slate-600 font-medium leading-relaxed">{post.content}</p>
                    </div>

                    {shouldBlur && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/20 backdrop-blur-md p-4 text-center">
                            <Lock size={20} className="text-amber-500 mb-2" />
                            <p className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">Spoiler de la Pág. {post.spoilerPage}</p>
                            <button onClick={() => setRevealAnyway(true)} className="mt-3 bg-white px-4 py-1.5 rounded-full border border-slate-200 text-[9px] font-black text-teal-600 uppercase hover:bg-teal-50 transition-all">Revelar mensaje</button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};