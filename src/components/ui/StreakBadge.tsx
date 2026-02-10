import { Flame, Star } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StreakBadgeProps {
    streak: number;
    className?: string;
    showLabel?: boolean;
}

export function StreakBadge({ streak, className, showLabel = true }: StreakBadgeProps) {
    if (streak === 0) {
        return (
            <div className={cn("flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-100 text-gray-400 grayscale", className)}>
                <Flame className="h-4 w-4" />
                {showLabel && <span className="text-[10px] font-black uppercase tracking-widest">Sin racha</span>}
            </div>
        );
    }

    // Determinar nivel de "fuego" basado en la racha
    const isHot = streak >= 7;
    const isLegendary = streak >= 30;

    return (
        <div className={cn(
            "relative flex items-center gap-1.5 px-4 py-2 rounded-2xl transition-all duration-500",
            isLegendary
                ? "bg-gradient-to-br from-yellow-400 via-orange-500 to-red-600 text-white shadow-lg shadow-orange-500/40 scale-110"
                : isHot
                    ? "bg-gradient-to-br from-orange-400 to-red-500 text-white shadow-md shadow-orange-400/30"
                    : "bg-orange-100 text-orange-600",
            className
        )}>
            {/* Animación de destello para leyendas */}
            {isLegendary && (
                <div className="absolute inset-0 rounded-2xl bg-white/20 animate-pulse" />
            )}

            <div className="relative">
                {isLegendary ? (
                    <Star className="h-4 w-4 fill-white animate-bounce" />
                ) : (
                    <Flame className={cn("h-4 w-4", !isHot && "fill-orange-600")} />
                )}
            </div>

            <div className="flex flex-col leading-none">
                <span className="text-sm font-black italic">{streak} d{streak > 1 ? 's' : ''}</span>
                {showLabel && (
                    <span className={cn(
                        "text-[8px] font-black uppercase tracking-[0.1em]",
                        isHot || isLegendary ? "text-white/80" : "text-orange-600/60"
                    )}>
                        {isLegendary ? 'Leyenda' : isHot ? 'En Fuego' : 'Racha'}
                    </span>
                )}
            </div>
        </div>
    );
}
