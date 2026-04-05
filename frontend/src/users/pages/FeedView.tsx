import { useState, useEffect } from 'react';
import { activityService, Activity } from '../services/activity.service';
import { Loader2, Coffee, RefreshCw, BluetoothConnected } from 'lucide-react';
import { ActivityCard } from '../components/ActivityCard';

export const FeedView = () => {
    const [activities, setActivities] = useState<Activity[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const fetchFeed = async () => {
        try {
            setLoading(true);
            setError(false);
            const data = await activityService.getFeed();
            setActivities(data);
        } catch (err) {
            console.error("Error al cargar el feed:", err);
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeed();
    }, []);


    return (
        <div className="max-w-2xl mx-auto px-4 py-8 pb-24 animate-in fade-in duration-500">

            <div className="flex items-center gap-4 mb-10">
                <div className="p-3 bg-primary/10 rounded-2xl">
                    <BluetoothConnected className="w-6 h-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-black text-[#564e4e] tracking-tight">Comunidad</h1>
                    <p className="text-sm text-muted-foreground font-medium">Actividad reciente de tus seguidos</p>
                </div>
            

                <button
                    onClick={fetchFeed}
                    disabled={loading}
                    aria-label="Actualizar feed"
                    className="p-2.5 bg-white border border-[#9b8b7e]/20 rounded-xl text-[#9b8b7e] hover:text-primary transition-all active:scale-95 disabled:opacity-50"
                >
                    <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>


            {loading && activities.length === 0 && (
                <div className="flex flex-col items-center justify-center py-20">
                    <Loader2 className="w-10 h-10 animate-spin text-primary/40" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#9b8b7e]/60 mt-4">
                        Buscando novedades...
                    </p>
                </div>
            )}

            {!loading && error && (
                <div className="text-center py-12 bg-red-50 rounded-[2.5rem] border border-red-100">
                    <p className="text-red-600 font-black text-sm uppercase tracking-widest">Error al conectar</p>
                    <button
                        onClick={fetchFeed}
                        className="mt-4 px-6 py-2 bg-red-600 text-white rounded-xl font-bold text-xs shadow-lg shadow-red-200"
                    >
                        Reintentar
                    </button>
                </div>
            )}

            {/* 3. Feed Vacío */}
            {!loading && !error && activities.length === 0 && (
                <div className="text-center py-20 bg-[#e8e4e0]/50 rounded-[3rem] border-2 border-dashed border-[#9b8b7e]/20">
                    <div className="bg-white w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <Coffee className="w-8 h-8 text-[#9b8b7e]/40" />
                    </div>
                    <h3 className="font-black text-[#564e4e] uppercase text-sm tracking-widest">Silencio absoluto</h3>
                    <p className="text-xs text-[#9b8b7e] max-w-[220px] mx-auto mt-2 font-bold leading-relaxed">
                        Parece que nadie ha leído nada últimamente. ¡Sigue a más gente para animar esto!
                    </p>
                </div>
            )}

            {!error && activities.length > 0 && (
                <div className="flex flex-col gap-2">
                    {activities.map((activity) => (
                        <ActivityCard key={activity.id} activity={activity} />
                    ))}

                    <div className="text-center pt-10">
                        <div className="inline-block px-4 py-1 bg-[#9b8b7e]/10 rounded-full">
                            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-[#9b8b7e]">
                                Estás al día
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};