import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Notification {
    id: string;
    user_id: string;
    actor_id: string;
    type: 'follow' | 'comment' | 'workout' | 'invite';
    resource_id?: string;
    message?: string;
    is_read: boolean;
    created_at: string;
    actor?: {
        username: string;
        display_name: string | null;
        profile_picture_url: string | null;
    };
}

export function useNotifications() {
    const { user } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    const fetchNotifications = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('notifications')
                .select(`
                    *,
                    actor:actor_id(username, display_name, profile_picture_url)
                `)
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(20);

            if (error) throw error;
            setNotifications(data || []);
            setUnreadCount((data || []).filter(n => !n.is_read).length);
        } catch (err) {
            console.error('Error fetching notifications:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const markAsRead = async (notificationId: string) => {
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('id', notificationId);

            if (error) throw error;

            setNotifications(prev =>
                prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n)
            );
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (err) {
            console.error('Error marking notification as read:', err);
        }
    };

    const markAllAsRead = async () => {
        if (!user) return;
        try {
            const { error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (error) throw error;

            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error('Error marking all notifications as read:', err);
        }
    };

    // Real-time subscription
    useEffect(() => {
        if (!user) return;

        const channel = supabase
            .channel(`notifications:${user.id}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                    filter: `user_id=eq.${user.id}`
                },
                async (payload) => {
                    const newNotif = payload.new;

                    // Fetch actor data
                    const { data: actorData } = await supabase
                        .from('users')
                        .select('username, display_name, profile_picture_url')
                        .eq('id', newNotif.actor_id)
                        .single();

                    const completeNotif: Notification = {
                        ...(newNotif as any),
                        actor: actorData
                    };

                    setNotifications(prev => [completeNotif, ...prev].slice(0, 20));
                    setUnreadCount(prev => prev + 1);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user]);

    return {
        notifications,
        unreadCount,
        loading,
        fetchNotifications,
        markAsRead,
        markAllAsRead
    };
}
