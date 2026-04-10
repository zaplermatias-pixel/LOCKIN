import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Group } from '@/types/database.types';

export function useGroups() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // 1. Fetch Groups Query
    const { 
        data: groups = [], 
        isLoading: loadingGroups, 
        error: groupsError,
        refetch: fetchGroups 
    } = useQuery({
        queryKey: ['groups', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data: memberships, error } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    groups (*)
                `)
                .eq('user_id', user.id);

            if (error) throw error;
            return (memberships as any[])
                .map(m => m.groups)
                .filter(g => g !== null) as unknown as Group[];
        },
        enabled: !!user,
    });

    // 2. Fetch Invites Query
    const { 
        data: invites = [], 
        isLoading: loadingInvites,
        refetch: fetchInvites
    } = useQuery({
        queryKey: ['group-invites', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error: inviteError } = await supabase
                .from('group_invites')
                .select(`
                    *,
                    groups (*),
                    inviter:inviter_id (username, display_name)
                `)
                .eq('invitee_id', user.id)
                .eq('status', 'pending');

            if (inviteError) throw inviteError;
            return data || [];
        },
        enabled: !!user,
    });

    // 3. Create Group Mutation
    const createGroupMutation = useMutation({
        mutationFn: async ({ name, description, isPrivate = false }: { name: string, description: string, isPrivate?: boolean }) => {
            if (!user) throw new Error('Usuario no autenticado');

            const { data: group, error: createError } = await supabase
                .from('groups')
                .insert({ name, description, is_private: isPrivate, created_by: user.id })
                .select()
                .single();

            if (createError) throw createError;
            if (!group) throw new Error('Failed to create group');

            const { error: memberError } = await supabase
                .from('group_members')
                .insert({ group_id: group.id, user_id: user.id, role: 'admin' });

            if (memberError) throw memberError;
            return group;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups', user?.id] });
        }
    });

    // 4. Invite Member Mutation
    const inviteMemberMutation = useMutation({
        mutationFn: async ({ groupId, inviteeId }: { groupId: string, inviteeId: string }) => {
            if (!user) return null;
            const { data, error: inviteError } = await supabase
                .from('group_invites')
                .insert({ group_id: groupId, inviter_id: user.id, invitee_id: inviteeId, status: 'pending' })
                .select()
                .single();

            if (inviteError) throw inviteError;

            // Notification
            try {
                const { data: groupData } = await supabase
                    .from('groups')
                    .select('name')
                    .eq('id', groupId)
                    .single();

                await supabase.from('notifications').insert({
                    user_id: inviteeId,
                    actor_id: user.id,
                    type: 'invite',
                    resource_id: groupId,
                    message: `te invitó al grupo "${groupData?.name || 'un grupo'}"`
                });
            } catch (err) {
                console.error('Error sending notification:', err);
            }
            return data;
        }
    });

    // 5. Respond to Invite Mutation
    const respondToInviteMutation = useMutation({
        mutationFn: async ({ inviteId, groupId, status }: { inviteId: string, groupId: string, status: 'accepted' | 'rejected' }) => {
            if (!user) return;
            const { error: updateError } = await supabase
                .from('group_invites')
                .update({ status })
                .eq('id', inviteId);

            if (updateError) throw updateError;

            if (status === 'accepted') {
                const { error: memberError } = await supabase
                    .from('group_members')
                    .insert({ group_id: groupId, user_id: user.id, role: 'member' });
                if (memberError) throw memberError;
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups', user?.id] });
            queryClient.invalidateQueries({ queryKey: ['group-invites', user?.id] });
        }
    });

    // 6. Update Group Mutation
    const updateGroupMutation = useMutation({
        mutationFn: async ({ groupId, updates }: { groupId: string, updates: Partial<Group> }) => {
            const { data, error } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', groupId)
                .select()
                .single();
            if (error) throw error;
            return data;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['groups', user?.id] });
        }
    });

    const uploadGroupImage = async (file: File) => {
        if (!user) return null;
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const filePath = `group-covers/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from('group-images')
            .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
            .from('group-images')
            .getPublicUrl(filePath);

        return publicUrl;
    };

    return {
        groups,
        invites,
        loading: loadingGroups || loadingInvites,
        error: groupsError ? (groupsError as any).message : null,
        fetchGroups,
        createGroup: (name: string, description: string, isPrivate?: boolean) => createGroupMutation.mutateAsync({ name, description, isPrivate }),
        inviteMember: (groupId: string, inviteeId: string) => inviteMemberMutation.mutateAsync({ groupId, inviteeId }),
        fetchInvites,
        respondToInvite: (inviteId: string, groupId: string, status: 'accepted' | 'rejected') => respondToInviteMutation.mutateAsync({ inviteId, groupId, status }),
        updateGroup: (groupId: string, updates: Partial<Group>) => updateGroupMutation.mutateAsync({ groupId, updates }),
        uploadGroupImage,
        isCreating: createGroupMutation.isPending,
        isUpdating: updateGroupMutation.isPending
    };
}
