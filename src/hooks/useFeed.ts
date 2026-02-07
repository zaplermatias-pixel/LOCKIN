import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { WorkoutWithDetails } from '@/types/database.types';

export function useFeed() {
    const { user } = useAuth();
    const [workouts, setWorkouts] = useState<WorkoutWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [hasWorkedOutToday, setHasWorkedOutToday] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchFeed = useCallback(async () => {
        if (!user) return;

        setLoading(true);
        setError(null);

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Verificar si el usuario ya entrenó hoy
            const { data: todayWorkout } = await supabase
                .from('workouts')
                .select('id')
                .eq('user_id', user.id)
                .eq('workout_date', today)
                .eq('is_deleted', false)
                .maybeSingle();

            const finishedToday = !!todayWorkout;
            setHasWorkedOutToday(finishedToday);

            // 2. Obtener entrenamientos (propios y de amigos/públicos)
            // Por ahora, para el MVP y desarrollo, mostraremos todos los públicos + propios
            const { data, error: fetchError } = await supabase
                .from('workouts')
                .select(`
                    *,
                    users!user_id (
                        id,
                        username,
                        display_name,
                        profile_picture_url
                    ),
                    workout_media (
                        *
                    ),
                    workout_muscles (
                        muscle_group
                    )
                `)
                .eq('is_deleted', false)
                .order('created_at', { ascending: false })
                .limit(20);

            if (fetchError) throw fetchError;

            setWorkouts(data as any[]);
        } catch (err: any) {
            console.error('Error fetching feed:', err);
            setError(err.message || 'Error al cargar el feed');
        } finally {
            setLoading(false);
        }
    }, [user]);

    return {
        workouts,
        loading,
        hasWorkedOutToday,
        error,
        refetch: fetchFeed
    };
}
