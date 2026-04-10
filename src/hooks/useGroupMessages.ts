import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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
    const queryClient = useQueryClient();

    // 1. Fetch History Query
    const { 
        data: messages = [], 
        isLoading: loading,
        refetch: fetchMessages 
    } = useQuery({
        queryKey: ['group-messages', groupId],
        queryFn: async () => {
            if (!groupId) return [];
            const { data, error } = await supabase
                .from('group_messages')
                .select(`
                    *,
                    user:user_id(username, display_name, profile_picture_url)
                `)
                .eq('group_id', groupId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            // Mark as read side effect
            if (data && data.length > 0) {
                const lastMsg = data[data.length - 1];
                markAsReadMutation.mutate({ messageId: lastMsg.id });
            }

            return data as GroupMessage[];
        },
        enabled: !!groupId && groupId !== 'undefined',
    });

    // 2. Mark as Read Mutation
    const markAsReadMutation = useMutation({
        mutationFn: async ({ messageId }: { messageId?: string }) => {
            if (!user || !groupId) return;
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
        }
    });

    // 3. Send Message Mutation
    const sendGroupMessageMutation = useMutation({
        mutationFn: async (content: string) => {
            if (!user || !content.trim() || !groupId) return null;
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
        },
        onSuccess: (newMessage) => {
            if (newMessage) {
                queryClient.setQueryData(['group-messages', groupId], (prev: any) => [...(prev || []), newMessage]);
                markAsReadMutation.mutate({ messageId: newMessage.id });
            }
        }
    });

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

                    queryClient.setQueryData(['group-messages', groupId], (prev: any) => {
                        const messages = prev || [];
                        if (messages.some((m: any) => m.id === completeMsg.id)) return messages;
                        return [...messages, completeMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [groupId, queryClient]);

    return {
        messages,
        loading,
        fetchMessages,
        sendGroupMessage: sendGroupMessageMutation.mutateAsync,
        isSending: sendGroupMessageMutation.isPending,
        markAsRead: (id?: string) => markAsReadMutation.mutate({ messageId: id })
    };
}
