import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useFeed() {
    const { user } = useAuth();

    const { data, isLoading: loading, error, refetch } = useQuery({
        queryKey: ['feed', user?.id],
        queryFn: async () => {
            if (!user) return { workouts: [], hasWorkedOutToday: false };

            const today = new Date().toISOString().split('T')[0];

            // 1. Verificar si el usuario ya entrenó hoy
            const { data: todayWorkout } = await supabase
                .from('workouts')
                .select('id')
                .eq('user_id', user.id)
                .eq('workout_date', today)
                .eq('is_deleted', false)
                .maybeSingle();

            const hasWorkedOutToday = !!todayWorkout;

            // 2. Obtener IDs de personas que el usuario sigue
            const { data: following } = await supabase
                .from('friendships')
                .select('followed_id')
                .eq('follower_id', user.id)
                .eq('status', 'accepted');

            const friendIds = [
                user.id,
                ...(following?.map(f => f.followed_id) ?? [])
            ];

            // 3. Obtener entrenamientos de hoy solo de esos usuarios
            const { data: workoutData, error: fetchError } = await supabase
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

            return {
                workouts: (workoutData as any[]) || [],
                hasWorkedOutToday
            };
        },
        enabled: !!user,
        staleTime: 1000 * 60 * 2, // 2 minutos
    });

    return {
        workouts: data?.workouts ?? [],
        hasWorkedOutToday: data?.hasWorkedOutToday ?? false,
        loading,
        error: error ? (error as any).message : null,
        refetch
    };
}
