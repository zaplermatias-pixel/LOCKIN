import { useState } from 'react';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { MessageSquare, Send, Trash2, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Spinner } from '@/components/ui/spinner';

interface CommentsSectionProps {
    workoutId: string;
    isLocked: boolean;
    className?: string;
}

export function CommentsSection({ workoutId, isLocked, className }: CommentsSectionProps) {
    const { user: currentUser } = useAuth();
    const { comments, loading, isSubmitting, addComment, deleteComment } = useComments(workoutId);
    const [newComment, setNewComment] = useState('');
    const [isExpanded, setIsExpanded] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newComment.trim() || isSubmitting) return;

        const success = await addComment(newComment);
        if (success) {
            setNewComment('');
        }
    };

    if (isLocked) {
        return (
            <div className="mt-4 p-4 bg-gray-50/50 rounded-2xl border border-dashed border-gray-200">
                <div className="flex items-center gap-3 opacity-40">
                    <MessageSquare className="h-4 w-4" />
                    <p className="text-xs font-bold uppercase italic tracking-wider">Entrena hoy para ver los comentarios</p>
                </div>
            </div>
        );
    }

    return (
        <div className={cn("mt-4 space-y-4", className)}>
            {/* Header / Toggle */}
            <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 text-xs font-black uppercase italic tracking-widest text-primary/40 hover:text-primary transition-colors"
            >
                <MessageSquare className="h-4 w-4" />
                <span>
                    {comments.length} {comments.length === 1 ? 'Comentario' : 'Comentarios'}
                </span>
                {loading && <Loader2 className="h-3 w-3 animate-spin" />}
            </button>

            {isExpanded && (
                <div className="space-y-4 animate-in fade-in slide-in-from-top-2 duration-300">
                    {/* List */}
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2 scrollbar-hide">
                        {loading && comments.length === 0 ? (
                            <div className="py-4 flex justify-center">
                                <Spinner size="sm" />
                            </div>
                        ) : comments.length === 0 ? (
                            <p className="text-center py-4 text-xs font-bold text-gray-400 italic">No hay comentarios aún. ¡Sé el primero!</p>
                        ) : (
                            comments.map((comment) => (
                                <div key={comment.id} className="group flex gap-3">
                                    <Avatar className="h-7 w-7 border border-gray-100 shrink-0">
                                        <AvatarImage src={comment.user.profile_picture_url || ''} />
                                        <AvatarFallback className="text-[10px] bg-primary/5 text-primary">
                                            {comment.user.username[0].toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className="text-[11px] font-black italic text-gray-900">
                                                {comment.user.display_name}
                                            </p>
                                            <span className="text-[9px] font-bold text-gray-400">
                                                {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
                                            </span>
                                        </div>
                                        <div className="relative group/content flex items-start justify-between gap-2">
                                            <p className="text-sm text-gray-600 leading-tight">
                                                {comment.content}
                                            </p>
                                            {currentUser?.id === comment.user_id && (
                                                <button
                                                    onClick={() => deleteComment(comment.id)}
                                                    className="opacity-0 group-hover:opacity-100 p-1 text-red-300 hover:text-red-500 transition-all"
                                                >
                                                    <Trash2 className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Input */}
                    <form onSubmit={handleSubmit} className="flex gap-2">
                        <Input
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            placeholder="Escribe un comentario..."
                            disabled={isSubmitting}
                            className="h-9 rounded-xl bg-gray-50 border-transparent focus:bg-white text-sm"
                        />
                        <Button
                            type="submit"
                            disabled={isSubmitting || !newComment.trim()}
                            size="icon"
                            className="h-9 w-9 shrink-0 rounded-xl bg-primary text-white"
                        >
                            {isSubmitting ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                                <Send className="h-4 w-4" />
                            )}
                        </Button>
                    </form>
                </div>
            )}
        </div>
    );
}
