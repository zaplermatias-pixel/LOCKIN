import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Comment {
    id: string;
    workout_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user: {
        username: string;
        display_name: string;
        profile_picture_url: string | null;
    };
}

export function useComments(workoutId: string) {
    const { user: currentUser } = useAuth();
    const [comments, setComments] = useState<Comment[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchComments = useCallback(async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    user:users (
                        username,
                        display_name,
                        profile_picture_url
                    )
                `)
                .eq('workout_id', workoutId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setComments(data as any[] || []);
        } catch (err) {
            console.error('Error fetching comments:', err);
        } finally {
            setLoading(false);
        }
    }, [workoutId]);

    useEffect(() => {
        if (workoutId) {
            fetchComments();
        }
    }, [workoutId, fetchComments]);

    const addComment = async (content: string) => {
        if (!currentUser || !content.trim()) return;

        setIsSubmitting(true);
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert({
                    workout_id: workoutId,
                    user_id: currentUser.id,
                    content: content.trim()
                })
                .select(`
                    *,
                    user:users (
                        username,
                        display_name,
                        profile_picture_url
                    )
                `)
                .single();

            if (error) throw error;
            setComments(prev => [...prev, data as any]);

            // Create notification for the workout owner
            try {
                // 1. Get workout owner
                const { data: workoutData } = await supabase
                    .from('workouts')
                    .select('user_id')
                    .eq('id', workoutId)
                    .single();

                if (workoutData && workoutData.user_id !== currentUser.id) {
                    await supabase.from('notifications').insert({
                        user_id: workoutData.user_id,
                        actor_id: currentUser.id,
                        type: 'comment',
                        resource_id: workoutId,
                        message: `comentó: "${content.length > 30 ? content.substring(0, 30) + '...' : content}"`
                    });
                }
            } catch (notifErr) {
                console.error('Error creating notification for comment:', notifErr);
            }

            return true;
        } catch (err) {
            console.error('Error adding comment:', err);
            return false;
        } finally {
            setIsSubmitting(false);
        }
    };

    const deleteComment = async (commentId: string) => {
        try {
            const { error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId);

            if (error) throw error;
            setComments(prev => prev.filter(c => c.id !== commentId));
        } catch (err) {
            console.error('Error deleting comment:', err);
        }
    };

    return {
        comments,
        loading,
        isSubmitting,
        addComment,
        deleteComment,
        refresh: fetchComments
    };
}
