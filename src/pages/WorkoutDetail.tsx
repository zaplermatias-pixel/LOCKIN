import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { WorkoutCard } from '@/components/workouts/WorkoutCard';
import { Button } from '@/components/ui/button';
import { ChevronLeft, Loader2 } from 'lucide-react';
import type { WorkoutWithDetails } from '@/types/database.types';

export function WorkoutDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [workout, setWorkout] = useState<WorkoutWithDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchWorkout = async () => {
            if (!id) return;
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from('workouts')
                    .select(`
                        *,
                        users:user_id (id, username, display_name, profile_picture_url),
                        workout_media (id, media_url, media_type),
                        workout_muscles (id, muscle_group)
                    `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setWorkout(data as unknown as WorkoutWithDetails);
            } catch (err: any) {
                console.error('Error fetching workout detail:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkout();
    }, [id]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="h-10 w-10 text-primary animate-spin opacity-20" />
                <p className="mt-4 text-xs font-black uppercase italic tracking-widest text-primary/30">Cargando entrenamiento...</p>
            </div>
        );
    }

    if (error || !workout) {
        return (
            <div className="text-center py-20">
                <p className="text-red-500 font-bold mb-4">No se pudo encontrar el entrenamiento.</p>
                <Button onClick={() => navigate('/feed')} variant="outline" className="rounded-2xl border-sand text-primary hover:bg-sand/20">
                    <ChevronLeft className="mr-2 h-4 w-4" /> Volver al Feed
                </Button>
            </div>
        );
    }

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-in fade-in duration-500">
            <header className="flex items-center gap-4 mb-4">
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => navigate(-1)}
                    className="rounded-xl h-12 w-12 bg-white/70 backdrop-blur-md shadow-sm border border-sand/50 text-primary"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Button>
                <h2 className="text-2xl font-black uppercase italic tracking-tighter text-black">Entrenamiento</h2>
            </header>

            <WorkoutCard workout={workout} isLocked={false} />
        </div>
    );
}
