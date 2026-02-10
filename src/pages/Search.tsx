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
        <div className="max-w-md mx-auto pb-24 pt-4 px-4 min-h-screen">
            <h1 className="text-3xl font-black italic uppercase tracking-tighter mb-8 text-primary dark:text-beige">Explorar</h1>

            <div className="relative mb-10">
                <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 dark:text-beige/30" />
                <Input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar atletas..."
                    className="pl-12 h-14 rounded-2xl bg-white/50 dark:bg-dark-surface/50 border-sand/30 dark:border-white/10 font-bold focus-visible:ring-primary/20 dark:focus-visible:ring-beige/20 text-primary dark:text-beige transition-all"
                />
                {query && (
                    <button
                        onClick={handleClear}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-primary/5 dark:bg-beige/5 text-primary/40 dark:text-beige/40 hover:bg-red-500 hover:text-white transition-all shadow-sm"
                    >
                        <X className="h-4 w-4" />
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
                    <div className="text-center py-10 opacity-50 text-primary dark:text-beige">
                        <p className="text-sm font-bold uppercase tracking-widest italic">No se encontraron usuarios</p>
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white/40 dark:bg-dark-surface/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-sand/30 dark:border-white/10 ring-1 ring-sand/20 dark:ring-white/5 transition-colors">
                        <div className="bg-sand/30 dark:bg-white/5 p-8 rounded-[2.5rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <SearchIcon className="h-10 w-10 text-primary/20 dark:text-beige/20" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary/40 dark:text-beige/40 mb-2">Busca Amigos</h3>
                        <p className="text-[10px] font-bold text-primary/30 dark:text-beige/30 max-w-[200px] mx-auto px-4 leading-relaxed uppercase tracking-widest opacity-60">Encuentra a tus compañeros de entrenamiento.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
