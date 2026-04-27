import { useEffect, useState } from "react";
import api from "../../services/api";
import {
    User as UserIcon, BookCopy, Mail,
    CheckCircle, XCircle, ShieldAlert, Loader2,
    ExternalLink, AlertTriangle, Building2, MapPin, FileText, X, ShieldCheck, Trash2,
    Search, Filter, RotateCcw
} from "lucide-react";

export const AdminUserListView = () => {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    
    // FILTROS PRINCIPALES
    const [tabFilter, setTabFilter] = useState<'all' | 'pending'>('all');
    const [searchTerm, setSearchTerm] = useState(''); 
    const [roleFilter, setRoleFilter] = useState('all');
    const [statusFilter, setStatusFilter] = useState('all');

    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState<any | null>(null);
    const [showInfoModal, setShowInfoModal] = useState(false);
    const [infoUser, setInfoUser] = useState<any | null>(null);
    const [showApproveModal, setShowApproveModal] = useState(false);
    const [approveUser, setApproveUser] = useState<any | null>(null);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [rejectUser, setRejectUser] = useState<any | null>(null);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users-list');
            setUsers(res.data);
        } catch (error) {
            console.error("Error al cargar usuarios", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const openConfirmModal = (u: any) => { setSelectedUser(u); setShowConfirmModal(true); };
    const openInfoModal = (u: any) => { setInfoUser(u); setShowInfoModal(true); };
    const openApproveModal = (u: any) => { setApproveUser(u); setShowApproveModal(true); };
    const openRejectModal = (u: any) => { setRejectUser(u); setShowRejectModal(true); };

    const handleToggleStatus = async () => {
        if (!selectedUser) return;
        const id = selectedUser.id;
        setShowConfirmModal(false);
        setActionLoading(id);
        try {
            await api.patch(`/admin/toggle-status/${id}`);
            await fetchUsers();
        } catch { alert("Error"); }
        finally { setActionLoading(null); setSelectedUser(null); }
    };

    const confirmApprove = async () => {
        if (!approveUser) return;
        const id = approveUser.id;
        setShowApproveModal(false);
        setActionLoading(id);
        try {
            await api.patch(`/admin/verify-librero/${id}`);
            await fetchUsers();
        } catch { alert("Error"); }
        finally { setActionLoading(null); setApproveUser(null); }
    };

    const confirmReject = async () => {
        if (!rejectUser) return;
        const id = rejectUser.id;
        setShowRejectModal(false);
        setActionLoading(id);
        try {
            await api.delete(`/admin/reject-librero/${id}`);
            await fetchUsers();
        } catch { alert("Error"); }
        finally { setActionLoading(null); setRejectUser(null); }
    };

    // LÓGICA DE FILTRADO COMBINADO
    const filteredUsers = users.filter(u => {
        if (tabFilter === 'pending' && u.role !== 'librero_pendiente') return false;

        const searchLower = searchTerm.toLowerCase();
        const matchesSearch = 
            u.fullName?.toLowerCase().includes(searchLower) ||
            u.email?.toLowerCase().includes(searchLower) ||
            u.libraryName?.toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;

        if (tabFilter === 'all' && roleFilter !== 'all' && u.role !== roleFilter) return false;

        if (statusFilter === 'active' && u.isActive === false) return false;
        if (statusFilter === 'suspended' && u.isActive === true) return false;

        return true;
    });

    const resetFilters = () => {
        setSearchTerm('');
        setRoleFilter('all');
        setStatusFilter('all');
    };

    if (loading) return <div className="min-h-[400px] flex justify-center items-center"><Loader2 className="animate-spin text-teal-600" size={40} /></div>;

    return (
        <div className="py-8 animate-in fade-in duration-700 relative text-left px-4">
            
            {/* --- MODAL SUSPENDER --- */}
            {showConfirmModal && selectedUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowConfirmModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 border border-slate-100 text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 mx-auto ${selectedUser.isActive ? 'bg-rose-50 text-rose-500' : 'bg-emerald-50 text-emerald-500'}`}>
                            <AlertTriangle size={32} />
                        </div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">{selectedUser.isActive ? 'Suspender cuenta' : 'Reactivar cuenta'}</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">¿Seguro que quieres {selectedUser.isActive ? 'suspender' : 'reactivar'} la cuenta de <span className="font-bold text-slate-800">{selectedUser.fullName}</span>?</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={handleToggleStatus} className={`w-full py-4 rounded-2xl font-bold text-xs uppercase shadow-lg ${selectedUser.isActive ? 'bg-rose-500 text-white hover:bg-rose-600' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>Confirmar Acción</button>
                            <button onClick={() => setShowConfirmModal(false)} className="w-full py-4 rounded-2xl font-bold text-xs uppercase text-slate-400 hover:bg-slate-50">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL INFO --- */}
            {showInfoModal && infoUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setShowInfoModal(false)}></div>
                    <div className="bg-white rounded-[3rem] w-full max-w-lg p-10 shadow-2xl relative animate-in zoom-in-95 border border-slate-100 overflow-hidden">
                        <button onClick={() => setShowInfoModal(false)} className="absolute top-6 right-6 p-2 text-slate-300 hover:text-slate-600"><X size={24} /></button>
                        <div className="flex items-center gap-5 mb-10 text-left">
                            <div className="w-16 h-16 rounded-2xl bg-teal-50 flex items-center justify-center text-teal-600 border border-teal-100"><Building2 size={32} /></div>
                            <div><h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight leading-none">Datos de la Librería</h3><p className="text-slate-400 text-xs font-bold uppercase mt-1">Verificación manual</p></div>
                        </div>
                        <div className="space-y-6">
                            <div><label className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 block ml-1">Representante</label><div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-bold">{infoUser.fullName}</div></div>
                            <div><label className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 block ml-1">Nombre Comercial</label><div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-bold">{infoUser.libraryName || 'No especificado'}</div></div>
                            <div><label className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-1 block ml-1">Ubicación</label><div className="flex items-start gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-100 text-slate-700 font-medium italic"><MapPin size={18} className="text-slate-400 mt-0.5" />{infoUser.libraryAddress || 'Sin dirección'}</div></div>
                            <div className="pt-4 border-t border-slate-50">
                                {infoUser.document ? (
                                    <button onClick={() => window.open(`http://localhost:3000/${infoUser.document.replace(/\\/g, '/')}`, '_blank')} className="w-full group flex items-center justify-between p-5 bg-teal-600 rounded-3xl text-white hover:bg-teal-700 shadow-xl shadow-teal-600/20 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="bg-white/20 p-2.5 rounded-xl"><FileText size={24} /></div>
                                            <div className="text-left"><p className="font-semibold text-sm uppercase tracking-tight">Ver Licencia PDF</p><p className="text-teal-100 text-[10px] italic">Abrir en pestaña nueva</p></div>
                                        </div>
                                        <ExternalLink size={20} className="opacity-50 group-hover:opacity-100" />
                                    </button>
                                ) : (
                                    <div className="p-8 bg-rose-50 rounded-3xl border border-dashed border-rose-200 text-center text-rose-600 font-bold text-xs uppercase">Sin documento adjunto</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL APROBAR --- */}
            {showApproveModal && approveUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowApproveModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 border border-slate-100 text-center">
                        <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mb-6 mx-auto"><ShieldCheck size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Validar Librería</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">¿Confirmas que has revisado los datos de <span className="font-bold text-slate-800">{approveUser.libraryName}</span> y quieres darle acceso oficial?</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={confirmApprove} className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-emerald-700 shadow-lg">Aprobar Comercio</button>
                            <button onClick={() => setShowApproveModal(false)} className="w-full py-4 rounded-2xl font-bold text-xs uppercase text-slate-400 hover:bg-slate-50">Volver atrás</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- MODAL RECHAZAR --- */}
            {showRejectModal && rejectUser && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRejectModal(false)}></div>
                    <div className="bg-white rounded-[2.5rem] w-full max-w-sm p-8 shadow-2xl relative animate-in zoom-in-95 border border-slate-100 text-center text-left">
                        <div className="w-16 h-16 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mb-6 mx-auto"><Trash2 size={32} /></div>
                        <h3 className="text-xl font-black text-slate-900 mb-2 uppercase tracking-tight">Rechazar Solicitud</h3>
                        <p className="text-sm text-slate-500 mb-8 leading-relaxed">Eliminarás permanentemente la solicitud de <span className="font-bold text-slate-800">{rejectUser.fullName}</span>. Esta acción es irreversible.</p>
                        <div className="flex flex-col gap-3">
                            <button onClick={confirmReject} className="w-full py-4 bg-rose-600 text-white rounded-2xl font-bold text-xs uppercase hover:bg-rose-700">Eliminar Solicitud</button>
                            <button onClick={() => setShowRejectModal(false)} className="w-full py-4 rounded-2xl font-bold text-xs uppercase text-slate-400 hover:bg-slate-50">Cancelar</button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CABECERA PRINCIPAL --- */}
            <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight leading-none mb-3 italic">Admin<span className="text-teal-600 font-serif">Mark</span></h2>
                    <div className="flex items-center gap-3">
                        <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Gestión de comunidad</p>
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full text-[10px] font-black">{filteredUsers.length} Usuarios</span>
                    </div>
                </div>
                
                <div className="flex bg-white p-1.5 rounded-[1.5rem] border border-slate-100 shadow-sm">
                    <button onClick={() => { setTabFilter('all'); resetFilters(); }} className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tabFilter === 'all' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Todos</button>
                    <button onClick={() => { setTabFilter('pending'); resetFilters(); }} className={`px-6 py-2.5 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${tabFilter === 'pending' ? 'bg-amber-500 text-white shadow-xl' : 'text-slate-400 hover:text-slate-600'}`}>Pendientes</button>
                </div>
            </header>

            <div className="mb-6 grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Buscador */}
                <div className="md:col-span-5 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-teal-500 transition-colors" size={20} />
                    <input 
                        type="text" 
                        placeholder="Buscar por nombre, email o librería..."
                        className="w-full pl-12 pr-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-sm font-semibold text-slate-700 shadow-sm focus:outline-none focus:border-teal-500 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                {/* Filtro por Rol */}
                {tabFilter === 'all' && (
                    <div className="md:col-span-2 relative">
                        <select 
                            className="w-full appearance-none px-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-xs font-bold uppercase text-slate-500 focus:outline-none focus:border-teal-500 shadow-sm cursor-pointer"
                            value={roleFilter}
                            onChange={(e) => setRoleFilter(e.target.value)}
                        >
                            <option value="all">Cualquier Rol</option>
                            <option value="user">Lectores</option>
                            <option value="librero">Librerías</option>
                            <option value="admin">Administradores</option>
                        </select>
                        <Filter className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                    </div>
                )}

                {/* Filtro por Estado */}
                <div className="md:col-span-2 relative">
                    <select 
                        className="w-full appearance-none px-4 py-4 bg-white border border-slate-100 rounded-[1.5rem] text-xs font-bold uppercase text-slate-500 focus:outline-none focus:border-teal-500 shadow-sm cursor-pointer"
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                    >
                        <option value="all">Todos los Estados</option>
                        <option value="active">Activos</option>
                        <option value="suspended">Suspendidos</option>
                    </select>
                    <ShieldAlert className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-300 pointer-events-none" size={16} />
                </div>

                {/* Botón Reset */}
                <button 
                    onClick={resetFilters}
                    className="md:col-span-1 flex items-center justify-center bg-slate-50 hover:bg-slate-100 text-slate-400 rounded-[1.5rem] border border-slate-100 transition-all group"
                    title="Limpiar filtros"
                >
                    <RotateCcw size={20} className="group-hover:rotate-[-45deg] transition-transform" />
                </button>
            </div>

            {/* --- TABLA PRINCIPAL --- */}
            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50/50 border-b border-slate-100">
                        <tr>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Usuario / Establecimiento</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Libros</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">Rol / Status</th>
                            <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Control</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {filteredUsers.length > 0 ? (
                            filteredUsers.map(u => (
                                <tr key={u.id} className={`hover:bg-teal-50/20 transition-colors group ${u.isActive === false ? 'opacity-50 grayscale-[0.5]' : ''}`}>
                                    <td className="px-8 py-5">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="w-12 h-12 rounded-2xl bg-teal-100 flex items-center justify-center text-teal-700 font-bold border-2 border-white shadow-sm overflow-hidden flex-shrink-0 transition-transform group-hover:scale-110">
                                                {u.avatarUrl ? <img src={u.avatarUrl} className="w-full h-full object-cover" alt="" /> : <UserIcon size={20} />}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="font-bold text-slate-800 truncate leading-tight mb-0.5">{u.fullName}</p>
                                                <div className="flex items-center gap-1 text-slate-400 font-bold text-[10px] uppercase truncate"><Mail size={10} /> {u.email}</div>
                                                {u.libraryName && <p className="text-[10px] text-teal-600 font-black mt-1 uppercase tracking-tight">🏠 {u.libraryName}</p>}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5 text-center">
                                        <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-50 text-slate-600 rounded-xl text-xs font-bold border border-slate-100 group-hover:bg-white transition-all">
                                            <BookCopy size={12} className="text-teal-600" /> {u.booksCount || 0}
                                        </span>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col gap-1.5 text-left">
                                            <span className={`w-fit px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${
                                                u.role === 'admin' ? 'bg-red-100 text-red-700' :
                                                u.role === 'librero_pendiente' ? 'bg-amber-100 text-amber-700 animate-pulse' :
                                                u.role === 'librero' ? 'bg-emerald-100 text-emerald-700' : 
                                                'bg-cyan-100 text-cyan-700'
                                            }`}>{u.role.replace('_', ' ')}</span>
                                            {!u.isActive && <span className="text-[9px] text-rose-500 font-bold uppercase flex items-center gap-1"><ShieldAlert size={10} /> Suspendido</span>}
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <div className="flex justify-end gap-2">
                                            {(u.role === 'librero' || u.role === 'librero_pendiente') && (
                                                <button onClick={() => openInfoModal(u)} className="p-2.5 rounded-xl border border-slate-100 text-slate-400 hover:bg-white hover:text-teal-600 hover:border-teal-200 shadow-sm transition-all">
                                                    <ExternalLink size={18} />
                                                </button>
                                            )}
                                            {u.role === 'librero_pendiente' && (
                                                <>
                                                    <button onClick={() => openApproveModal(u)} disabled={actionLoading === u.id} className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase hover:bg-teal-700 shadow-md">
                                                        {actionLoading === u.id ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle size={14} />} Aprobar
                                                    </button>
                                                    <button onClick={() => openRejectModal(u)} disabled={actionLoading === u.id} className="p-2.5 rounded-xl border border-rose-100 text-rose-400 hover:bg-rose-600 hover:text-white transition-all shadow-sm">
                                                        <Trash2 size={18} />
                                                    </button>
                                                </>
                                            )}
                                            {u.role !== 'admin' && u.role !== 'librero_pendiente' && (
                                                <button onClick={() => openConfirmModal(u)} disabled={actionLoading === u.id} className={`p-2.5 rounded-xl border transition-all ${u.isActive ? 'border-slate-100 text-slate-400 hover:bg-rose-50 hover:text-rose-500 hover:border-rose-200' : 'border-emerald-100 bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`}>
                                                    {u.isActive ? <XCircle size={18} /> : <CheckCircle size={18} />}
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={4} className="py-20 text-center">
                                    <div className="flex flex-col items-center gap-3">
                                        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-200"><Search size={32} /></div>
                                        <p className="text-slate-400 font-bold uppercase text-xs tracking-widest">No se han encontrado usuarios con esos criterios</p>
                                        <button onClick={resetFilters} className="text-teal-600 font-black text-[10px] uppercase underline decoration-2 underline-offset-4">Limpiar búsqueda</button>
                                    </div>
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};