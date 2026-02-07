import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useParams } from 'react-router-dom';
import {
    Settings,
    Calendar,
    Trophy,
    Dumbbell,
    Users as UsersIcon,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

export function Profile() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const { profile, loading, error } = useProfile(id);
    const navigate = useNavigate();

    const isOwnProfile = currentUser?.id === id;

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-500">Cargando perfil...</p>
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
                    <Button onClick={() => window.location.reload()} className="rounded-2xl font-black uppercase italic bg-primary">Reintentar</Button>
                    <Button variant="ghost" onClick={() => navigate('/feed')} className="rounded-2xl font-black uppercase italic text-primary/60">Volver al feed</Button>
                </div>
            </div>
        );
    }

    const stats = [
        { label: 'Workouts', value: profile.total_workouts || 0, icon: Dumbbell },
        { label: 'Streak', value: `${profile.current_streak || 0}d`, icon: Trophy },
        { label: 'Grupos', value: 0, icon: UsersIcon }, // Placeholder
    ];

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Profile Header */}
            <Card className="overflow-hidden border-none shadow-sm sm:border">
                <div className="h-24 bg-gradient-to-r from-primary/20 to-primary/10" />
                <CardContent className="relative pt-0 pb-6 px-4 sm:px-6">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-12 gap-4">
                        <div className="flex flex-col sm:flex-row items-center sm:items-end gap-4 text-center sm:text-left">
                            <Avatar key={currentUser?.profile_picture_url} className="h-32 w-32 border-2 border-primary/10 shadow-sm transition-opacity group-hover:opacity-80">
                                <AvatarImage src={currentUser?.profile_picture_url || ''} />
                                <AvatarFallback className="text-4xl bg-primary/5 text-primary">
                                    {currentUser?.display_name?.[0]?.toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="mb-1">
                                <h1 className="text-2xl font-bold">{profile.display_name}</h1>
                                <p className="text-gray-500">@{profile.username}</p>
                            </div>
                        </div>

                        {isOwnProfile ? (
                            <Button variant="outline" onClick={() => navigate('/settings')} className="w-full sm:w-auto">
                                <Settings className="mr-2 h-4 w-4" />
                                Editar Perfil
                            </Button>
                        ) : (
                            <Button className="w-full sm:w-auto">Seguir</Button>
                        )}
                    </div>

                    <div className="mt-6 space-y-4">
                        {profile.bio && (
                            <p className="text-gray-700 leading-relaxed text-center sm:text-left">
                                {profile.bio}
                            </p>
                        )}

                        <div className="flex flex-wrap justify-center sm:justify-start gap-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Se unió en {format(new Date(profile.created_at), 'MMMM yyyy', { locale: es })}</span>
                            </div>
                            {/* Future: location etc. */}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
                {stats.map((stat) => (
                    <Card key={stat.label} className="border-none shadow-sm sm:border">
                        <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                            <stat.icon className="h-5 w-5 text-primary mb-1 opacity-80" />
                            <span className="text-xl font-bold">{stat.value}</span>
                            <span className="text-[10px] uppercase font-semibold text-gray-400 tracking-wider">
                                {stat.label}
                            </span>
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Activity Sections Placeholder */}
            <div className="space-y-4">
                <h2 className="text-lg font-bold px-1">Actividad Reciente</h2>
                <Card className="border-dashed border-2 bg-transparent">
                    <CardContent className="p-8 text-center text-gray-400">
                        <Dumbbell className="h-10 w-10 mx-auto mb-2 opacity-20" />
                        <p>Aún no hay entrenamientos publicados.</p>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
