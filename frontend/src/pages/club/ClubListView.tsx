import { useEffect, useState, useCallback, useMemo } from "react";
import {
    Plus, Users2, X, Loader2,
    Trash2, AlertTriangle, Search,
    Sparkles, Star, Rocket
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Club, clubsService } from "../../club/service/club.service";
import { useAuth } from "../../context/AuthContext";

const ConfirmDeleteModal = ({ isOpen, title, onClose, onConfirm }: any) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4 animate-in fade-in duration-300">
            <div className="bg-white rounded-[2.5rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 text-center animate-in zoom-in-95">
                <div className="w-14 h-14 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500">
                    <AlertTriangle size={24} />
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">¿Eliminar club?</h3>
                <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                    Estás a punto de borrar <span className="font-bold text-slate-800">"{title}"</span>.
                </p>
                <div className="flex gap-3">
                    <button onClick={onClose} className="flex-1 py-3 font-black text-slate-400 hover:text-slate-600 transition-colors uppercase text-[10px] tracking-widest">Cancelar</button>
                    <button onClick={onConfirm} className="flex-1 py-3 bg-slate-900 text-white rounded-2xl font-black shadow-lg hover:bg-rose-600 transition-all uppercase text-[10px] tracking-widest">Eliminar</button>
                </div>
            </div>
        </div>
    );
};

export const ClubsListView = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [clubs, setClubs] = useState<Club[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const [showModal, setShowModal] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [newClub, setNewClub] = useState({ name: '', description: '' });

    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: '', name: '' });

    const fetchClubs = useCallback(async () => {
        setLoading(true);
        try {
            const data = await clubsService.getClubs();
            setClubs(data);
        } catch (error) {
            console.error("Error al cargar clubes:", error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchClubs(); }, [fetchClubs]);

    const handleCreateClub = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsCreating(true);
        try {
            await clubsService.createClub(newClub);
            setShowModal(false);
            setNewClub({ name: '', description: '' });
            fetchClubs();
        } catch (error) {
            console.error("Error al crear club:", error);
        } finally {
            setIsCreating(false);
        }
    };

    const handleConfirmDelete = async () => {
        try {
            await clubsService.deleteClub(deleteModal.id);
            setDeleteModal({ ...deleteModal, isOpen: false });
            fetchClubs();
        } catch { alert("No se pudo eliminar"); }
    };

    const getClubIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('harry') || n.includes('potter')) return <Sparkles size={28} />;
        if (n.includes('narnia')) return <Rocket size={28} />;
        if (n.includes('star') || n.includes('wars')) return <Star size={28} />;
        return <Users2 size={28} />;
    };

    const filteredClubs = useMemo(() => {
        return clubs.filter(c =>
            c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            c.description?.toLowerCase().includes(searchTerm.toLowerCase())
        );
    }, [clubs, searchTerm]);

    return (
        <div className="min-h-screen bg-[#F8FAFB] font-sans text-slate-900 pb-24 text-left animate-in fade-in duration-500">           
            <header className="max-w-7xl mx-auto px-8 mb-10 flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 tracking-tight leading-none uppercase italic">
                        Clubs de <span className="text-teal-600 font-serif">Lectura.</span>
                    </h1>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mt-3">Comunidades activas</p>
                </div>
                <button 
                    onClick={() => setShowModal(true)}
                    className="bg-slate-900 text-white px-8 py-3.5 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-teal-600 transition-all shadow-xl active:scale-95 flex items-center gap-2"
                >
                    <Plus size={16} strokeWidth={3} /> Fundar club
                </button>
            </header>

             {/* BARRA DE BÚSQUEDA */}
            <div className="relative z-5 px-4 py-3 bg-white/50 backdrop-blur-md border-b border-slate-100 mb-8">
                <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="relative flex-1 w-full max-w-2xl group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-teal-600 transition-colors" size={20} />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o temática del club..."
                            className="w-full bg-white border border-slate-200 rounded-2xl py-4 pl-14 pr-6 text-sm shadow-sm focus:ring-4 focus:ring-teal-500/5 focus:border-teal-500/20 transition-all outline-none font-medium placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                        {searchTerm && (
                            <button 
                                onClick={() => setSearchTerm('')}
                                className="absolute right-4 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-100 rounded-full text-slate-400 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-8">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-32 gap-4">
                        <Loader2 className="animate-spin text-teal-600" size={40} />
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredClubs.map((club) => {
                            const memberCount = club.members?.length || 0;
                                                        
                            const displayMembers = club.members?.slice(0, 4) || [];

                            return (
                                <div
                                    key={club.id}
                                    onClick={() => navigate(`/clubs/${club.id}`)}
                                    className="bg-white rounded-[2.5rem] overflow-hidden border border-slate-100 shadow-sm hover:shadow-2xl transition-all duration-500 group cursor-pointer relative"
                                >
                                    <div className="h-44 w-full relative">
                                        <img
                                            src={club.coverUrl || `https://picsum.photos/seed/${club.id}/600/400`}
                                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                                            alt=""
                                        />
                                        <div className="absolute inset-0 bg-slate-900/20" />
                                    </div>

                                    <div className="absolute top-32 left-1/2 -translate-x-1/2 w-20 h-20 bg-white rounded-full border-[6px] border-white shadow-xl flex items-center justify-center text-slate-800 z-10 group-hover:text-teal-600 transition-colors">
                                        {getClubIcon(club.name)}
                                    </div>

                                    <div className="p-8 pt-12 text-center">
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2 group-hover:text-teal-600 transition-colors">
                                            {club.name}
                                        </h3>
                                        <p className="text-slate-400 text-xs italic font-medium mb-8 px-4 line-clamp-1 italic">
                                            "{club.description}"
                                        </p>

                                        <div className="flex items-center justify-center gap-8 mb-8">
                                            <div className="flex flex-col items-center">
                                                <span className="flex items-center gap-1.5 text-slate-400 font-bold text-[10px] uppercase tracking-widest mb-1">
                                                    <Users2 size={14} /> {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
                                                </span>
                                            </div>
                                        </div>

                                        <div className="flex justify-center -space-x-2 mb-8 h-8">
                                            {displayMembers.map((m) => (
                                                <img
                                                    key={m.id}
                                                    className="w-8 h-8 rounded-full border-2 border-white object-cover bg-slate-100 shadow-sm"
                                                    src={m.avatarUrl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.id}`}
                                                    alt="avatar"
                                                />
                                            ))}
                                            {memberCount > 4 && (
                                                <div className="w-8 h-8 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-slate-400">
                                                    +{memberCount - 4}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex gap-2">
                                            <button className="flex-1 py-3.5 border-2 border-slate-200 text-slate-700 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:border-teal-500 hover:text-teal-600 transition-all">
                                                Entrar al club
                                            </button>
                                            {user && club.creator?.id === user.id && (
                                                <button 
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteModal({ isOpen: true, id: club.id, name: club.name });
                                                    }}
                                                    className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </main>

            {/* MODAL DE CREACIÓN */}
            {showModal && (
                <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-md animate-in fade-in" onClick={() => setShowModal(false)} />
                    <form onSubmit={handleCreateClub} className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl relative animate-in zoom-in-95 border-8 border-white text-left">
                        <button type="button" onClick={() => setShowModal(false)} className="absolute top-8 right-8 text-slate-300 hover:text-slate-900 transition-colors"><X size={24} /></button>
                        <div className="w-16 h-16 bg-teal-50 rounded-2xl flex items-center justify-center text-teal-600 mb-6"><Plus size={32} strokeWidth={3}/></div>
                        <h3 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight italic">Fundar un Club</h3>
                        <div className="space-y-6 mt-8">
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Nombre</label>
                                <input required value={newClub.name} onChange={e => setNewClub({ ...newClub, name: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 focus:bg-white focus:ring-4 focus:ring-teal-500/5 outline-none transition-all" placeholder="Ej: Lectores de Narnia" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-4 mb-2 block">Descripción</label>
                                <textarea required value={newClub.description} onChange={e => setNewClub({ ...newClub, description: e.target.value })} className="w-full bg-slate-50 border-none rounded-2xl px-6 py-4 text-sm font-medium text-slate-600 focus:bg-white focus:ring-4 focus:ring-teal-500/5 outline-none transition-all resize-none" placeholder="¿De qué trata este club?" rows={3} />
                            </div>
                        </div>
                        <button type="submit" disabled={isCreating} className="w-full mt-10 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-teal-600 transition-all shadow-xl disabled:opacity-50">
                            {isCreating ? <Loader2 className="animate-spin mx-auto" size={18} /> : "Crear comunidad"}
                        </button>
                    </form>
                </div>
            )}

            <ConfirmDeleteModal 
                isOpen={deleteModal.isOpen} 
                title={deleteModal.name} 
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })} 
                onConfirm={handleConfirmDelete} 
            />
        </div>
    );
};