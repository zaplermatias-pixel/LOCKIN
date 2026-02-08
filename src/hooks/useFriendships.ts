import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export function useFriendships(targetUserId: string | undefined) {
    const { user: currentUser } = useAuth();
    const [isFollowing, setIsFollowing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);

    // Cargar estado inicial
    useEffect(() => {
        if (!targetUserId || !currentUser) {
            setLoading(false);
            return;
        }

        const checkStatus = async () => {
            try {
                // 1. Check if I follow them
                const { data: followData, error: followError } = await supabase
                    .from('friendships')
                    .select('id')
                    .eq('follower_id', currentUser.id)
                    .eq('followed_id', targetUserId)
                    .maybeSingle();

                if (followError) throw followError;
                setIsFollowing(!!followData);

                // 2. Count followers (people following target)
                const { count: followers } = await supabase
                    .from('friendships')
                    .select('id', { count: 'exact', head: true })
                    .eq('followed_id', targetUserId);

                // 3. Count following (people target follows)
                const { count: following } = await supabase
                    .from('friendships')
                    .select('id', { count: 'exact', head: true })
                    .eq('follower_id', targetUserId);

                setFollowersCount(followers || 0);
                setFollowingCount(following || 0);

            } catch (err) {
                console.error('Error checking friendship:', err);
            } finally {
                setLoading(false);
            }
        };

        checkStatus();
    }, [currentUser, targetUserId]);

    const toggleFollow = async () => {
        if (!currentUser || !targetUserId) return;

        // Optimistic update
        const previousState = isFollowing;
        setIsFollowing(!isFollowing);
        setFollowersCount(prev => isFollowing ? prev - 1 : prev + 1);

        try {
            if (previousState) {
                // Unfollow
                const { error } = await supabase
                    .from('friendships')
                    .delete()
                    .eq('follower_id', currentUser.id)
                    .eq('followed_id', targetUserId);

                if (error) throw error;
            } else {
                // Follow
                const { error } = await supabase
                    .from('friendships')
                    .insert({
                        follower_id: currentUser.id,
                        followed_id: targetUserId,
                        status: 'accepted'
                    });

                if (error) throw error;
            }
        } catch (err) {
            console.error('Error toggling follow:', err);
            // Revert on error
            setIsFollowing(previousState);
            setFollowersCount(prev => previousState ? prev + 1 : prev - 1);
        }
    };

    return {
        isFollowing,
        loading,
        followersCount,
        followingCount,
        toggleFollow
    };
}
