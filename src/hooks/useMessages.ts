import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';

export interface Message {
    id: string;
    sender_id: string;
    receiver_id: string;
    content: string;
    is_read: boolean;
    created_at: string;
    sender?: {
        username: string;
        display_name: string | null;
        profile_picture_url: string | null;
    };
    receiver?: {
        username: string;
        display_name: string | null;
        profile_picture_url: string | null;
    };
}

export function useMessages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<any[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch Inbox (all unique conversations)
    const fetchConversations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // This is a bit tricky in Supabase/Postgrest without a dedicated view.
            // We'll get all messages where the user is participant and group them in JS for now.
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(id, username, display_name, profile_picture_url),
                    receiver:receiver_id(id, username, display_name, profile_picture_url)
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (error) throw error;

            // Group by the "other" user
            const groups: Record<string, any> = {};
            (data || []).forEach(msg => {
                const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
                if (!groups[otherUser.id]) {
                    groups[otherUser.id] = {
                        user: otherUser,
                        lastMessage: msg,
                        unreadCount: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0
                    };
                } else if (!msg.is_read && msg.receiver_id === user.id) {
                    groups[otherUser.id].unreadCount++;
                }
            });

            setConversations(Object.values(groups));
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // 2. Fetch Chat History
    const fetchMessages = useCallback(async (otherUserId: string) => {
        if (!user || !otherUserId) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(username, display_name, profile_picture_url),
                    receiver:receiver_id(username, display_name, profile_picture_url)
                `)
                .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
                .order('created_at', { ascending: true });

            if (error) throw error;
            setMessages(data || []);

            // Mark as read
            await supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', otherUserId)
                .eq('receiver_id', user.id)
                .eq('is_read', false);

        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // 3. Send Message
    const sendMessage = async (receiverId: string, content: string) => {
        if (!user || !content.trim()) return null;
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert({
                    sender_id: user.id,
                    receiver_id: receiverId,
                    content: content.trim()
                })
                .select(`
                    *,
                    sender:sender_id(username, display_name, profile_picture_url),
                    receiver:receiver_id(username, display_name, profile_picture_url)
                `)
                .single();

            if (error) throw error;
            return data;
        } catch (err) {
            console.error('Error sending message:', err);
            throw err;
        }
    };

    return {
        conversations,
        messages,
        loading,
        fetchConversations,
        fetchMessages,
        sendMessage,
        setMessages
    };
}
