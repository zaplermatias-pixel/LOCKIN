import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface GroupMessage {
    id: string;
    group_id: string;
    user_id: string;
    content: string;
    created_at: string;
    user?: {
        username: string;
        display_name: string | null;
        profile_picture_url: string | null;
    };
}

export function useGroupMessages(groupId: string) {
    const { user } = useAuth();
    const [messages, setMessages] = useState<GroupMessage[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch History
    const fetchMessages = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('group_messages')
                .select(`
                    *,
                    user:user_id(username, display_name, profile_picture_url)
                `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Mark as read when fetching history
            if (data && data.length > 0) {
                const lastMsg = data[data.length - 1];
                markAsRead(lastMsg.id);
            }
        } catch (err) {
            console.error('Error fetching group messages:', err);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    // 2. Mark as Read
    const markAsRead = useCallback(async (messageId?: string) => {
        if (!user || !groupId) return;

        try {
            const { error } = await supabase
                .from('group_message_reads')
                .upsert({
                    user_id: user.id,
                    group_id: groupId,
                    last_read_message_id: messageId,
                    updated_at: new Date().toISOString()
                }, {
                    onConflict: 'user_id,group_id'
                });

            if (error) throw error;
        } catch (err) {
            console.error('Error marking group as read:', err);
        }
    }, [user, groupId]);

    // 3. Send Message
    const sendGroupMessage = async (content: string) => {
        if (!user || !content.trim() || !groupId) return null;
        try {
            const { data, error } = await supabase
                .from('group_messages')
                .insert({
                    group_id: groupId,
                    user_id: user.id,
                    content: content.trim()
                })
                .select(`
                    *,
                    user:user_id(username, display_name, profile_picture_url)
                `)
                .single();

            if (error) throw error;

            // Mark as read after sending
            markAsRead(data.id);

            return data;
        } catch (err) {
            console.error('Error sending group message:', err);
            throw err;
        }
    };

    // 4. Real-time Subscription
    useEffect(() => {
        if (!groupId) return;

        const channel = supabase
            .channel(`group_chat:${groupId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages',
                    filter: `group_id=eq.${groupId}`
                },
                async (payload) => {
                    const newMsg = payload.new;

                    // Fetch user info for the new message
                    const { data: userData } = await supabase
                        .from('users')
                        .select('username, display_name, profile_picture_url')
                        .eq('id', newMsg.user_id)
                        .single();

                    const completeMsg: GroupMessage = {
                        ...(newMsg as any),
                        user: userData
                    };

                    setMessages(prev => {
                        if (prev.some(m => m.id === completeMsg.id)) return prev;
                        return [...prev, completeMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, markAsRead]);

    return {
        messages,
        loading,
        fetchMessages,
        sendGroupMessage,
        setMessages,
        markAsRead
    };
}
