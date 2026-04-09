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
                "rounded-full gap-2 transition-all font-bold uppercase italic tracking-widest text-[10px]",
                isFollowing ? "bg-sand dark:bg-dark-surface text-primary dark:text-beige hover:bg-sand/80 dark:hover:bg-dark-surface/80 border border-transparent dark:border-white/10 shadow-sm" : "bg-primary dark:bg-beige text-white dark:text-dark-bg hover:opacity-90 shadow-lg shadow-primary/20 dark:shadow-none",
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
