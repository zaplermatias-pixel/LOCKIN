import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export type LeaderboardEntry = {
    user_id: string;
    username: string;
    display_name: string;
    profile_picture_url: string | null;
    points: number;
};

export type LeaderboardPeriod = 'weekly' | 'monthly' | 'all';

export function useGroupLeaderboard(groupId: string, period: LeaderboardPeriod) {
    return useQuery({
        queryKey: ['leaderboard', groupId, period],
        queryFn: async () => {
            if (!groupId) return [];

            const { data, error } = await supabase.rpc('get_group_leaderboard', {
                p_group_id: groupId,
                p_period: period
            });

            if (error) {
                console.error('Error fetching leaderboard:', error);
                throw error;
            }

            return data as LeaderboardEntry[];
        },
        enabled: !!groupId,
        staleTime: 1000 * 60 * 5, // 5 minutos
    });
}
