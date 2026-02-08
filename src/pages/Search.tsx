import { useState, useEffect } from 'react';
import { Search as SearchIcon, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { UserListItem } from '@/components/users/UserListItem';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database.types';

export function Search() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const [debouncedQuery, setDebouncedQuery] = useState(query);

    // Debounce effect
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedQuery(query);
        }, 500); // Wait 500ms after stopped typing

        return () => clearTimeout(timer);
    }, [query]);

    // Search effect
    useEffect(() => {
        const searchUsers = async () => {
            if (!debouncedQuery.trim()) {
                setResults([]);
                return;
            }

            setLoading(true);
            try {
                // Call the Postgres function we just created
                const { data, error } = await supabase
                    .rpc('p_users_search', { query: debouncedQuery });

                if (error) throw error;
                // Cast logic/type safety could be improved here but this works for now
                setResults((data as any[]) || []);
            } catch (err) {
                console.error('Error searching users:', err);
                setResults([]);
            } finally {
                setLoading(false);
            }
        };

        searchUsers();
    }, [debouncedQuery]);

    const handleClear = () => {
        setQuery('');
        setResults([]);
    };

    return (
        <div className="max-w-md mx-auto pb-20 pt-4 px-4">
            <h1 className="text-2xl font-black italic uppercase tracking-tighter mb-6">Explorar</h1>

            <div className="relative mb-6">
                <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar atletas..."
                    className="pl-10 pr-10 h-12 rounded-2xl bg-gray-100 border-transparent focus:bg-white transition-all text-base"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-gray-200 text-gray-500 hover:bg-gray-300"
                    >
                        <X className="h-3 w-3" />
                    </button>
                )}
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex justify-center py-8">
                        <Spinner />
                    </div>
                ) : results.length > 0 ? (
                    <div className="space-y-2">
                        {results.map((user) => (
                            <UserListItem key={user.id} user={user} />
                        ))}
                    </div>
                ) : query ? (
                    <div className="text-center py-10 opacity-50">
                        <p className="text-sm font-bold">No se encontraron usuarios</p>
                    </div>
                ) : (
                    <div className="text-center py-10 opacity-30">
                        <SearchIcon className="h-12 w-12 mx-auto mb-2" />
                        <p className="text-sm font-bold">Busca a tus amigos para lockear</p>
                    </div>
                )}
            </div>
        </div>
    );
}
