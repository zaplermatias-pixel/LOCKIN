import { createContext, useContext, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import type { User } from '@/types/database.types';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signUp: (email: string, password: string, username: string, displayName: string) => Promise<void>;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
    updateProfile: (updates: Partial<User>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let mounted = true;

        // Escuchar cambios en la sesión (incluye carga inicial)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
            if (!mounted) return;

            setSession(session);

            if (session?.user) {
                await fetchUserProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        // Fail-safe: Asegurar que loading se desactive si Supabase tarda demasiado
        const timeout = setTimeout(() => {
            if (mounted) {
                console.warn('AuthContext: Loading fallback timeout reached');
                setLoading(false);
            }
        }, 8000);

        return () => {
            mounted = false;
            subscription.unsubscribe();
            clearTimeout(timeout);
        };
    }, []);

    const fetchUserProfile = async (userId: string) => {
        try {
            console.log('AuthContext: [DEBUG] fetchUserProfile starting for:', userId);
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('AuthContext: [DEBUG] supabase fetch error:', error);
                if (error.code === 'PGRST116') {
                    console.warn('AuthContext: [DEBUG] Profile missing from DB. Attempting creation...');

                    const { data: { session: currentSession } } = await supabase.auth.getSession();
                    const authUser = currentSession?.user;

                    if (!authUser) {
                        console.error('AuthContext: [DEBUG] Cannot self-heal: No authenticated user found in session');
                        throw new Error('Auth user not found');
                    }

                    const defaultUsername = authUser.email?.split('@')[0] || `user_${userId.substring(0, 5)}`;
                    console.log('AuthContext: [DEBUG] Self-healing with email:', authUser.email);

                    const { data: newProfile, error: insertError } = await supabase
                        .from('users')
                        .insert([{
                            id: userId,
                            email: authUser.email,
                            username: defaultUsername,
                            display_name: defaultUsername,
                            account_type: 'public',
                            current_streak: 0,
                            total_workouts: 0
                        }])
                        .select()
                        .single();

                    if (insertError) {
                        console.error('AuthContext: [DEBUG] Insert failed:', insertError);
                        if (insertError.code === '23505') {
                            console.log('AuthContext: [DEBUG] Conflict 23505, retrying select...');
                            const { data: retryData } = await supabase.from('users').select('*').eq('id', userId).single();
                            if (retryData) {
                                setUser(retryData as User);
                                return;
                            }
                        }
                        throw insertError;
                    }

                    console.log('AuthContext: [DEBUG] Profile created successfully:', newProfile);
                    setUser(newProfile as User);
                    return;
                }
                throw error;
            }

            console.log('AuthContext: [DEBUG] Profile successfully loaded:', data);
            setUser(data as User);
        } catch (error: any) {
            console.error('AuthContext: [FATAL ERROR] in fetchUserProfile:', error);
            setUser(null);
        } finally {
            setLoading(false);
            console.log('AuthContext: [DEBUG] fetchUserProfile operation finished');
        }
    };

    const signUp = async (email: string, password: string, username: string, displayName: string) => {
        try {
            // 1. Registro en Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;
            if (!authData.user) throw new Error('No user data returned from sign up');

            // 2. Crear perfil en la tabla 'users'
            const { error: profileError } = await supabase
                .from('users')
                .insert([
                    {
                        id: authData.user.id,
                        email,
                        username,
                        display_name: displayName,
                        account_type: 'public',
                        current_streak: 0,
                        total_workouts: 0,
                    }
                ]);

            if (profileError) throw profileError;

        } catch (error: any) {
            throw error;
        }
    };

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });
            if (error) throw error;
        } catch (error: any) {
            throw error;
        }
    };

    const signOut = async () => {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            setUser(null);
            setSession(null);
        } catch (error: any) {
            throw error;
        }
    };

    const updateProfile = async (updates: Partial<User>) => {
        const targetId = user?.id || session?.user?.id;
        if (!targetId) {
            console.error('AuthContext: [DEBUG] Cannot update profile: No user ID available in state or session');
            return;
        }

        try {
            console.log('AuthContext: [DEBUG] Updating profile for ID:', targetId, 'with:', updates);
            const { data, error } = await supabase
                .from('users')
                .update(updates)
                .eq('id', targetId)
                .select()
                .single();

            if (error) {
                console.error('AuthContext: [DEBUG] Update query failed:', error);
                throw error;
            }

            console.log('AuthContext: [DEBUG] Profile updated successfully. New data:', data);
            setUser(data as User);
        } catch (error: any) {
            console.error('AuthContext: [FATAL ERROR] in updateProfile:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider value={{ user, session, loading, signUp, signIn, signOut, updateProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
