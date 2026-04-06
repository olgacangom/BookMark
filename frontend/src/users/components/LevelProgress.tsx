import React from 'react';

interface LevelProgressProps {
    xp: number;
}

export const LevelProgress: React.FC<LevelProgressProps> = ({ xp }) => {
    const level = Math.floor(0.1 * Math.sqrt(xp)) + 1;
    const currentLevelXpBase = Math.pow((level - 1) / 0.1, 2);
    // XP necesaria para el siguiente nivel (el final de la barra)
    const nextLevelXpTarget = Math.pow(level / 0.1, 2);
    // Progreso relativo dentro del nivel actual (0 a 100)
    const progressInLevel = ((xp - currentLevelXpBase) / (nextLevelXpTarget - currentLevelXpBase)) * 100;
    const xpRemaining = Math.ceil(nextLevelXpTarget - xp);

    const getLevelTitle = (lvl: number) => {
        if (lvl >= 20) return "Leyenda de la Biblioteca";
        if (lvl >= 15) return "Maestro de Historias";
        if (lvl >= 10) return "Lector Voraz";
        if (lvl >= 5) return "Devoralibros";
        return "Iniciado en la Lectura"; // Para nivel 1-4
    };


    return (
        <div className="w-full max-w-md bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm">
            {/* Cabecera: Nivel e Info */}
            <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                    {/* El número del nivel */}
                    <div className="relative shrink-0">
                        <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-500 rounded-2xl rotate-3 flex items-center justify-center shadow-lg shadow-orange-100">
                            <span className="text-white font-black text-xl -rotate-3">{level}</span>
                        </div>
                    </div>

                    {/* Los textos de nivel */}
                    <div className="flex flex-col">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.15em] text-slate-400 mb-0.5">
                            Rango Actual
                        </h3>
                        <p className="text-lg font-bold text-slate-800 leading-none">
                            {getLevelTitle(level)}
                        </p>
                    </div>
                </div>

                <div className="text-right pt-1">
                    <div className="flex flex-col">
                        <span className="text-sm font-black text-orange-600">+{xpRemaining} XP</span>
                        <span className="text-[9px] text-slate-400 uppercase font-black tracking-tighter">Siguiente Nivel</span>
                    </div>
                </div>
            </div>

            {/* Barra de Progreso */}
            <div className="relative h-4 w-full bg-slate-100 rounded-full overflow-hidden border border-slate-50">
                {/* Relleno con animación y gradiente */}
                <div
                    className="absolute top-0 left-0 h-full bg-gradient-to-r from-amber-400 via-orange-500 to-rose-500 transition-all duration-1000 ease-out"
                    style={{ width: `${progressInLevel}%` }}
                >
                    {/* Efecto de brillo barriendo la barra */}
                    <div className="absolute top-0 left-0 w-full h-full bg-white/20 skew-x-12 translate-x-[-100%] animate-[shimmer_2s_infinite]"></div>
                </div>
            </div>

            {/* Footer: XP total */}
            <div className="flex justify-between mt-3 px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-tighter">
                    {Math.floor(xp)} XP Totales
                </span>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                    Meta: {Math.floor(nextLevelXpTarget)} XP
                </span>
            </div>
        </div>
    );
};