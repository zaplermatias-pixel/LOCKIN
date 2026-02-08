import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database.types';

export function useUserSearch() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 400);
        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                const { data, error } = await supabase
                    .rpc('p_users_search', { query: debouncedQuery });

                if (error) throw error;
                setResults((data as User[]) || []);
            } catch (err) {
                console.error('Error searching users:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        searchUsers();
    }, [debouncedQuery]);

    return {
        query,
        setQuery,
        results,
        loading
    };
}
