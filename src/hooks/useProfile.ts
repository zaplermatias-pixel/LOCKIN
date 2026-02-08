import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database.types';

export function useProfile(userId?: string) {
    const queryClient = useQueryClient();

    const { data: profile, isLoading: loading, error } = useQuery({
        queryKey: ['profile', userId],
        queryFn: async () => {
            console.log('useProfile: Fetching profile for:', userId);
            if (!userId) return null;

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) throw error;
            return data as User;
        },
        enabled: !!userId && userId !== 'undefined',
        staleTime: 1000 * 60 * 2, // 2 minutos de caché fresco
    });

    // Función para invalidar/recargar manualmente
    const refetch = useCallback(() => {
        return queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    }, [queryClient, userId]);

    return {
        profile: profile ?? null,
        loading,
        error: error as Error | null,
        refetch
    };
}
