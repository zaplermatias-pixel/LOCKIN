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
        } catch (err) {
            console.error('Error fetching group messages:', err);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    // 2. Send Message
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
            return data;
        } catch (err) {
            console.error('Error sending group message:', err);
            throw err;
        }
    };

    // 3. Real-time Subscription
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

                    // Since payload.new doesn't include joined user data, 
                    // we fetch the user info for the new message
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
                        // Prevent duplicates (e.g. if the sender also updates locally)
                        if (prev.some(m => m.id === completeMsg.id)) return prev;
                        return [...prev, completeMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId]);

    return {
        messages,
        loading,
        fetchMessages,
        sendGroupMessage,
        setMessages
    };
}
