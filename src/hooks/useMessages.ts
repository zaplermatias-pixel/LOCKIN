import { useState, useCallback, useEffect } from 'react';
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

export function useMessages() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);

    // 1. Fetch Inbox (all unique conversations + groups)
    const fetchConversations = useCallback(async () => {
        if (!user) return;
        setLoading(true);
        try {
            // A. FETCH INDIVIDUAL CONVERSATIONS
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
                const otherUser = msg.sender_id === user.id ? msg.receiver : msg.sender;
                if (!dmGroups[otherUser.id]) {
                    dmGroups[otherUser.id] = {
                        type: 'individual',
                        id: otherUser.id,
                        user: otherUser,
                        lastMessage: msg,
                        unreadCount: (!msg.is_read && msg.receiver_id === user.id) ? 1 : 0
                    };
                } else if (!msg.is_read && msg.receiver_id === user.id) {
                    dmGroups[otherUser.id].unreadCount++;
                }
            });

            // B. FETCH GROUPS AND THEIR LAST MESSAGES
            const { data: memberships, error: memberError } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    groups:group_id (*)
                `)
                .eq('user_id', user.id);

            if (memberError) throw memberError;

            const groupIds = (memberships || []).map(m => m.group_id);
            const groupList: Conversation[] = [];

            if (groupIds.length > 0) {
                // Fetch ONLY the latest message for each group to avoid over-fetching
                const { data: lastGroupMsgs, error: groupMsgError } = await supabase
                    .from('group_messages')
                    .select('*')
                    .in('group_id', groupIds)
                    .order('created_at', { ascending: false });

                // Note: We still get all messages here to calculate unread counts precisely.
                // In a massive app, we'd use a RPC/Stored procedure for this.

                if (groupMsgError) throw groupMsgError;

                // Fetch read status for groups
                const { data: readStatus, error: readError } = await supabase
                    .from('group_message_reads')
                    .select('*')
                    .eq('user_id', user.id);

                if (readError) throw readError;

                (memberships as any[] || []).forEach(m => {
                    const group = m.groups as any;
                    if (!group) return;

                    const lastMsg = (lastGroupMsgs || []).find(msg => msg.group_id === group.id);
                    if (!lastMsg) return;

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
                            content: lastMsg.content,
                            created_at: lastMsg.created_at,
                            sender_id: lastMsg.user_id
                        },
                        unreadCount
                    });
                });
            }

            // C. MERGE AND SORT
            const allConversations = [
                ...Object.values(dmGroups),
                ...groupList
            ].sort((a, b) => {
                const dateA = new Date(a.lastMessage?.created_at || 0).getTime();
                const dateB = new Date(b.lastMessage?.created_at || 0).getTime();
                return dateB - dateA;
            });

            setConversations(allConversations);
        } catch (err) {
            console.error('Error fetching conversations:', err);
        } finally {
            setLoading(false);
        }
    }, [user]);

    // 2. Real-time Inbox Subscription
    useEffect(() => {
        if (!user) return;

        // Subscribe to direct messages
        const dmChannel = supabase
            .channel('inbox-dm')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${user.id}`
                },
                () => {
                    console.log('useMessages: New DM received, refreshing inbox...');
                    fetchConversations();
                }
            )
            .subscribe();

        // Subscribe to group messages (refreshes if any group message arrives)
        const groupChannel = supabase
            .channel('inbox-groups')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'group_messages'
                },
                () => {
                    // We could filter this more precisely, but refreshing for any group message 
                    // is a safe way to ensure the last message in the list is current.
                    console.log('useMessages: New Group message received, refreshing inbox...');
                    fetchConversations();
                }
            )
            .subscribe();

        // Listen for message UPDATES (marking as read)
        const updateChannel = supabase
            .channel('inbox-updates')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'messages'
                },
                () => {
                    console.log('useMessages: Message updated (read status), refreshing inbox...');
                    fetchConversations();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(dmChannel);
            supabase.removeChannel(groupChannel);
            supabase.removeChannel(updateChannel);
        };
    }, [user, fetchConversations]);

    // 3. Fetch Chat History (Individual)
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
