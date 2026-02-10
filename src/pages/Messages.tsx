import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Search, MessageSquare, ChevronRight, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Messages() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const { conversations, loading, fetchConversations } = useMessages();

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return (
        <div className="max-w-md mx-auto pb-24 pt-4 px-4 min-h-screen">
            <header className="flex items-center justify-between mb-8 px-2">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-primary dark:text-beige">Chats</h1>
                <div className="bg-primary/5 dark:bg-beige/5 p-3 rounded-2xl">
                    <MessageSquare className="h-5 w-5 text-primary dark:text-beige opacity-60" />
                </div>
            </header>

            {/* Search Placeholder */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-primary/30 dark:text-beige/30" />
                <Input
                    placeholder="Buscar chats..."
                    className="pl-11 h-14 rounded-2xl bg-white/50 dark:bg-dark-surface/50 border-sand/30 dark:border-white/10 font-bold focus-visible:ring-primary/20 dark:focus-visible:ring-beige/20 text-primary dark:text-beige transition-all"
                />
            </div>

            <div className="space-y-2">
                {loading && conversations.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Spinner />
                    </div>
                ) : conversations.length > 0 ? (
                    conversations.map((conv) => (
                        <div
                            key={conv.id}
                            onClick={() => {
                                if (conv.type === 'group') {
                                    navigate(`/groups/${conv.id}?tab=chat`);
                                } else {
                                    navigate(`/messages/${conv.id}`);
                                }
                            }}
                            className="group flex items-center gap-4 p-4 rounded-[2rem] bg-white/60 dark:bg-dark-card/40 hover:bg-white dark:hover:bg-dark-card transition-all cursor-pointer border border-white/40 dark:border-white/10 active:scale-[0.98] shadow-sm hover:shadow-md mb-3"
                        >
                            <div className="relative">
                                <Avatar className="h-14 w-14 border-2 border-white dark:border-dark-surface shadow-md ring-2 ring-primary/5 dark:ring-beige/5">
                                    {conv.type === 'group' ? (
                                        <>
                                            <AvatarImage src={conv.group?.image_url || ''} />
                                            <AvatarFallback className="bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige font-black italic">
                                                <Users className="h-6 w-6 opacity-40" />
                                            </AvatarFallback>
                                        </>
                                    ) : (
                                        <>
                                            <AvatarImage src={conv.user?.profile_picture_url || ''} />
                                            <AvatarFallback className="bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige font-black italic">
                                                {conv.user?.username?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </>
                                    )}
                                </Avatar>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-black italic text-primary dark:text-beige truncate uppercase tracking-tight">
                                        {conv.type === 'group' ? conv.group?.name : (conv.user?.display_name || conv.user?.username)}
                                    </h3>
                                    <span className="text-[9px] font-black text-primary/30 dark:text-beige/30 uppercase tracking-widest leading-none">
                                        {new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-primary dark:text-beige font-black' : 'text-primary/40 dark:text-beige/40 font-bold opacity-60'}`}>
                                    {conv.type === 'group' ? (
                                        <span className="text-secondary dark:text-accent font-black italic mr-1">TEAM:</span>
                                    ) : (
                                        conv.lastMessage.sender_id === user?.id ? 'Tú: ' : ''
                                    )}
                                    {conv.lastMessage.content}
                                </p>
                            </div>

                            <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-primary/40 group-hover:translate-x-1 transition-all" />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-24 bg-white/40 dark:bg-dark-surface/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-sand/30 dark:border-white/10 ring-1 ring-sand/20 dark:ring-white/5 transition-colors">
                        <div className="bg-sand/30 dark:bg-white/5 p-8 rounded-[2.5rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <MessageSquare className="h-10 w-10 text-primary/20 dark:text-beige/20" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary/40 dark:text-beige/40 mb-2">Bandeja Vacía</h3>
                        <p className="text-[10px] font-bold text-primary/30 dark:text-beige/30 max-w-[200px] mx-auto px-4 leading-relaxed uppercase tracking-widest opacity-60">Empieza una conversación desde el perfil de otro atleta.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
