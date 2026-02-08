// ============================================
// LOCKIN - DEFINICIÓN DE TIPOS TYPESCRIPT
// ============================================

export type User = {
    id: string; // UUID de auth.users
    email: string;
    username: string;
    display_name: string | null;
    bio: string | null;
    profile_picture_url: string | null;
    account_type: 'public' | 'private';
    created_at: string;
    updated_at: string;
    last_workout_date: string | null;
    current_streak: number;
    total_workouts: number;
    show_streak: boolean;
    show_goals: boolean;
    push_notifications_enabled: boolean;
    reminder_time: string | null;
    reminder_enabled: boolean;
};

export type Workout = {
    id: string;
    user_id: string;
    created_at: string;
    workout_date: string;
    description: string | null;
    activity_type: 'gym' | 'run' | 'bike' | 'swim' | 'hike' | 'yoga' | 'crossfit' | 'sports' | 'other';
    location: string | null;
    song_name: string | null;
    song_artist: string | null;
    is_deleted: boolean;
};

export type WorkoutMedia = {
    id: string;
    workout_id: string;
    media_type: 'photo' | 'video';
    media_url: string;
    thumbnail_url: string | null;
    order_index: number;
    created_at: string;
};

export type WorkoutMuscle = {
    id: string;
    workout_id: string;
    muscle_group: 'chest' | 'back' | 'legs' | 'shoulders' | 'arms' | 'abs' | 'glutes' | 'cardio' | 'full_body';
};

export type Friendship = {
    id: string;
    follower_id: string;
    followed_id: string;
    status: 'pending' | 'accepted' | 'rejected';
    created_at: string;
    updated_at: string;
};

export type Group = {
    id: string;
    name: string;
    description: string | null;
    image_url: string | null;
    created_by: string;
    created_at: string;
    is_private: boolean;
};

export type GroupMember = {
    id: string;
    group_id: string;
    user_id: string;
    role: 'admin' | 'member';
    joined_at: string;
};

export type Comment = {
    id: string;
    workout_id: string;
    user_id: string;
    content: string;
    created_at: string;
    is_deleted: boolean;
};

// Tipos compuestos para el Feed y UI
export type WorkoutWithDetails = Workout & {
    users: Pick<User, 'id' | 'username' | 'display_name' | 'profile_picture_url'>;
    workout_media: WorkoutMedia[];
    workout_muscles: { muscle_group: string }[];
    comments_count?: number;
};

// Tipos auxiliares de API y Auth
export type AuthUser = {
    id: string;
    email?: string;
};

export type ApiResponse<T> = {
    data: T | null;
    error: string | null;
};

export type SupabaseError = {
    message: string;
    details?: string;
    hint?: string;
    code?: string;
};
