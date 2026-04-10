import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { Share2, Lock, Music, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { CommentsSection } from './CommentsSection';
import { useMotivate } from '@/hooks/useMotivate';
import type { WorkoutWithDetails } from '@/types/database.types';

const MUSCLE_LABELS: Record<string, string> = {
    chest: 'Pecho', back: 'Espalda', legs: 'Piernas',
    shoulders: 'Hombros', arms: 'Brazos', abs: 'Abdominales',
    glutes: 'Glúteos', cardio: 'Cardio', full_body: 'Cuerpo Completo'
};

interface WorkoutCardProps {
    workout: WorkoutWithDetails;
    isLocked: boolean;
}

export function WorkoutCard({ workout, isLocked }: WorkoutCardProps) {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const hasMultipleMedia = (workout.workout_media?.length || 0) > 1;
    const { count: motivateCount, hasMotivated, toggleMotivate } = useMotivate(workout.id);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const scrollPosition = e.currentTarget.scrollLeft;
        const width = e.currentTarget.offsetWidth;
        const newSlide = Math.round(scrollPosition / width);
        if (newSlide !== currentSlide) {
            setCurrentSlide(newSlide);
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Entrenamiento de ${workout.users?.display_name}`,
            text: workout.description || `¡${workout.users?.display_name} desbloquó su Lock-In hoy!`,
            url: `${window.location.origin}/workout/${workout.id}`,
        };
        if (navigator.share) {
            await navigator.share(shareData);
        } else {
            await navigator.clipboard.writeText(shareData.url);
        }
    };

    return (
        <Card className="overflow-hidden border-2 border-sand/80 dark:border-white/20 shadow-2xl bg-white dark:bg-dark-surface backdrop-blur-md rounded-[2.5rem] mb-8 transition-colors">
            {/* Header */}
            <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                <div
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${workout.users?.id}`)}
                >
                    <Avatar className="h-11 w-11 border-2 border-primary/10 shadow-sm">
                        <AvatarImage src={workout.users?.profile_picture_url || ''} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-black italic">
                            {workout.users?.username?.[0]?.toUpperCase()}
                        </AvatarFallback>
                    </Avatar>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="font-black text-sm text-primary dark:text-beige italic uppercase tracking-tighter">{workout.users?.display_name}</span>
                            <span className="text-primary/30 dark:text-beige/30 text-[10px] font-bold uppercase tracking-widest">@{workout.users?.username}</span>
                        </div>
                        <p className="text-[10px] text-primary/40 dark:text-beige/40 font-bold uppercase tracking-widest mt-0.5">
                            {formatDistanceToNow(new Date(workout.created_at), { addSuffix: true, locale: es })}
                        </p>
                    </div>
                </div>

                {workout.activity_type && (
                    <div className="bg-primary text-white px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-lg shadow-primary/20">
                        <span className="text-[10px] font-black uppercase italic tracking-wider">
                            {workout.activity_type === 'gym' ? '💪 Gym' :
                                workout.activity_type === 'run' ? '🏃 Run' :
                                    workout.activity_type === 'bike' ? '🚴 Bike' :
                                        workout.activity_type === 'swim' ? '🏊 Swim' :
                                            workout.activity_type === 'yoga' ? '🧘 Yoga' :
                                                workout.activity_type === 'crossfit' ? '🔥 Crossfit' : '✨ Activity'}
                        </span>
                    </div>
                )}
            </CardHeader>

            {/* Media Content */}
            <div className="relative aspect-[4/5] bg-sand/20 group mx-2 rounded-[2rem] overflow-hidden shadow-inner">
                {isLocked ? (
                    <div className="absolute inset-0 z-10 backdrop-blur-3xl bg-primary/20 dark:bg-dark-bg/60 flex flex-col items-center justify-center text-primary dark:text-beige p-8 text-center">
                        <div className="bg-white/40 dark:bg-white/10 p-5 rounded-3xl mb-4 shadow-xl">
                            <Lock className="h-10 w-10 text-primary dark:text-beige fill-primary/10 dark:fill-beige/10" />
                        </div>
                        <h3 className="text-2xl font-black mb-2 uppercase italic tracking-tighter">🔒 BLOQUEADO</h3>
                        <p className="text-sm font-bold opacity-70 max-w-[220px] leading-snug">Publica tu sesión de hoy para desbloquear el feed de tus amigos.</p>
                    </div>
                ) : (
                    <div 
                        className="flex h-full overflow-x-auto snap-x snap-mandatory no-scrollbar"
                        onScroll={handleScroll}
                    >
                        {workout.workout_media?.map((media, idx) => (
                            <div key={media.id} className="min-w-full h-full snap-center flex-shrink-0">
                                <img
                                    src={media.media_url}
                                    alt={`Workout ${idx + 1}`}
                                    onClick={() => !isLocked && navigate(`/workout/${workout.id}`)}
                                    className={`w-full h-full object-cover transition-transform duration-700 ${!isLocked ? 'cursor-pointer' : ''}`}
                                />
                            </div>
                        ))}
                    </div>
                )}

                {/* Slide Indicators */}
                {!isLocked && hasMultipleMedia && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-20">
                        {workout.workout_media.map((_, idx) => (
                            <div 
                                key={idx}
                                className={`h-1 rounded-full transition-all duration-300 ${
                                    idx === currentSlide 
                                        ? 'w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]' 
                                        : 'w-1 bg-white/40'
                                }`}
                            />
                        ))}
                    </div>
                )}

                {!isLocked && hasMultipleMedia && (
                    <div className="absolute top-4 right-4 bg-black/40 text-white text-[10px] font-bold px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10 uppercase tracking-widest z-10">
                        {workout.workout_media.length} Archivos
                    </div>
                )}

                {/* Overlays for Music or Stats */}
                {!isLocked && workout.song_name && (
                    <div className="absolute bottom-4 left-4 right-4 animate-in fade-in slide-in-from-bottom-4 duration-500 z-10">
                        <div className="bg-earth-bg/60 backdrop-blur-xl border border-white/40 rounded-3xl p-4 flex items-center gap-4 text-primary shadow-2xl">
                            <div className="bg-primary p-3 rounded-2xl animate-pulse-slow shadow-lg shadow-primary/10">
                                <Music className="h-5 w-5 text-white fill-current" />
                            </div>
                            <div className="overflow-hidden">
                                <p className="text-[11px] font-black uppercase italic tracking-tighter truncate leading-none mb-1">{workout.song_name}</p>
                                <p className="text-[10px] font-bold opacity-60 truncate uppercase tracking-widest">{workout.song_artist}</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Description & Muscles */}
            <CardContent className="p-6 space-y-5">
                {workout.description && !isLocked && (
                    <p className="text-sm text-primary/80 dark:text-beige/80 font-bold leading-relaxed italic">
                        "{workout.description}"
                    </p>
                )}

                {!isLocked && workout.workout_muscles && workout.workout_muscles.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                        {workout.workout_muscles.map((m, i) => (
                            <span key={i} className="bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige text-[10px] font-black px-4 py-1.5 rounded-xl border border-primary/10 dark:border-beige/10 uppercase tracking-widest shadow-sm">
                                {MUSCLE_LABELS[m.muscle_group] || m.muscle_group}
                            </span>
                        ))}
                    </div>
                )}

                <CommentsSection workoutId={workout.id} isLocked={isLocked} />
            </CardContent>

            {/* Footer Actions */}
            <CardFooter className="p-6 pt-0 flex items-center gap-4">
                <Button
                    variant="ghost"
                    size="sm"
                    disabled={isLocked}
                    onClick={toggleMotivate}
                    className={`rounded-2xl gap-2 px-6 h-12 transition-all font-black uppercase italic tracking-tighter flex-1 shadow-sm ${
                        hasMotivated
                            ? 'bg-primary text-white dark:bg-beige dark:text-dark-bg shadow-lg shadow-primary/20'
                            : 'bg-primary/5 dark:bg-beige/5 hover:bg-primary dark:hover:bg-beige hover:text-white dark:hover:text-dark-bg text-primary dark:text-beige'
                    }`}
                >
                    <Zap className={`h-4 w-4 ${hasMotivated ? 'fill-current' : ''}`} />
                    <span>Motivar {motivateCount > 0 && `· ${motivateCount}`}</span>
                </Button>
                <Button variant="ghost" size="icon" onClick={handleShare} className="rounded-2xl h-12 w-12 bg-accent/5 dark:bg-accent/10 hover:bg-accent hover:text-white text-accent transition-all shadow-sm">
                    <Share2 className="h-5 w-5" />
                </Button>
            </CardFooter>
        </Card>
    );
}
