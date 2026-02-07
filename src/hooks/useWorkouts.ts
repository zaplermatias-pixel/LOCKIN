import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Workout, WorkoutMedia } from '@/types/database.types';

type WorkoutInsert = Omit<Workout, 'id' | 'created_at' | 'is_deleted'>;
type WorkoutMediaInsert = Omit<WorkoutMedia, 'id' | 'created_at' | 'thumbnail_url'>;

export function useWorkouts() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const checkHasWorkedOutToday = async () => {
        if (!user) return false;

        const today = new Date().toISOString().split('T')[0];

        const { data, error } = await supabase
            .from('workouts')
            .select('id')
            .eq('user_id', user.id)
            .eq('workout_date', today)
            .eq('is_deleted', false)
            .maybeSingle();

        if (error) {
            console.error('Error checking today\'s workout:', error);
            return false;
        }

        return !!data;
    };

    const createWorkout = async (
        workoutData: Partial<Workout>,
        muscles: string[],
        mediaFiles: File[]
    ) => {
        if (!user) throw new Error('User not authenticated');

        setLoading(true);
        setError(null);

        try {
            const today = new Date().toISOString().split('T')[0];

            // 1. Verificar si ya publicó hoy
            const hasWorkedOut = await checkHasWorkedOutToday();
            if (hasWorkedOut) {
                throw new Error('Ya has publicado un entrenamiento hoy. ¡Vuelve mañana!');
            }

            // 2. Crear el registro del entrenamiento
            const { data: workout, error: workoutError } = await supabase
                .from('workouts')
                .insert({
                    user_id: user.id,
                    workout_date: today,
                    ...workoutData
                })
                .select()
                .single();

            if (workoutError) throw workoutError;

            // 3. Insertar músculos
            if (muscles.length > 0) {
                const muscleEntries = muscles.map(muscle => ({
                    workout_id: workout.id,
                    muscle_group: muscle as any
                }));

                const { error: muscleError } = await supabase
                    .from('workout_muscles')
                    .insert(muscleEntries);

                if (muscleError) throw muscleError;
            }

            // 4. Subir media y registrar URLs
            if (mediaFiles.length > 0) {
                const mediaPromises = mediaFiles.map(async (file, index) => {
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${workout.id}/${index}-${Math.random()}.${fileExt}`;
                    const filePath = fileName;

                    const { error: uploadError } = await supabase.storage
                        .from('workouts-media')
                        .upload(filePath, file);

                    if (uploadError) throw uploadError;

                    const { data: { publicUrl } } = supabase.storage
                        .from('workouts-media')
                        .getPublicUrl(filePath);

                    return {
                        workout_id: workout.id,
                        media_type: file.type.startsWith('video/') ? 'video' : 'photo',
                        media_url: publicUrl,
                        order_index: index
                    } as WorkoutMedia;
                });

                const mediaEntries = await Promise.all(mediaPromises);

                const { error: mediaError } = await supabase
                    .from('workout_media')
                    .insert(mediaEntries);

                if (mediaError) throw mediaError;
            }

            return workout;
        } catch (err: any) {
            console.error('Error creating workout:', err);
            setError(err.message || 'Error al crear el entrenamiento');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        createWorkout,
        checkHasWorkedOutToday,
        loading,
        error
    };
}
