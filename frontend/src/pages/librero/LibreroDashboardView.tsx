import { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { MapPin, Phone, Clock, Plus, Package, Loader2, X } from 'lucide-react';
import { Link } from 'react-router-dom';

export const LibreroDashboardView = () => {
    const { user, updateUser } = useAuth();
    const [stats, setStats] = useState({ totalBooks: 0, activeEvents: 0, recentViews: 0 });
    const [loading, setLoading] = useState(true);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editData, setEditData] = useState({
        libraryPhone: user?.libraryPhone || '',
        librarySchedule: user?.librarySchedule || ''
    });

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/librero/stats');
                setStats(res.data);
            } catch (error) {
                console.error("Error stats", error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await api.patch('/librero/profile', editData);
            updateUser({ ...user, ...res.data });
            setShowEditModal(false);
        } catch {
            console.error("Error al actualizar el perfil del librero");
            alert("Error al actualizar los datos de la tienda");
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

    return (
        <div className="py-8 animate-in fade-in duration-700 text-left px-4">

            {showEditModal && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setShowEditModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-md p-8 shadow-2xl relative animate-in zoom-in-95 border-8 border-white">
                        <button onClick={() => setShowEditModal(false)} className="absolute top-6 right-6 text-slate-400 hover:text-slate-600 transition-colors"><X size={20} /></button>
                        <h3 className="text-xl font-black text-slate-900 mb-6 uppercase tracking-tighter">Datos de la Tienda</h3>
                        <form onSubmit={handleUpdateProfile} className="space-y-4">
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Teléfono de contacto</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-teal-500 font-semibold"
                                    value={editData.libraryPhone}
                                    onChange={e => setEditData({ ...editData, libraryPhone: e.target.value })}
                                    placeholder="Ej: +34 600 000 000"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] font-bold text-slate-400 uppercase ml-2 tracking-widest">Horario comercial</label>
                                <input
                                    type="text"
                                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:outline-none focus:border-teal-500 font-semibold"
                                    value={editData.librarySchedule}
                                    onChange={e => setEditData({ ...editData, librarySchedule: e.target.value })}
                                    placeholder="Ej: Lun-Vie: 10:00 - 20:00"
                                />
                            </div>
                            <button type="submit" className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-teal-700 transition-all shadow-lg">Guardar cambios</button>
                        </form>
                    </div>
                </div>
            )}

            {/* --- HEADER --- */}
            <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-2 italic">
                        ¡Hola, <span className="text-teal-600 font-serif font-normal">{user?.fullName.split(' ')[0]}</span>!
                    </h2>
                    <p className="text-slate-500 font-medium text-sm">Gestionas <span className="font-bold text-slate-700">{user?.libraryName}</span></p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-teal-600 shadow-lg transition-all">
                    <Plus size={18} /> Nuevo Evento
                </button>
            </header>

            {/* --- STATS --- */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5">
                    <div className="w-14 h-14 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600"><Package size={28} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Catálogo</p>
                        <p className="text-2xl font-black text-slate-900">{stats.totalBooks} Libros</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 opacity-50">
                    <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-600"><Clock size={28} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Eventos</p>
                        <p className="text-2xl font-black text-slate-900">{stats.activeEvents} Activos</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex items-center gap-5 opacity-50">
                    <div className="w-14 h-14 rounded-2xl bg-sky-50 flex items-center justify-center text-sky-600"><Plus size={28} /></div>
                    <div>
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Visitas</p>
                        <p className="text-2xl font-black text-slate-900">{stats.recentViews}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* --- PERFIL --- */}
                <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-6">Tu Establecimiento</h3>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3 text-left">
                                <MapPin className="text-teal-600 flex-shrink-0" size={18} />
                                <p className="text-sm text-slate-600 font-medium italic leading-snug">{user?.libraryAddress}</p>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <Phone className="text-teal-600" size={18} />
                                <p className="text-sm text-slate-600 font-bold">{user?.libraryPhone || 'Sin teléfono'}</p>
                            </div>
                            <div className="flex items-center gap-3 text-left">
                                <Clock className="text-teal-600" size={18} />
                                <p className="text-sm text-slate-600 font-bold">{user?.librarySchedule || 'Horario no definido'}</p>
                            </div>
                        </div>
                        <button onClick={() => setShowEditModal(true)} className="w-full mt-8 py-3 bg-slate-50 text-slate-400 rounded-2xl font-bold text-[10px] uppercase border border-dashed border-slate-200 hover:text-teal-600 hover:bg-teal-50 transition-all">
                            Editar Información
                        </button>
                    </div>
                </div>

                {/* --- ACCESO AL CATÁLOGO --- */}
                <div className="lg:col-span-8 space-y-6">
                    <div className="bg-gradient-to-br from-teal-600 to-emerald-700 p-8 rounded-[3rem] shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="text-left">
                            <h3 className="text-2xl font-black mb-2 uppercase tracking-tighter">Gestionar Catálogo</h3>
                            <p className="opacity-80 text-sm">Tienes {stats.totalBooks} libros publicados actualmente.</p>
                        </div>
                        <Link to="/librero/events" className="px-8 py-4 bg-white text-teal-700 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:scale-105 transition-transform flex items-center gap-2">
                             <Plus size={18} /> Nuevo Evento
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};