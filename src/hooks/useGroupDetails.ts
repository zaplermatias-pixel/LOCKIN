import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import type { Group, GroupMember, WorkoutWithDetails } from '@/types/database.types';

export function useGroupDetails(groupId: string) {
    const [group, setGroup] = useState<Group | null>(null);
    const [members, setMembers] = useState<(GroupMember & { users: { username: string; display_name: string | null; profile_picture_url: string | null } })[]>([]);
    const [activity, setActivity] = useState<WorkoutWithDetails[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchDetails = useCallback(async () => {
        if (!groupId) return;
        setLoading(true);
        setError(null);

        try {
            // 1. Fetch group info
            const { data: groupData, error: groupError } = await supabase
                .from('groups')
                .select('*')
                .eq('id', groupId)
                .single();

            if (groupError) throw groupError;
            setGroup(groupData);

            // 2. Fetch members with user details
            const { data: memberData, error: memberError } = await supabase
                .from('group_members')
                .select(`
                    *,
                    users (
                        username,
                        display_name,
                        profile_picture_url
                    )
                `)
                .eq('group_id', groupId);

            if (memberError) throw memberError;
            setMembers(memberData as any);

            // 3. Fetch group activity (workouts from these members)
            const userIds = memberData.map(m => m.user_id);

            if (userIds.length > 0) {
                const { data: workoutData, error: workoutError } = await supabase
                    .from('workouts')
                    .select(`
                        *,
                        users (
                            id,
                            username,
                            display_name,
                            profile_picture_url
                        ),
                        workout_media (
                            id,
                            media_type,
                            media_url,
                            thumbnail_url,
                            order_index
                        ),
                        workout_muscles (
                            muscle_group
                        )
                    `)
                    .in('user_id', userIds)
                    .eq('is_deleted', false)
                    .order('workout_date', { ascending: false })
                    .limit(20);

                if (workoutError) throw workoutError;
                setActivity(workoutData as WorkoutWithDetails[]);
            }

        } catch (err: any) {
            console.error('Error fetching group details:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [groupId]);

    return {
        group,
        members,
        activity,
        loading,
        error,
        fetchDetails
    };
}
