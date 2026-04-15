import { useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { Workout } from '@/types/database.types';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function useWorkouts(userId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const targetUserId = userId || user?.id;

    // Fetch Workouts
    const { data: workouts, isLoading: loading, error } = useQuery({
        queryKey: ['workouts', targetUserId],
        queryFn: async () => {
            if (!targetUserId) return [];

            const { data, error } = await supabase
                .from('workouts')
                .select('*')
                .eq('user_id', targetUserId)
                .order('workout_date', { ascending: false });

            if (error) throw error;
            return data as Workout[];
        },
        enabled: !!targetUserId,
        staleTime: 1000 * 60 * 5, // 5 minutes
    });

    // Check if user has worked out today
    const checkHasWorkedOutToday = async () => {
        if (!user) return false;
        const today = new Date().toISOString().split('T')[0];

        const { count, error } = await supabase
            .from('workouts')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user.id)
            .eq('workout_date', today);

        if (error) {
            console.error('Error checking daily status:', error);
            return false;
        }

        return (count || 0) > 0;
    };

    // Create Workout Mutation
    const createWorkoutMutation = useMutation({
        mutationFn: async (vars: {
            workoutData: Partial<Workout>,
            muscleGroups: string[],
            mediaFiles: File[]
        }) => {
            if (!user) throw new Error('Usuario no autenticado');

            const today = new Date().toISOString().split('T')[0];

            // 1. Crear el workout
            const { data: workout, error: workoutError } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    workout_date: today,
                    ...vars.workoutData
                })
                .select()
                .single();

            if (workoutError) throw workoutError;
            if (!workout) throw new Error('No se pudo crear el entrenamiento');

            // 2. Subir imágenes (Paralelo)
            const uploadPromises = vars.mediaFiles.map(async (file, index) => {
                const fileExt = file.name.split('.').pop();
                const fileName = `${workout.id}/${index}_${Date.now()}.${fileExt}`;

                const { error: uploadError } = await supabase.storage
                    .from('workouts')
                    .upload(fileName, file);

                if (uploadError) throw uploadError;

                // URL pública
                const { data: { publicUrl } } = supabase.storage
                    .from('workouts')
                    .getPublicUrl(fileName);

                // Insertar en workout_media
                await supabase.from('workout_media').insert({
                    workout_id: workout.id,
                    media_type: file.type.startsWith('video') ? 'video' : 'photo',
                    media_url: publicUrl,
                    order_index: index
                });
            });

            await Promise.all(uploadPromises);

            // 3. Insertar músculos (Paralelo)
            if (vars.muscleGroups.length > 0) {
                const muscleInserts = vars.muscleGroups.map(muscle => ({
                    workout_id: workout.id,
                    muscle_group: muscle
                }));

                const { error: muscleError } = await supabase
                    .from('workout_muscles')
                    .insert(muscleInserts);

                if (muscleError) throw muscleError;
            }

            // 4. Notificar a los grupos (Lock-Ins)
            const { data: userGroups } = await supabase
                .from('group_members')
                .select('group_id')
                .eq('user_id', user.id);

            if (userGroups && userGroups.length > 0) {
                const announcement = `@${user.username} desbloqueó su feed`;
                
                const groupNotifications = userGroups.map(g => ({
                    group_id: g.group_id,
                    user_id: user.id,
                    content: announcement
                }));

                await supabase.from('group_messages').insert(groupNotifications);
            }

            // 5. Actualizar streak y total_workouts
            const yesterday = new Date();
            yesterday.setDate(yesterday.getDate() - 1);
            const yesterdayStr = yesterday.toISOString().split('T')[0];

            const { count: workedOutYesterday } = await supabase
                .from('workouts')
                .select('*', { count: 'exact', head: true })
                .eq('user_id', user.id)
                .eq('workout_date', yesterdayStr)
                .eq('is_deleted', false);

            // Obtener streak actual
            const { data: currentProfile } = await supabase
                .from('users')
                .select('current_streak, total_workouts')
                .eq('id', user.id)
                .single();

            const newStreak = (workedOutYesterday && workedOutYesterday > 0)
                ? (currentProfile?.current_streak || 0) + 1
                : 1;

            await supabase
                .from('users')
                .update({
                    current_streak: newStreak,
                    total_workouts: (currentProfile?.total_workouts || 0) + 1
                })
                .eq('id', user.id);

            return workout;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['workouts'] });
            queryClient.invalidateQueries({ queryKey: ['feed'] });
            queryClient.invalidateQueries({ queryKey: ['profile'] });
            toast.success('¡LockIn completado! 🔥 Hecho es mejor que perfecto.');
        },
        onError: (err: any) => {
            toast.error('Error al publicar: ' + (err.message || 'Inténtalo de nuevo'));
        }
    });

    const deleteWorkout = useCallback(async (workoutId: string) => {
        const { error } = await supabase
            .from('workouts')
            .update({ is_deleted: true })
            .eq('id', workoutId);
        
        if (error) throw error;
        queryClient.invalidateQueries({ queryKey: ['workouts'] });
    }, [queryClient]);

    return {
        workouts,
        loading,
        error,
        createWorkout: createWorkoutMutation.mutateAsync,
        isCreating: createWorkoutMutation.isPending,
        deleteWorkout,
        checkHasWorkedOutToday
    };
}
