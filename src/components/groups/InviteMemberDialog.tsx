import { useState } from 'react';
import { useUserSearch } from '@/hooks/useUserSearch';
import { useGroups } from '@/hooks/useGroups';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Send, UserCheck, Loader2 } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface InviteMemberDialogProps {
    groupId: string;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
}

export function InviteMemberDialog({ groupId, isOpen, onOpenChange }: InviteMemberDialogProps) {
    const { query, setQuery, results, loading: searchLoading } = useUserSearch();
    const { inviteMember } = useGroups();
    const [invitingIds, setInvitingIds] = useState<Set<string>>(new Set());
    const [invitedIds, setInvitedIds] = useState<Set<string>>(new Set());

    const handleInvite = async (userId: string) => {
        setInvitingIds(prev => new Set(prev).add(userId));
        try {
            await inviteMember(groupId, userId);
            setInvitedIds(prev => new Set(prev).add(userId));
        } catch (error) {
            console.error('Failed to invite user:', error);
        } finally {
            setInvitingIds(prev => {
                const next = new Set(prev);
                next.delete(userId);
                return next;
            });
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[2.5rem] border-none p-8 max-w-[90vw] sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-black text-left">Invitar Miembros</DialogTitle>
                    <DialogDescription className="text-gray-400 font-bold text-left">
                        Busca atletas para que se unan a tu Lock-In.
                    </DialogDescription>
                </DialogHeader>

                <div className="mt-4 relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <Input
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="Nombre de usuario..."
                        className="pl-10 h-14 rounded-2xl bg-gray-50 border-none focus:ring-2 focus:ring-primary/20 font-bold"
                    />
                </div>

                <div className="mt-6 max-h-[40vh] overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                    {searchLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
                        </div>
                    ) : results.length > 0 ? (
                        results.map((user) => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-gray-50 hover:bg-primary/5 rounded-2xl transition-all border border-transparent hover:border-primary/10">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 border border-white shadow-sm">
                                        <AvatarImage src={user.profile_picture_url || ''} />
                                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-black italic">
                                            {user.username?.[0]?.toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div className="overflow-hidden">
                                        <p className="font-black text-xs text-gray-900 truncate max-w-[120px] uppercase italic">{user.display_name || user.username}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">@{user.username}</p>
                                    </div>
                                </div>

                                {invitedIds.has(user.id) ? (
                                    <div className="bg-green-100 text-green-600 p-2 rounded-xl">
                                        <UserCheck className="h-4 w-4" />
                                    </div>
                                ) : (
                                    <Button
                                        onClick={() => handleInvite(user.id)}
                                        disabled={invitingIds.has(user.id)}
                                        size="sm"
                                        className="rounded-xl h-9 px-4 gap-2 bg-primary text-white font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all"
                                    >
                                        {invitingIds.has(user.id) ? (
                                            <Loader2 className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Send className="h-3 w-3" />
                                        )}
                                        {invitingIds.has(user.id) ? '...' : 'Invitar'}
                                    </Button>
                                )}
                            </div>
                        ))
                    ) : query && !searchLoading ? (
                        <p className="text-center py-10 text-xs font-bold text-gray-400 uppercase italic">No hemos encontrado a nadie 🏜️</p>
                    ) : null}
                </div>
            </DialogContent>
        </Dialog>
    );
}
