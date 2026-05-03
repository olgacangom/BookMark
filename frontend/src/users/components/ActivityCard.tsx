import React, { useState } from 'react';
import {
    Heart, MessageCircle, MoreHorizontal, Check, Plus, Send,
    Target, BookOpen, Users, BookText, Loader2, EyeOff, UserCircle, X, BookHeart,
    BookIcon, Edit2, Trash2, BarChart2, AlertTriangle
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { Activity, ActivityType, Comment, activityService } from '../services/activity.service';
import { useAuth } from '../../context/AuthContext';

const badgeConfig: Record<string, { icon: React.ComponentType<any>, color: string, label: string }> = {
    [ActivityType.FOLLOW]: { icon: Users, color: 'text-blue-500', label: 'Seguimiento' },
    [ActivityType.BOOK_ADDED]: { icon: BookOpen, color: 'text-emerald-500', label: 'Libro Añadido' },
    [ActivityType.BOOK_FINISHED]: { icon: Check, color: 'text-emerald-600', label: 'Libro Terminado' },
    [ActivityType.POST]: { icon: BookText, color: 'text-teal-600', label: 'Publicación' },
    DEFAULT: { icon: Target, color: 'text-slate-400', label: 'Actividad' },
};

interface ActivityCardProps {
    activity: Activity;
    onLike: (activityId: string) => void;
    onIgnore: (activityId: string) => void;
    onComment: (activityId: string, newComment: Comment) => void;
    onUpdate: (activityId: string, updatedActivity: Activity) => void; 
    onDelete: (activityId: string) => void;
}

const ActivityBadge: React.FC<{ type: ActivityType }> = ({ type }) => {
    const config = badgeConfig[type] || badgeConfig.DEFAULT;
    const Icon = config.icon;
    return (
        <div className={`flex items-center gap-1.5 p-2 bg-white rounded-full shadow-sm text-[10px] font-black uppercase tracking-widest ${config.color}`}>
            <Icon size={14} strokeWidth={3} />
            <span>{config.label}</span>
        </div>
    );
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onLike, onIgnore, onComment, onUpdate, onDelete }) => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [commentText, setCommentText] = useState('');
    const [showComments, setShowComments] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMenu, setShowMenu] = useState(false);

    const [isEditing, setIsEditing] = useState(false);
    const [editContent, setEditContent] = useState(activity.content || '');
    const [editImageUrl, setEditImageUrl] = useState<string | null>(activity.imageUrl || null);
    const [editPollOptions, setEditPollOptions] = useState<string[]>(activity.pollOptions || []);
    const [editTargetBook, setEditTargetBook] = useState(activity.targetBook || null);
    const [isUpdating, setIsUpdating] = useState(false);
    const [imageError, setImageError] = useState(false);

    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const isOwner = user?.id === activity.user?.id;

    const handleUpdateSave = async () => {
        setIsUpdating(true);
        try {
            const payload = {
                content: editContent,
                imageUrl: editImageUrl,
                pollOptions: editPollOptions.length > 0 ? editPollOptions : null,
                bookId: editTargetBook?.id || null
            };

            const updated = await activityService.updateActivity(activity.id, payload);
            onUpdate(activity.id, updated);
            setIsEditing(false);
        } catch {
            alert("No se pudo actualizar la publicación");
        } finally {
            setIsUpdating(false);
        }
    };

    const confirmDelete = () => {
        onDelete(activity.id);
        setShowDeleteModal(false);
    };

    const timeAgo = activity.createdAt
        ? formatDistanceToNow(new Date(activity.createdAt), { addSuffix: true, locale: es })
        : '';

    const handleSendComment = async () => {
        if (!commentText.trim() || isSubmitting) return;
        setIsSubmitting(true);
        try {
            const newCommentFromServer = await activityService.addComment(activity.id, commentText);
            onComment(activity.id, newCommentFromServer);
            setCommentText('');
        } catch {
            alert("No se pudo publicar el comentario");
        } finally {
            setIsSubmitting(false);
        }
    };

    const renderActivityContent = () => {
        if (isEditing) {
            return (
                <div className="space-y-4 p-5 bg-slate-50 rounded-[2rem] border-2 border-teal-100 animate-in zoom-in-95 duration-200">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-teal-600 tracking-widest">Editando publicación</span>
                    </div>

                    <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full bg-white p-4 rounded-2xl border border-slate-200 text-sm font-medium outline-none focus:ring-2 focus:ring-teal-500/20 resize-none min-h-[100px]"
                        placeholder="Edita tu mensaje..."
                        autoFocus
                    />

                    {editImageUrl && (
                        <div className="relative inline-block group">
                            <img src={editImageUrl} className="max-h-40 rounded-xl border-2 border-white shadow-sm opacity-50" alt="" />
                            <button
                                onClick={() => setEditImageUrl(null)}
                                className="absolute top-2 right-2 p-1.5 bg-rose-500 text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                            >
                                <X size={14} />
                            </button>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                <span className="bg-slate-900/60 text-white text-[9px] font-bold px-2 py-1 rounded-lg uppercase">Se eliminará al guardar</span>
                            </div>
                        </div>
                    )}

                    {editTargetBook && (
                        <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-200 w-fit shadow-sm">
                            <BookIcon size={18} className="text-teal-500" />
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-800 uppercase leading-none">{editTargetBook.title}</p>
                                <p className="text-[9px] text-slate-400 uppercase">{editTargetBook.author}</p>
                            </div>
                            <button onClick={() => setEditTargetBook(null)} className="p-1 hover:bg-rose-50 rounded-full text-rose-400 transition-colors">
                                <X size={14} />
                            </button>
                        </div>
                    )}

                    {editPollOptions.length > 0 && (
                        <div className="space-y-2 bg-white p-4 rounded-2xl border border-slate-200">
                            <div className="flex items-center gap-2 mb-2 text-teal-600">
                                <BarChart2 size={14} />
                                <span className="text-[10px] font-black uppercase">Opciones de encuesta</span>
                            </div>
                            {editPollOptions.map((opt, idx) => (
                                <input
                                    key={idx}
                                    value={opt}
                                    onChange={(e) => {
                                        const newOpts = [...editPollOptions];
                                        newOpts[idx] = e.target.value;
                                        setEditPollOptions(newOpts);
                                    }}
                                    className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs outline-none focus:ring-1 focus:ring-teal-500/20"
                                />
                            ))}
                            <button onClick={() => setEditPollOptions([])} className="text-[9px] font-bold text-rose-400 uppercase hover:underline">Eliminar encuesta</button>
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-2">
                        <button
                            onClick={() => { setIsEditing(false); setEditContent(activity.content || ''); }}
                            className="px-4 py-2 text-xs font-black text-slate-400 uppercase tracking-widest hover:text-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateSave}
                            disabled={isUpdating}
                            className="px-6 py-2 bg-teal-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-700 transition-all flex items-center gap-2 shadow-lg shadow-teal-500/20"
                        >
                            {isUpdating ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} strokeWidth={3} />}
                            Guardar Cambios
                        </button>
                    </div>
                </div>
            );
        }

        switch (activity.type) {
            case ActivityType.FOLLOW:
                return (
                    <div className="flex items-center gap-4 p-4 bg-slate-50/50 rounded-2xl border border-slate-100 text-left">
                        <img
                            src={activity.targetUser?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.targetUser?.id}`}
                            className="w-12 h-12 rounded-full border-2 border-white object-cover shadow-sm" alt=""
                        />
                        <div>
                            <p className="text-xs font-bold text-slate-800 leading-none">
                                Empezó a seguir a <span className="font-black text-teal-600">{activity.targetUser?.fullName}</span>
                            </p>
                            <p className="text-[10px] text-slate-400 uppercase mt-1">{timeAgo}</p>
                        </div>
                    </div>
                );
            case ActivityType.BOOK_ADDED:
            case ActivityType.BOOK_FINISHED: {
                if (!activity.targetBook) return null;
                const isFinished = activity.type === ActivityType.BOOK_FINISHED;
                return (
                    <div className="flex gap-5 p-5 bg-slate-50/50 rounded-[2.5rem] border border-slate-100 text-left">
                        {!imageError && activity.targetBook.urlPortada ? (
                            <img
                                src={activity.targetBook.urlPortada}
                                className="w-20 h-28 rounded-2xl object-cover shadow-lg"
                                alt={activity.targetBook.title || 'Libro'}
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="w-20 h-28 rounded-2xl shadow-lg bg-slate-200 flex items-center justify-center border border-slate-300">
                                <BookHeart size={32} className="text-slate-400" />
                            </div>
                        )}
                        <div className="flex-1 space-y-3">
                            <div className="flex items-center gap-2">
                                <div className={`p-1.5 rounded-lg ${isFinished ? 'bg-emerald-100 text-emerald-600' : 'bg-blue-100 text-blue-600'}`}>
                                    {isFinished ? <Check size={14} strokeWidth={3} /> : <BookOpen size={14} />}
                                </div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                    {isFinished ? 'Libro Terminado' : 'Nuevo en biblioteca'}
                                </p>
                            </div>
                            <p className="text-lg font-black text-slate-900 uppercase tracking-tighter leading-tight">{activity.targetBook.title || 'Libro Desconocido'}</p>
                            <p className="text-[10px] font-bold text-slate-500 uppercase">{activity.targetBook.author || 'Autor desconocido'}</p>
                        </div>
                    </div>
                );
            }
            case ActivityType.POST: {
                return (
                    <div className="space-y-4 bg-slate-50/50 p-6 rounded-[2.5rem] border border-slate-100 text-left">
                        {activity.content && (
                            <p className="text-sm font-medium text-slate-800 leading-relaxed whitespace-pre-wrap">{activity.content}</p>
                        )}
                        {activity.imageUrl && (
                            <div className="overflow-hidden rounded-[2rem] border border-white shadow-sm">
                                <img src={activity.imageUrl} alt="Post content" className="w-full h-auto object-cover" />
                            </div>
                        )}
                        {activity.targetBook && (
                            <div className="flex items-center gap-3 bg-white p-3 rounded-2xl border border-slate-100 w-fit shadow-sm">
                                {!imageError && activity.targetBook.urlPortada ? (
                                    <img src={activity.targetBook.urlPortada} className="w-10 h-14 object-cover rounded-lg bg-slate-100" alt="" onError={() => setImageError(true)} />
                                ) : (
                                    <div className="w-10 h-14 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center">
                                        <BookIcon size={18} className="text-slate-400" />
                                    </div>
                                )}
                                <div className="text-left pr-2">
                                    <p className="text-[11px] font-black text-slate-800 uppercase leading-none">{activity.targetBook.title || 'Libro Vinculado'}</p>
                                    <p className="text-[9px] text-slate-400 uppercase mt-1.5 font-bold">{activity.targetBook.author || 'Autor no disponible'}</p>
                                </div>
                            </div>
                        )}
                        {activity.pollOptions && activity.pollOptions.length > 0 && (
                            <div className="pt-2 space-y-2">
                                {activity.pollOptions.map((option, idx) => (
                                    <button key={idx} className="w-full text-left p-3 bg-white border border-slate-100 rounded-xl hover:border-teal-500 transition-all flex items-center justify-between group text-sm font-bold text-slate-700">
                                        <span>{option}</span>
                                        <Plus size={14} className="text-slate-300 group-hover:text-teal-500" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                );
            }
            default: return null;
        }
    };

    return (
        <div className="bg-white rounded-[2rem] p-8 shadow-sm border border-slate-100 space-y-6 transition-all relative">
            
            {showDeleteModal && (
                <div className="fixed inset-0 w-full h-full z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 overflow-hidden">
                    <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95 duration-300 relative">
                        <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-500 shadow-inner">
                            <AlertTriangle size={28} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 tracking-tight uppercase">¿Eliminar publicación?</h3>
                        <p className="text-slate-500 text-sm mb-10 leading-relaxed font-medium">
                            Estás a punto de borrar permanentemente esta actividad de tu feed.
                        </p>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => setShowDeleteModal(false)} 
                                className="flex-1 py-3 font-black text-slate-400 uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button 
                                onClick={confirmDelete} 
                                className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-slate-200 hover:bg-rose-600 hover:shadow-rose-100 transition-all"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <img src={activity.user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${activity.user?.id}`} className="w-12 h-12 rounded-[1.2rem] object-cover border-2 border-slate-50 shadow-sm" alt="" />
                    <div className="text-left">
                        <p className="text-xs font-black text-slate-900 uppercase tracking-tight">{activity.user?.fullName}</p>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">{timeAgo}</p>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <ActivityBadge type={activity.type} />
                    <div className="relative">
                        <button onClick={() => setShowMenu(!showMenu)} className={`p-2 rounded-xl transition-all ${showMenu ? 'bg-slate-100 text-slate-600' : 'text-slate-300 hover:text-slate-600'}`}>
                            <MoreHorizontal size={20} />
                        </button>

                        {showMenu && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)}></div>
                                <div className="absolute right-0 mt-2 w-56 bg-white rounded-3xl shadow-2xl border border-slate-100 z-20 p-2 animate-in zoom-in-95 duration-200 origin-top-right">

                                    {isOwner && activity.type === ActivityType.POST && (
                                        <>
                                            <button onClick={() => { setIsEditing(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors group text-left">
                                                <Edit2 size={18} className="text-slate-400 group-hover:text-teal-600" />
                                                <span className="text-sm font-bold">Editar publicación</span>
                                            </button>
                                            <button onClick={() => { setShowDeleteModal(true); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-rose-50 text-rose-500 transition-colors group text-left">
                                                <Trash2 size={18} />
                                                <span className="text-sm font-bold">Eliminar</span>
                                            </button>
                                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                        </>
                                    )}

                                    <button onClick={() => { navigate(`/profile/${activity.user.id}`); setShowMenu(false); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-slate-600 transition-colors group text-left">
                                        <UserCircle size={18} className="text-slate-400 group-hover:text-teal-600" />
                                        <span className="text-sm font-bold">Ver cuenta</span>
                                    </button>

                                    {!isOwner && (
                                        <>
                                            <div className="h-px bg-slate-100 my-1 mx-2"></div>
                                            <button onClick={() => { onIgnore(activity.id); setShowMenu(false); }}
                                                className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl hover:bg-slate-50 text-rose-500 transition-colors text-left font-bold text-sm">
                                                <EyeOff size={18} className="text-rose-500" />
                                                <span className="text-sm font-bold">No me interesa</span>
                                            </button>
                                        </>
                                    )}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>

            <div>{renderActivityContent()}</div>

            <div className="pt-4 border-t border-slate-50 flex items-center justify-between">
                <div className="flex gap-6">
                    <button onClick={() => onLike(activity.id)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activity.isLiked ? 'text-rose-500' : 'text-slate-400 hover:text-rose-500'}`}>
                        <Heart size={18} className={activity.isLiked ? 'fill-rose-500' : ''} />
                        {activity.likesCount || 0}
                    </button>
                    <button onClick={() => setShowComments(!showComments)} className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${showComments ? 'text-teal-600' : 'text-slate-400 hover:text-teal-600'}`}>
                        <MessageCircle size={18} />
                        {activity.commentsCount || 0}
                    </button>
                </div>
            </div>

            {showComments && (
                <div className="pt-6 border-t border-slate-50 space-y-4 animate-in fade-in slide-in-from-top-2">
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                        {activity.comments?.map(comment => (
                            <div key={comment.id} className="flex gap-3 text-left">
                                <img src={comment.user.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.user.id}`} className="w-8 h-8 rounded-full object-cover shrink-0" alt="" />
                                <div className="bg-slate-50 p-3 rounded-2xl flex-1 shadow-sm">
                                    <p className="text-[10px] font-black text-slate-900 uppercase">{comment.user.fullName}</p>
                                    <p className="text-xs font-medium text-slate-700 mt-1">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                        {(!activity.comments || activity.comments.length === 0) && (
                            <p className="text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest py-4">No hay comentarios todavía</p>
                        )}
                    </div>
                    <div className="flex gap-3 pt-2">
                        <img src={user?.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.id}`} className="w-8 h-8 rounded-full border border-slate-200 shrink-0" alt="" />
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={commentText}
                                onChange={(e) => setCommentText(e.target.value)}
                                onKeyPress={(e) => e.key === 'Enter' && handleSendComment()}
                                placeholder="Escribe un comentario..."
                                className="w-full bg-slate-50 border border-slate-100 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-1 focus:ring-teal-500/20 focus:bg-white transition-all"
                            />
                            <button onClick={handleSendComment} disabled={isSubmitting} className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-all active:scale-95 disabled:opacity-50">
                                {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};