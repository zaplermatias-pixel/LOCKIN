import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/context/AuthContext';
import type { Group } from '@/types/database.types';

export function useGroups() {
    const { user } = useAuth();
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchGroups = useCallback(async () => {
        if (!user) {
            console.log('useGroups: [SKIP] No user');
            setLoading(false);
            return;
        }
        console.log('useGroups: [START] Fetching groups');
        setLoading(true);
        setError(null);
        try {
            // Fetch groups where the user is a member
            const { data: memberships, error: memberError } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    groups (*)
                `)
                .eq('user_id', user.id);

            if (memberError) throw memberError;

            // Extract the actual group objects
            const userGroups = (memberships as any[])
                .map(m => m.groups)
                .filter(g => g !== null) as unknown as Group[];

            setGroups(userGroups);
        } catch (err: any) {
            console.error('Error fetching groups:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [user]);

    const createGroup = async (name: string, description: string, isPrivate: boolean = false) => {
        if (!user) return null;
        try {
            // 1. Create Group
            const { data: group, error: createError } = await supabase
                .from('groups')
                .insert({
                    name,
                    description,
                    is_private: isPrivate,
                    created_by: user.id
                })
                .select()
                .single();

            if (createError) throw createError;
            if (!group) throw new Error('Failed to create group');

            // 2. Add creator as admin
            const { error: memberError } = await supabase
                .from('group_members')
                .insert({
                    group_id: group.id,
                    user_id: user.id,
                    role: 'admin'
                });

            if (memberError) {
                // Rollback (optional but good practice) - for now just throw
                throw memberError;
            }

            // Refresh list
            await fetchGroups();
            return group;
        } catch (err: any) {
            console.error('Error creating group:', err);
            throw err;
        }
    };

    const inviteMember = async (groupId: string, inviteeId: string) => {
        if (!user) return null;
        try {
            const { data, error: inviteError } = await supabase
                .from('group_invites')
                .insert({
                    group_id: groupId,
                    inviter_id: user.id,
                    invitee_id: inviteeId,
                    status: 'pending'
                })
                .select()
                .single();

            if (inviteError) throw inviteError;
            return data;
        } catch (err: any) {
            console.error('Error sending invite:', err);
            throw err;
        }
    };

    const [invites, setInvites] = useState<any[]>([]);

    const fetchInvites = useCallback(async () => {
        if (!user) return;
        try {
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
            setInvites(data || []);
        } catch (err) {
            console.error('Error fetching invites:', err);
        }
    }, [user]);

    const respondToInvite = async (inviteId: string, groupId: string, status: 'accepted' | 'rejected') => {
        if (!user) return;
        try {
            // 1. Update invite status
            const { error: updateError } = await supabase
                .from('group_invites')
                .update({ status })
                .eq('id', inviteId);

            if (updateError) throw updateError;

            // 2. If accepted, add to group_members
            if (status === 'accepted') {
                const { error: memberError } = await supabase
                    .from('group_members')
                    .insert({
                        group_id: groupId,
                        user_id: user.id,
                        role: 'member'
                    });

                if (memberError) throw memberError;
            }

            // Refresh lists
            await fetchInvites();
            await fetchGroups();
        } catch (err) {
            console.error('Error responding to invite:', err);
            throw err;
        }
    };

    const updateGroup = async (groupId: string, updates: Partial<Group>) => {
        if (!user) return null;
        try {
            const { data, error: updateError } = await supabase
                .from('groups')
                .update(updates)
                .eq('id', groupId)
                .select()
                .single();

            if (updateError) throw updateError;
            await fetchGroups();
            return data;
        } catch (err: any) {
            console.error('Error updating group:', err);
            throw err;
        }
    };

    const uploadGroupImage = async (file: File) => {
        if (!user) return null;
        try {
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
        } catch (err: any) {
            console.error('Error uploading group image:', err);
            throw err;
        }
    };

    return {
        groups,
        invites,
        loading,
        error,
        fetchGroups,
        createGroup,
        inviteMember,
        fetchInvites,
        respondToInvite,
        updateGroup,
        uploadGroupImage
    };
}
