import { Button } from '@/components/ui/button';
import { useFriendships } from '@/hooks/useFriendships';
import { UserPlus, UserCheck, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils'; // Assuming you have a utils file for classnames

interface FollowButtonProps {
    targetUserId: string;
    className?: string;
}

export function FollowButton({ targetUserId, className }: FollowButtonProps) {
    const { isFollowing, loading, toggleFollow } = useFriendships(targetUserId);

    // Prevent interaction while loading initial state
    if (loading) {
        return (
            <Button disabled variant="ghost" size="sm" className={className}>
                <Loader2 className="h-4 w-4 animate-spin" />
            </Button>
        );
    }

    return (
        <Button
            onClick={(e) => {
                e.stopPropagation(); // Prevent clicking the row if inside a list
                toggleFollow();
            }}
            variant={isFollowing ? "secondary" : "default"}
            className={cn(
                "rounded-full gap-2 transition-all font-bold",
                isFollowing ? "bg-gray-100 text-gray-900 hover:bg-gray-200" : "bg-primary text-white hover:bg-primary/90",
                className
            )}
            size="sm"
        >
            {isFollowing ? (
                <>
                    <UserCheck className="h-4 w-4" />
                    <span>Siguiendo</span>
                </>
            ) : (
                <>
                    <UserPlus className="h-4 w-4" />
                    <span>Seguir</span>
                </>
            )}
        </Button>
    );
}
