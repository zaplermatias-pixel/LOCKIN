import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database.types';

export function useProfile(userId?: string) {
    const [profile, setProfile] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<Error | null>(null);

    const fetchProfile = useCallback(async (id: string) => {
        try {
            setLoading(true);
            setError(null);
            console.log('useProfile: Starting fetch for user ID:', id); // Added log

            const { data, error: fetchError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) {
                console.error('useProfile: Error fetching profile for ID:', id, fetchError); // Added log
                throw fetchError;
            }
            setProfile(data as User);
            console.log('useProfile: Profile fetched successfully for ID:', id, data); // Added log
        } catch (e: any) {
            console.error('useProfile error:', e);
            setError(e);
            setProfile(null);
        } finally {
            setLoading(false);
            console.log('useProfile: Fetch operation completed for ID:', id); // Added log
        }
    }, []);

    useEffect(() => {
        console.log('useProfile: useEffect triggered with userId:', userId);
        if (!userId || userId === 'undefined') {
            console.log('useProfile: No valid userId, stopping loading');
            setLoading(false);
            return;
        }
        fetchProfile(userId);
    }, [userId, fetchProfile]);

    return { profile, loading, error, refetch: () => userId && fetchProfile(userId) };
}
