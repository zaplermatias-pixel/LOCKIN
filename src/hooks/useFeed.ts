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

            // 2. Obtener IDs de personas que el usuario sigue
            const { data: following } = await supabase
                .from('friendships')
                .select('followed_id')
                .eq('follower_id', user.id)
                .eq('status', 'accepted');

            // Incluir al propio usuario + amigos
            const friendIds = [
                user.id,
                ...(following?.map(f => f.followed_id) ?? [])
            ];

            // 3. Obtener entrenamientos de hoy solo de esos usuarios
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
                .in('user_id', friendIds)
                .eq('is_deleted', false)
                .eq('workout_date', today)
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
