import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database.types';

export function useUserSearch() {
    const [query, setQuery] = useState('');
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    const { data: results = [], isLoading: loading } = useQuery({
        queryKey: ['user-search', debouncedQuery],
        queryFn: async () => {
            if (!debouncedQuery.trim()) return [];
            const { data, error } = await supabase
                .rpc('p_users_search', { query: debouncedQuery });

            if (error) throw error;
            return (data as User[]) || [];
        },
        enabled: debouncedQuery.trim().length > 0,
    });

    return {
        query,
        setQuery,
        results,
        loading
    };
}
