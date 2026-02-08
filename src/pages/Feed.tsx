import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { useFeed } from '@/hooks/useFeed';
import { WorkoutCard } from '@/components/workouts/WorkoutCard';
import { Spinner } from '@/components/ui/spinner';
import { Button } from '@/components/ui/button';
import {
    Flame,
    Lock,
    PlusCircle,
    RefreshCcw,
    Trophy,
    Zap,
    AlertCircle
} from 'lucide-react';

export function Feed() {
    const navigate = useNavigate();
    const { workouts, loading, hasWorkedOutToday, error, refetch } = useFeed();

    useEffect(() => {
        const load = async () => {
            await refetch();
        };
        load();
    }, []); // Run once on mount

    if (loading && workouts.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="relative mb-6">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <Spinner size="lg" className="relative z-10" />
                </div>
                <h3 className="text-xl font-black italic tracking-tighter uppercase mb-2">Preparando tu Feed</h3>
                <p className="text-gray-500 text-sm font-medium">Sincronizando los últimos Lock-Ins...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 bg-red-50 rounded-3xl border border-red-100">
                <AlertCircle className="h-10 w-10 text-red-500 mb-4" />
                <h3 className="text-lg font-bold text-red-900 mb-2">Vaya, algo salió mal</h3>
                <p className="text-red-700 text-sm mb-6 max-w-xs">{error}</p>
                <Button onClick={refetch} variant="outline" className="gap-2 border-red-200 text-red-700 hover:bg-red-100">
                    <RefreshCcw className="h-4 w-4" /> Reintentar
                </Button>
            </div>
        );
    }

    return (
        <div className="pb-10 max-w-lg mx-auto">
            {/* Today's Mission Status */}
            {!hasWorkedOutToday ? (
                <div className="mb-12 relative overflow-hidden bg-gradient-to-br from-primary to-accent rounded-[3rem] p-10 text-white shadow-2xl shadow-primary/30 group ring-4 ring-white/10">
                    <div className="absolute -top-20 -right-20 w-64 h-64 bg-white/10 rounded-full blur-3xl transition-transform group-hover:scale-125 duration-1000" />

                    <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                        <div className="bg-white/20 backdrop-blur-xl p-5 rounded-[2.5rem] border border-white/30 shadow-2xl">
                            <Lock className="h-10 w-10 text-white fill-white/10" />
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter leading-none">Feed Bloqueado</h2>
                            <p className="text-sm font-bold opacity-80 max-w-[240px]">Tus amigos ya están dándolo todo. ¡Es tu turno de brillar!</p>
                        </div>

                        <Button
                            onClick={() => navigate('/new-workout')}
                            className="bg-white text-primary hover:bg-earth-bg hover:scale-105 font-black uppercase italic py-8 px-12 rounded-3xl shadow-2xl transition-all active:scale-95 text-xl h-auto w-full max-w-sm ring-4 ring-white/20"
                        >
                            ¡Bloquear Mi Día!
                        </Button>

                        <div className="flex items-center gap-6 pt-2">
                            <div className="flex items-center gap-2 opacity-80 bg-white/10 px-4 py-2 rounded-2xl">
                                <Trophy className="h-4 w-4 text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">+10 PTS</span>
                            </div>
                            <div className="flex items-center gap-2 opacity-80 bg-white/10 px-4 py-2 rounded-2xl">
                                <Flame className="h-4 w-4 text-white" />
                                <span className="text-[10px] font-black uppercase tracking-widest">+1 DÍA</span>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="mb-10 flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-primary shadow-lg shadow-primary/20 flex items-center justify-center text-white ring-4 ring-white">
                            <Zap className="h-6 w-6 fill-current" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black uppercase italic tracking-tighter leading-none text-primary">Actividad Real</h2>
                            <p className="text-[10px] font-black text-primary/40 uppercase tracking-[0.2em] mt-1">Estás en racha 🔥</p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        onClick={refetch}
                        className="text-primary hover:bg-primary/5 font-black text-[10px] uppercase tracking-widest p-0 h-10 w-10 rounded-2xl"
                    >
                        <RefreshCcw className="h-5 w-5" />
                    </Button>
                </div>
            )}

            {/* Feed List */}
            <div className="space-y-4 px-2">
                {workouts.length > 0 ? (
                    workouts.map((workout) => (
                        <WorkoutCard
                            key={workout.id}
                            workout={workout}
                            isLocked={!hasWorkedOutToday && workout.user_id !== (supabase.auth.getUser() as any)?.id}
                        />
                    ))
                ) : (
                    !loading && (
                        <div className="flex flex-col items-center justify-center py-24 text-center px-10 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-sand/30 ring-1 ring-sand/20">
                            <div className="bg-sand/30 p-8 rounded-[2.5rem] mb-8 shadow-inner">
                                <PlusCircle className="h-14 w-14 text-primary/20" />
                            </div>
                            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-3 text-primary/40">Desierto Total</h3>
                            <p className="text-sm font-bold text-primary/30 mb-10 max-w-[240px]">Nadie ha publicado hoy. ¡Sé la leyenda que rompa el silencio!</p>
                            <Button
                                onClick={() => navigate('/new-workout')}
                                className="bg-primary text-white hover:scale-105 rounded-2xl font-black uppercase italic tracking-widest px-8 shadow-xl shadow-primary/20"
                            >
                                Publicar Ahora
                            </Button>
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
