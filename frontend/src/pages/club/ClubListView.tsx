import { useEffect, useState } from "react";
import { Plus, ChevronRight, Users2, X, Loader2, BookOpen, Trash2, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Club, clubsService } from "../../club/service/club.service";
import { useAuth } from "../../context/AuthContext";

interface DeleteModalProps {
    isOpen: boolean;
    title: string;
    onClose: () => void;
    onConfirm: () => void;
}

const ConfirmDeleteModal = ({ isOpen, title, onClose, onConfirm }: DeleteModalProps) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2 tracking-tight uppercase">¿Eliminar comunidad?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed px-2">
                    Estás a punto de borrar el club <span className="font-bold text-slate-800 italic">"{title}"</span>. Esta acción no se puede deshacer.
                </p>
                <div className="flex gap-3">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-3 font-bold text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest"
                    >
                        Cancelar
                    </button>
                    <button 
                        onClick={onConfirm} 
                        className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-bold shadow-lg hover:bg-rose-600 transition-all uppercase text-[10px] tracking-widest"
                    >
                        Eliminar
                    </button>
                </div>
            </div>
        </div>
    );
};

export const ClubsListView = () => {
    const { user } = useAuth();
    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newClub, setNewClub] = useState({ name: '', description: '' });
    
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', name: '' });

    const navigate = useNavigate();

    const fetchClubs = async () => {
        setLoading(true);
        try {
            const data = await clubsService.getClubs();
            setClubs(data);
        } catch (error) {
            console.error("Error al cargar clubes:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClubs();
    }, []);

    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await clubsService.createClub(newClub);
            setShowModal(false);
            setNewClub({ name: '', description: '' });
            fetchClubs();
        } catch (error) {
            console.error(error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteClick = (e: React.MouseEvent, clubId: string, clubName: string) => {
        e.stopPropagation();
        setDeleteModal({ isOpen: true, id: clubId, name: clubName });
    };

    const handleConfirmDelete = async () => {
        try {
            await clubsService.deleteClub(deleteModal.id);
            setDeleteModal({ ...deleteModal, isOpen: false });
            fetchClubs();
        } catch (error) {
            console.error("Error al borrar el club:", error);
            alert("No se pudo eliminar el club");
        }
    };

    return (
        <div className="min-h-screen bg-[#F0F9F9] pb-24">
            <header className="max-w-7xl mx-auto px-6 pt-12 pb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-4xl font-black tracking-tighter text-slate-900">
                            Clubes de <span className="text-teal-600 italic font-serif">Lectura.</span>
                        </h1>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mt-2">Comunidades activas</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="flex items-center justify-center gap-3 px-8 py-4 bg-slate-900 text-white rounded-[1.8rem] font-bold text-xs uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/10 active:scale-95"
                    >
                        <Plus size={18} /> Fundar Club
                    </button>
                </div>
            </header>

            <main className="max-w-7xl mx-auto px-6">
                {loading ? (
                    <div className="flex flex-col items-center justify-center p-20 gap-4">
                        <Loader2 className="animate-spin text-teal-600" size={32} />
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Sincronizando estanterías...</p>
                    </div>
                ) : clubs.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in zoom-in-95 duration-500">
                        {clubs.map((club) => (
                            <div 
                                key={club.id} 
                                onClick={() => navigate(`/clubs/${club.id}`)} 
                                className="bg-white rounded-[2.5rem] p-8 border border-white shadow-xl shadow-slate-200/60 hover:shadow-2xl transition-all group cursor-pointer relative overflow-hidden"
                            >
                                <div className="relative z-10">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 shadow-inner group-hover:bg-teal-600 group-hover:text-white transition-all duration-500">
                                            <Users2 size={32} />
                                        </div>

                                        <div className="flex gap-2 items-center">
                                            {user && club.creator?.id === user.id && (
                                                <button
                                                    onClick={(e) => handleDeleteClick(e, club.id, club.name)}
                                                    className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all"
                                                    title="Eliminar club"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                            <div className="flex flex-col items-end">
                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Lectores</span>
                                                <span className="text-lg font-black text-slate-900">{club.members?.length || 0}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-black text-slate-900 mb-3 uppercase tracking-tight leading-tight group-hover:text-teal-600 transition-colors">
                                        {club.name}
                                    </h3>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed mb-8 line-clamp-2 italic">
                                        "{club.description || 'Comunidad dedicada a la lectura compartida.'}"
                                    </p>

                                    <div className="flex items-center justify-between pt-6 border-t border-slate-50">
                                        <div className="flex -space-x-3">
                                            {[1, 2, 3].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-xl border-2 border-white bg-slate-100 overflow-hidden shadow-sm">
                                                    <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${club.id + i}`} alt="" />
                                                </div>
                                            ))}
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-300 font-bold text-[10px] uppercase tracking-widest group-hover:text-teal-600 transition-colors">
                                            Entrar <ChevronRight size={16} />
                                        </div>
                                    </div>
                                </div>
                                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-teal-500/5 rounded-full blur-3xl group-hover:bg-teal-500/10 transition-all" />
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white/40 rounded-[4rem] border-2 border-dashed border-slate-200">
                        <BookOpen className="w-16 h-16 text-slate-200 mx-auto mb-4" />
                        <p className="text-slate-400 font-black uppercase text-xs tracking-[0.3em]">El estante está vacío</p>
                        <p className="text-slate-300 text-[10px] mt-2 font-bold uppercase tracking-widest">Sé el primero en crear una comunidad</p>
                    </div>
                )}
            </main>

            {/* MODAL DE CREACIÓN */}
            {showModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in duration-300" onClick={() => setShowModal(false)} />
                    <form onSubmit={handleCreateClub} className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 duration-300 border border-white">
                        <button type="button" onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors">
                            <X size={24} />
                        </button>
                        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-8">
                            <Plus size={32} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 mb-2 uppercase tracking-tight">Fundar un Club</h3>
                        <div className="space-y-6 mt-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Nombre del Club</label>
                                <input required value={newClub.name} onChange={e => setNewClub({ ...newClub, name: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-inner" placeholder="Ej: Lectores de Fantasía" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Descripción</label>
                                <textarea required value={newClub.description} onChange={e => setNewClub({ ...newClub, description: e.target.value })} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-sm font-medium text-slate-600 focus:bg-white focus:border-teal-500 outline-none transition-all shadow-inner resize-none" placeholder="¿Qué libros leeréis?" rows={3} />
                            </div>
                        </div>
                        <button type="submit" disabled={isCreating} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl shadow-slate-900/20 active:scale-[0.98] flex items-center justify-center gap-3">
                            {isCreating ? <Loader2 className="animate-spin" size={18} /> : "Crear Club"}
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL DE BORRADO */}
            <ConfirmDeleteModal 
                isOpen={deleteModal.isOpen}
                title={deleteModal.name}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleConfirmDelete}
            />
        </div>
    );
};