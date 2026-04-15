import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useWorkouts } from '@/hooks/useWorkouts';
import { useFriendships } from '@/hooks/useFriendships';
import {
    Settings,
    Calendar as CalendarIcon,
    Dumbbell,
    Users as UsersIcon,
    X,
    MessageSquare,
    Lock,
    Clock
} from 'lucide-react';
import { Calendar as WorkoutCalendar } from '@/components/calendar/Calendar';
import { Button } from '@/components/ui/button';
import { FollowButton } from '@/components/users/FollowButton';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { StreakBadge } from '@/components/ui/StreakBadge';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';

export function Profile() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const { profile, loading: profileLoading, error, refetch } = useProfile(id);
    const { followersCount, followingCount, status } = useFriendships(id);
    const navigate = useNavigate();

    const { workouts, loading: workoutsLoading } = useWorkouts(id);
    const isOwnProfile = currentUser?.id === id;

    if (profileLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" />
                <p className="mt-4 text-primary/60 dark:text-beige/60 font-bold uppercase tracking-widest text-sm">Cargando perfil...</p>
            </div>
        );
    }

    if (error || !profile) {
        return (
            <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[3rem] border-2 border-dashed border-sand/30">
                <div className="bg-sand/30 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                    <X className="h-10 w-10 text-accent/40" />
                </div>
                <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary">Usuario no encontrado</h3>
                <p className="text-sm font-bold text-primary/40 mt-2">No pudimos cargar el perfil con ID: <span className="text-accent">{id}</span></p>
                <div className="mt-8 flex flex-col gap-3 max-w-xs mx-auto">
                    <Button onClick={() => refetch()} className="rounded-2xl font-black uppercase italic bg-primary">Reintentar</Button>
                    <Button variant="ghost" onClick={() => navigate('/feed')} className="rounded-2xl font-black uppercase italic text-primary/60">Volver al feed</Button>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Workouts', value: profile.total_workouts || (workouts?.length || 0), icon: Dumbbell },
        { label: 'Seguidores', value: followersCount, icon: UsersIcon },
        { label: 'Siguiendo', value: followingCount, icon: UsersIcon },
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-20 transition-colors">
            {/* Profile Header */}
            <Card className="overflow-hidden border-2 border-sand/80 dark:border-white/20 shadow-2xl bg-white dark:bg-dark-surface transition-all">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/10 dark:from-beige/20 dark:to-beige/10" />
                <CardContent className="relative pt-0 pb-6 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                            <Avatar key={profile.profile_picture_url || 'default'} className="h-32 w-32 border-2 border-primary/10 dark:border-beige/10 shadow-sm transition-opacity group-hover:opacity-80">
                                <AvatarImage src={profile.profile_picture_url || ''} />
                                <AvatarFallback className="text-4xl bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige">
                                    {profile.display_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="mb-1 text-center sm:text-left">
                                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-black dark:text-beige">{profile.display_name}</h1>
                                <p className="text-primary/30 dark:text-beige/30 font-bold uppercase tracking-widest text-[10px]">@{profile.username}</p>
                            </div>
                        </div>

                        {isOwnProfile ? (
                            <Button variant="outline" onClick={() => navigate('/settings')} className="w-full sm:w-auto">
                                <Settings className="mr-2 h-4 w-4" />
                                Editar Perfil
                            </Button>
                        ) : (
                            <div className="flex gap-2 w-full sm:w-auto">
                                <FollowButton targetUserId={id!} className="flex-1 sm:w-auto px-8" />
                                <Button
                                    onClick={() => navigate(`/messages/${id}`)}
                                    className="bg-primary/10 text-primary hover:bg-primary/20 rounded-2xl shadow-none"
                                >
                                    <MessageSquare className="h-4 w-4" />
                                </Button>
                            </div>
                        )}
                    </div>

                    <div className="mt-6 space-y-4">
                        {profile.bio && (
                            <p className="text-primary/70 dark:text-beige/70 leading-relaxed text-center sm:text-left text-sm font-bold italic">
                                "{profile.bio}"
                            </p>
                        )}

                        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            <StreakBadge streak={profile.current_streak || 0} />

                            <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm">
                                <div className="flex items-center gap-1.5 bg-primary/5 dark:bg-beige/5 px-3 py-1.5 rounded-xl border border-primary/10 dark:border-beige/10">
                                    <CalendarIcon className="h-3.5 w-3.5 text-primary/40 dark:text-beige/40" />
                                    <span className="text-[11px] font-bold uppercase tracking-tight text-primary/60 dark:text-beige/60">Miembro desde {format(new Date(profile.created_at), 'MMM yyyy', { locale: es })}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid & Activity - Blurred if not following/accepted */}
            <div className="relative group">
                <div className={cn(
                    "space-y-6 transition-all duration-700",
                    !isOwnProfile && status !== 'accepted' && "blur-md select-none pointer-events-none opacity-40 grayscale"
                )}>
                    {/* Stats Grid */}
                    <div className="grid grid-cols-3 gap-4">
                        {stats.map((stat) => (
                            <Card key={stat.label} className="border-2 border-sand/80 dark:border-white/20 shadow-lg bg-white dark:bg-dark-surface transition-all">
                                <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                    <stat.icon className="h-5 w-5 text-primary dark:text-beige mb-1 opacity-80" />
                                    <span className="text-xl font-black italic uppercase text-primary dark:text-beige">{stat.value}</span>
                                    <span className="text-[9px] uppercase font-bold text-primary/30 dark:text-beige/30 tracking-widest">
                                        {stat.label}
                                    </span>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {/* Calendar Section */}
                    <div className="space-y-4">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-primary dark:text-beige px-1 flex items-center gap-2">
                            <CalendarIcon className="h-5 w-5" />
                            Historial de Actividad
                        </h2>

                        {workoutsLoading ? (
                            <div className="h-64 bg-sand/20 dark:bg-dark-surface/50 rounded-3xl flex items-center justify-center border border-sand/30 dark:border-white/5">
                                <Spinner />
                            </div>
                        ) : (
                            <WorkoutCalendar workouts={workouts || []} />
                        )}
                    </div>
                </div>

                {/* Privacy Overlay */}
                {!isOwnProfile && status !== 'accepted' && (
                    <div className="absolute inset-x-0 top-0 bottom-0 z-10 flex flex-col items-center justify-center text-center p-8 bg-white/5 dark:bg-black/5 backdrop-blur-[2px] rounded-[3rem]">
                        <div className="p-4 bg-white dark:bg-dark-surface rounded-full shadow-2xl mb-6 border border-primary/10 dark:border-white/10">
                            {status === 'pending' ? (
                                <Clock className="h-10 w-10 text-primary/40 dark:text-beige/40 animate-pulse" />
                            ) : (
                                <Lock className="h-10 w-10 text-primary/40 dark:text-beige/40" />
                            )}
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-black dark:text-beige mb-2">
                            {status === 'pending' ? 'Solicitud Enviada' : 'Perfil Privado'}
                        </h3>
                        <p className="text-xs font-bold text-primary/40 dark:text-beige/40 uppercase tracking-widest max-w-[240px] leading-relaxed">
                            {status === 'pending' 
                                ? 'Espera a que acepte tu solicitud para ver su progreso.' 
                                : 'Sigue a este usuario para ver sus estadísticas y entrenamientos.'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
