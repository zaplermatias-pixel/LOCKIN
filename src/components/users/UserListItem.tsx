import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { UserPlus, UserCheck } from 'lucide-react';
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
            className="flex items-center justify-between p-3 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all cursor-pointer"
        >
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 border border-gray-200">
                    <AvatarImage src={user.profile_picture_url || ''} />
                    <AvatarFallback className="bg-primary/10 text-primary font-bold">
                        {user.username?.[0]?.toUpperCase()}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-bold text-sm text-gray-900 leading-none mb-1">{user.display_name}</p>
                    <p className="text-xs text-gray-500 font-medium">@{user.username}</p>
                </div>
            </div>

            {action && (
                <div onClick={(e) => e.stopPropagation()}>
                    {action}
                </div>
            )}
        </div>
    );
}
