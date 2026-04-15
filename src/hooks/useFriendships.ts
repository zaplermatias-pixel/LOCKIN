import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export function useFriendships(targetUserId: string | undefined) {
    const { user: currentUser } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [status, setStatus] = useState<'accepted' | 'pending' | null>(null);
    const [loading, setLoading] = useState(true);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    const checkStatus = async () => {
        if (!targetUserId || !currentUser) {
            setLoading(false);
            return;
        }

        try {
            // 1. Check if I follow them
            const { data: followData, error: followError } = await supabase
                .from('friendships')
                .select('id, status')
                .eq('follower_id', currentUser.id)
                .eq('followed_id', targetUserId)
                .maybeSingle();

            if (followError) throw followError;
            setIsFollowing(!!followData);
            setStatus(followData?.status || null);

            // 2. Count followers (people following target) - Solo los aceptados
            const { count: followers } = await supabase
                .from('friendships')
                .select('id', { count: 'exact', head: true })
                .eq('followed_id', targetUserId)
                .eq('status', 'accepted');

            // 3. Count following (people target follows) - Solo los aceptados
            const { count: following } = await supabase
                .from('friendships')
                .select('id', { count: 'exact', head: true })
                .eq('follower_id', targetUserId)
                .eq('status', 'accepted');

            setFollowersCount(followers || 0);
            setFollowingCount(following || 0);

        } catch (err) {
            console.error('Error checking friendship:', err);
        } finally {
            setLoading(false);
        }
    };

    // Cargar estado inicial
    useEffect(() => {
        checkStatus();
    }, [currentUser, targetUserId]);

    const toggleFollow = async () => {
        if (!currentUser || !targetUserId) return;

        // Optimistic update
        const previousIsFollowing = isFollowing;
        const previousStatus = status;

        if (previousIsFollowing) {
            // Unfollow logic
            setIsFollowing(false);
            setStatus(null);
            if (previousStatus === 'accepted') setFollowersCount(prev => prev - 1);
        } else {
            // Follow logic
            setIsFollowing(true);
            setStatus('pending');
        }

        try {
            if (previousIsFollowing) {
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('followed_id', targetUserId);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('friendships')
                    .insert({
                        follower_id: currentUser.id,
                        followed_id: targetUserId,
                        status: 'pending' // Siempre pendiente para requerir aprobación
                    });

                if (error) throw error;

                // Notificar solicitud
                await supabase.from('notifications').insert({
                    user_id: targetUserId,
                    actor_id: currentUser.id,
                    type: 'follow',
                    message: 'quiere seguirte'
                });
                toast.success('Solicitud enviada 🤝');
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
            setIsFollowing(previousIsFollowing);
            setStatus(previousStatus);
            if (previousStatus === 'accepted') setFollowersCount(prev => prev + 1);
            toast.error('Error al procesar la solicitud');
        }
    };

    const acceptRequest = async (followerId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('friendships')
                .update({ status: 'accepted' })
                .eq('follower_id', followerId)
                .eq('followed_id', currentUser.id);

            if (error) throw error;
            toast.success('¡Solicitud aceptada!');
            checkStatus();
        } catch (err) {
            console.error('Error accepting request:', err);
            toast.error('No se pudo aceptar la solicitud');
        }
    };

    const declineRequest = async (followerId: string) => {
        if (!currentUser) return;
        try {
            const { error } = await supabase
                .from('friendships')
                .delete()
                .eq('follower_id', followerId)
                .eq('followed_id', currentUser.id);

            if (error) throw error;
            toast.success('Solicitud rechazada');
            checkStatus();
        } catch (err) {
            console.error('Error declining request:', err);
            toast.error('No se pudo rechazar la solicitud');
        }
    };

    return {
        isFollowing,
        status,
        loading,
        followersCount,
        followingCount,
        toggleFollow,
        acceptRequest,
        declineRequest,
        refetch: checkStatus
    };
}
