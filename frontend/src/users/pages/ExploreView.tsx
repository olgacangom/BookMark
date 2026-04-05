import { useEffect, useState } from 'react';
import api from '../../services/api';
import { UserCard } from '../components/UserCard';
import { Search, Loader2, Users } from 'lucide-react'; // Añadimos Users para el icono
import { useAuth } from '../../context/AuthContext';

export const ExploreView = () => {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await api.get('/users');
                const others = data
                    .filter((u: any) => u.id !== currentUser?.id)
                    .map((u: any) => {
                        const myRel = u.followerRelations?.find(
                            (f: any) => f.followerId === currentUser?.id || f.follower?.id === currentUser?.id
                        );
                        return {
                            ...u,
                            followStatus: myRel ? myRel.status : null
                        };
                    });
                setUsers(others);
            } catch (error) {
                console.error("Error cargando usuarios", error);
            } finally {
                setLoading(false);
            }
        };
        fetchUsers();
    }, [currentUser]);

    const filteredUsers = users.filter((u: any) =>
        u.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return (
        <div className="flex h-[60vh] items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary/60" />
        </div>
    );

    return (
        /* Unificamos el padding y el max-width con RequestsView */
        <div className="max-w-6xl mx-auto px-4 py-10 animate-in fade-in duration-500 pb-24">
            
            {/* Cabecera Unificada (Igual que RequestsView) */}
            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <Users className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-[#564e4e] tracking-tight">Explorar</h1>
                    <p className="text-sm text-muted-foreground font-medium">Encuentra nuevas perspectivas de lectura</p>
                </div>
            </div>

            {/* Barra de Búsqueda Estilizada */}
            <div className="mb-10">
                <div className="relative max-w-md">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre o usuario..."
                        className="w-full bg-white border border-border rounded-2xl py-3 pl-12 pr-4 focus:ring-4 focus:ring-primary/5 focus:border-primary/40 outline-none transition-all text-sm font-medium placeholder:text-muted-foreground/50 shadow-sm"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Grid de Usuarios */}
            {filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredUsers.map((u) => (
                        <UserCard key={u.id} user={u} />
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-white/50 rounded-[3rem] border border-dashed border-slate-200 flex flex-col items-center">
                    <div className="bg-slate-100 p-4 rounded-full mb-4">
                        <Users className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="text-sm text-muted-foreground font-bold italic">
                        No se han encontrado lectores con ese nombre...
                    </p>
                </div>
            )}
        </div>
    );
};