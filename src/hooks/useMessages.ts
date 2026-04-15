import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
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

export interface Conversation {
    type: 'individual' | 'group';
    id: string; // userId for individual, groupId for group
    lastMessage: {
        content: string;
        created_at: string;
        sender_id: string;
    };
    unreadCount: number;
    user?: any; // For individual
    group?: any; // For group
}

export function useMessages(otherUserId?: string) {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch Inbox (Conversations)
    const { 
        data: conversations = [], 
        isLoading: loadingConversations,
        refetch: fetchConversations 
    } = useQuery({
        queryKey: ['conversations', user?.id],
        queryFn: async () => {
            if (!user) return [];

            // A. Individual Conversations
            const { data: directMsgs, error: dmError } = await supabase
                .from('messages')
                .select(`
                    *,
                    sender:sender_id(id, username, display_name, profile_picture_url),
                    receiver:receiver_id(id, username, display_name, profile_picture_url)
                `)
                .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
                .order('created_at', { ascending: false });

            if (dmError) throw dmError;

            const dmGroups: Record<string, Conversation> = {};
            (directMsgs || []).forEach(msg => {
                const other = msg.sender_id === user.id ? msg.receiver : msg.sender;
                if (!dmGroups[other.id]) {
                    dmGroups[other.id] = {
                        type: 'individual',
                        id: other.id,
                        user: other,
                        lastMessage: msg,
                        unreadCount: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0
                    };
                } else if (!msg.is_read && msg.receiver_id === user.id) {
                    dmGroups[other.id].unreadCount++;
                }
            });

            // B. Group Conversations
            const { data: memberships, error: memberError } = await supabase
                .from('group_members')
                .select('group_id, groups:group_id (*)')
                .eq('user_id', user.id);

            if (memberError) throw memberError;

            const groupIds = (memberships || []).map(m => m.group_id);
            const groupList: Conversation[] = [];

            if (groupIds.length > 0) {
                const { data: lastGroupMsgs, error: groupMsgError } = await supabase
                    .from('group_messages')
                    .select('*')
                    .in('group_id', groupIds)
                    .order('created_at', { ascending: false });

                if (groupMsgError) throw groupMsgError;

                const { data: readStatus } = await supabase
                    .from('group_message_reads')
                    .select('*')
                    .eq('user_id', user.id);

                (memberships as any[] || []).forEach(m => {
                    const group = m.groups;
                    if (!group) return;

                    const gLastMsg = (lastGroupMsgs || []).find(msg => msg.group_id === group.id);
                    if (!gLastMsg) return;

                    const readRecord = (readStatus || []).find(rs => rs.group_id === group.id);
                    const unreadCount = (lastGroupMsgs || [])
                        .filter(msg =>
                            msg.group_id === group.id &&
                            (!readRecord || new Date(msg.created_at) > new Date(readRecord.updated_at))
                        ).length;

                    groupList.push({
                        type: 'group',
                        id: group.id,
                        group: group,
                        lastMessage: {
                            content: gLastMsg.content,
                            created_at: gLastMsg.created_at,
                            sender_id: gLastMsg.user_id
                        },
                        unreadCount
                    });
                });
            }

            return [
                ...Object.values(dmGroups),
                ...groupList
            ].sort((a, b) => {
                const dateA = new Date(a.lastMessage?.created_at || 0).getTime();
                const dateB = new Date(b.lastMessage?.created_at || 0).getTime();
                return dateB - dateA;
            });
        },
        enabled: !!user,
    });

    // 2. Fetch Chat History (Individual)
    const { 
        data: messages = [], 
        isLoading: loadingMessages,
        refetch: fetchMessages 
    } = useQuery({
        queryKey: ['messages', user?.id, otherUserId],
        queryFn: async () => {
            if (!user || !otherUserId) return [];
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

            // Mark as read side effect
            supabase
                .from('messages')
                .update({ is_read: true })
                .eq('sender_id', otherUserId)
                .eq('receiver_id', user.id)
                .eq('is_read', false)
                .then(() => {
                    // Update unread count in inbox cache
                    queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
                });

            return data.map((msg: any) => ({
                ...msg
            })) as Message[];
        },
        enabled: !!user && !!otherUserId,
    });

    // 3. Send Message Mutation
    const sendMessageMutation = useMutation({
        mutationFn: async ({ receiverId, content }: { receiverId: string, content: string }) => {
            if (!user || !content.trim()) return null;
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
        },
        onSuccess: (newMessage) => {
            if (newMessage) {
                queryClient.setQueryData(['messages', user?.id, otherUserId], (prev: any) => [...(prev || []), newMessage]);
                queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
            }
        }
    });

    // 4. Real-time Subscriptions
    useEffect(() => {
        if (!user) return;

        const channels = [
            supabase.channel('inbox-dm').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages', filter: `receiver_id=eq.${user.id}` }, () => {
                queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
                if (otherUserId) queryClient.invalidateQueries({ queryKey: ['messages', user.id, otherUserId] });
            }),
            supabase.channel('inbox-groups').on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'group_messages' }, () => {
                queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
            }),
            supabase.channel('inbox-updates').on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'messages' }, () => {
                queryClient.invalidateQueries({ queryKey: ['conversations', user.id] });
            })
        ];

        channels.forEach(c => c.subscribe());
        return () => { channels.forEach(c => supabase.removeChannel(c)); };
    }, [user, otherUserId, queryClient]);

    return {
        conversations,
        messages,
        loading: loadingConversations || loadingMessages,
        fetchConversations,
        fetchMessages: (_id: string) => fetchMessages(), // Compatible with old signature but uses query internal
        sendMessage: (receiverId: string, content: string) => sendMessageMutation.mutateAsync({ receiverId, content }),
        isSending: sendMessageMutation.isPending,
        setMessages: (newMessages: any) => queryClient.setQueryData(['messages', user?.id, otherUserId], newMessages)
    };
}
