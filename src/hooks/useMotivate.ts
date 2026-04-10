import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useMotivate(workoutId: string) {
    const { user } = useAuth();
    const [count, setCount] = useState(0);
    const [hasMotivated, setHasMotivated] = useState(false);
    const [loading, setLoading] = useState(false);

    const fetchMotivations = useCallback(async () => {
        if (!workoutId) return;

        // Count total motivations
        const { count: total } = await supabase
            .from('workout_motivations')
            .select('*', { count: 'exact', head: true })
            .eq('workout_id', workoutId);

        setCount(total || 0);

        // Check if current user has motivated
        if (user) {
            const { data } = await supabase
                .from('workout_motivations')
                .select('id')
                .eq('workout_id', workoutId)
                .eq('user_id', user.id)
                .maybeSingle();

            setHasMotivated(!!data);
        }
    }, [workoutId, user]);

    useEffect(() => {
        fetchMotivations();
    }, [fetchMotivations]);

    const toggleMotivate = async () => {
        if (!user || loading) return;
        setLoading(true);

        try {
            if (hasMotivated) {
                // Remove motivation
                await supabase
                    .from('workout_motivations')
                    .delete()
                    .eq('workout_id', workoutId)
                    .eq('user_id', user.id);

                setCount(prev => prev - 1);
                setHasMotivated(false);
            } else {
                // Add motivation
                await supabase
                    .from('workout_motivations')
                    .insert({ workout_id: workoutId, user_id: user.id });

                setCount(prev => prev + 1);
                setHasMotivated(true);
            }
        } catch (err) {
            console.error('Error toggling motivation:', err);
            // Revert optimistic update on error
            fetchMotivations();
        } finally {
            setLoading(false);
        }
    };

    return { count, hasMotivated, loading, toggleMotivate };
}
