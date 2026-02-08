import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Search, MessageSquare, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';

export function Messages() {
    const navigate = useNavigate();
    const { conversations, loading, fetchConversations } = useMessages();

    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    return (
        <div className="max-w-md mx-auto pb-24 pt-4 px-4 min-h-screen">
            <header className="flex items-center justify-between mb-8 px-2">
                <h1 className="text-3xl font-black italic uppercase tracking-tighter text-black">Chats</h1>
                <div className="bg-primary/5 p-3 rounded-2xl">
                    <MessageSquare className="h-5 w-5 text-primary opacity-60" />
                </div>
            </header>

            {/* Search Placeholder */}
            <div className="relative mb-8">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                    placeholder="Buscar chats..."
                    className="pl-11 h-12 rounded-2xl bg-gray-50 border-none font-bold focus-visible:ring-primary/20"
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
                            key={conv.user.id}
                            onClick={() => navigate(`/messages/${conv.user.id}`)}
                            className="group flex items-center gap-4 p-4 rounded-[2rem] bg-white hover:bg-primary/5 transition-all cursor-pointer border border-transparent hover:border-primary/10 active:scale-[0.98] shadow-sm hover:shadow-md"
                        >
                            <div className="relative">
                                <Avatar className="h-14 w-14 border-2 border-white shadow-md ring-2 ring-primary/5">
                                    <AvatarImage src={conv.user.profile_picture_url || ''} />
                                    <AvatarFallback className="bg-primary/5 text-primary font-black italic">
                                        {conv.user.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                {conv.unreadCount > 0 && (
                                    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white animate-bounce shadow-lg">
                                        {conv.unreadCount}
                                    </div>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-baseline mb-0.5">
                                    <h3 className="font-black italic text-gray-900 truncate uppercase tracking-tight">
                                        {conv.user.display_name || conv.user.username}
                                    </h3>
                                    <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest leading-none">
                                        {new Date(conv.lastMessage.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                                <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-black font-black' : 'text-gray-400 font-bold opacity-60'}`}>
                                    {conv.lastMessage.sender_id === conv.user.id ? '' : 'Tú: '}{conv.lastMessage.content}
                                </p>
                            </div>

                            <ChevronRight className="h-4 w-4 text-gray-200 group-hover:text-primary/40 group-hover:translate-x-1 transition-all" />
                        </div>
                    ))
                ) : (
                    <div className="text-center py-20 bg-gray-50/50 rounded-[3.5rem] border-4 border-dashed border-gray-100 ring-1 ring-gray-50">
                        <div className="bg-gray-100 p-8 rounded-[2.5rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <MessageSquare className="h-10 w-10 text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-gray-300 mb-2">Bandeja Vacía</h3>
                        <p className="text-[10px] font-bold text-gray-300 max-w-[200px] mx-auto px-4 leading-relaxed uppercase tracking-widest opacity-60">Empieza una conversación desde el perfil de otro atleta.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
