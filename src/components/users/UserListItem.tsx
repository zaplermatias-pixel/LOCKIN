import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { FollowButton } from './FollowButton';
import type { User } from '@/types/database.types';
import { useNavigate } from 'react-router-dom';

interface UserListItemProps {
    user: User;
    action?: React.ReactNode;
}

export function UserListItem({ user, action }: UserListItemProps) {
    const navigate = useNavigate();

    return (
        <div
            onClick={() => navigate(`/profile/${user.id}`)}
            className="flex items-center justify-between p-4 rounded-3xl bg-white/60 dark:bg-dark-card/30 border border-sand/30 dark:border-white/10 shadow-sm hover:shadow-md transition-all cursor-pointer group hover:bg-primary/5 dark:hover:bg-beige/5"
        >
            <div className="flex items-center gap-4">
                <Avatar className="h-12 w-12 border-2 border-white dark:border-dark-surface shadow-md ring-2 ring-primary/5 dark:ring-beige/5">
                    <AvatarImage src={user.profile_picture_url || ''} />
                    <AvatarFallback className="bg-primary/10 dark:bg-beige/10 text-primary dark:text-beige font-black italic">
                        {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-black text-sm text-primary dark:text-beige leading-none mb-1 uppercase italic tracking-tight">{user.display_name}</p>
                    <p className="text-[10px] text-primary/40 dark:text-beige/40 font-bold uppercase tracking-widest">@{user.username}</p>
                </div>
            </div>

            {action ? (
                <div onClick={(e) => e.stopPropagation()}>
                    {action}
                </div>
            ) : (
                <div onClick={(e) => e.stopPropagation()}>
                    <FollowButton targetUserId={user.id} />
                </div>
            )}
        </div>
    );
}
