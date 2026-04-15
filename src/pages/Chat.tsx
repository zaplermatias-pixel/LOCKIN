import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages } from '@/hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send, MoreVertical, Loader2, MessageSquare } from 'lucide-react';

export function Chat() {
    const { userId: otherUserId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    
    // El hook ahora maneja el estado, la carga y el tiempo real internamente 🚀
    const { 
        messages, 
        loading, 
        sendMessage, 
        isSending 
    } = useMessages(otherUserId);

    const [newMessage, setNewMessage] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    // Auto-scroll al final cuando hay mensajes nuevos
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !otherUserId || isSending) return;

        try {
            await sendMessage(otherUserId, newMessage);
            setNewMessage('');
        } catch (error) {
            console.error('Failed to send message:', error);
        }
    };

    const otherUser = messages.find(m => m.sender_id === otherUserId)?.sender ||
        messages.find(m => m.receiver_id === otherUserId)?.receiver;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white dark:bg-dark-bg transition-colors">
            {/* Header */}
            <header className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 dark:border-white/10 bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl sticky top-0 z-10 transition-colors">
                <button
                    onClick={() => navigate('/messages')}
                    className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all"
                >
                    <ChevronLeft className="h-6 w-6 text-primary dark:text-beige" />
                </button>

                <div
                    className="flex flex-1 items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${otherUserId}`)}
                >
                    <Avatar className="h-10 w-10 border border-white dark:border-dark-surface shadow-sm ring-2 ring-primary/5 dark:ring-beige/5">
                        <AvatarImage src={otherUser?.profile_picture_url || ''} />
                        <AvatarFallback className="bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige text-xs font-black italic">
                            {otherUser?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h2 className="font-black italic text-sm text-primary dark:text-beige uppercase tracking-tight truncate">
                            {otherUser?.display_name || otherUser?.username || 'Cargando...'}
                        </h2>
                        <p className="text-[10px] font-black text-primary/30 dark:text-beige/30 uppercase tracking-widest">
                            @{otherUser?.username || '...'}
                        </p>
                    </div>
                </div>

                <button className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-2xl transition-all">
                    <MoreVertical className="h-5 w-5 text-primary/30 dark:text-beige/30" />
                </button>
            </header>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50 dark:bg-dark-bg/50 transition-colors no-scrollbar"
            >
                {loading && messages.length === 0 ? (
                    <div className="flex justify-center py-20">
                        <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
                    </div>
                ) : messages.length > 0 ? (
                    messages.map((msg, idx) => {
                        const isMe = msg.sender_id === user?.id;
                        const prevMsg = messages[idx - 1];
                        const showAvatar = !prevMsg || prevMsg.sender_id !== msg.sender_id;

                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isMe ? 'justify-end' : 'justify-start'} items-end gap-2 group animate-in slide-in-from-bottom-2 duration-300`}
                            >
                                {!isMe && showAvatar && (
                                    <Avatar className="h-6 w-6 border-2 border-white dark:border-dark-surface mb-1 shadow-sm">
                                        <AvatarImage src={msg.sender?.profile_picture_url || ''} />
                                        <AvatarFallback className="text-[8px] bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige font-black uppercase">
                                            {msg.sender?.username?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                {!isMe && !showAvatar && <div className="w-6" />}

                                <div className={`max-w-[80%] rounded-3xl px-5 py-3.5 text-sm font-bold shadow-sm ${isMe
                                    ? 'bg-primary text-white rounded-br-lg shadow-lg shadow-primary/20'
                                    : 'bg-white dark:bg-dark-card text-primary dark:text-beige rounded-bl-lg border border-gray-100 dark:border-white/10'
                                    }`}>
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block opacity-40 text-right ${isMe ? 'text-white' : 'text-primary dark:text-beige'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-24 opacity-20 text-primary dark:text-beige">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-sm font-black uppercase italic tracking-widest">Sin mensajes todavía</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white dark:bg-dark-surface border-t border-gray-100 dark:border-white/10 transition-colors">
                <form
                    onSubmit={handleSend}
                    className="flex gap-3 bg-gray-50 dark:bg-dark-card/50 p-2 rounded-[2rem] border border-transparent focus-within:border-primary/20 dark:focus-within:border-beige/20 transition-all shadow-inner"
                >
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe algo motivador..."
                        className="bg-transparent border-none focus-visible:ring-0 font-bold h-12 shadow-none text-primary dark:text-beige placeholder:text-primary/20 dark:placeholder:text-beige/20"
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="rounded-full h-12 w-12 p-0 bg-primary dark:bg-beige text-white dark:text-dark-bg shadow-lg shadow-primary/20 dark:shadow-none hover:scale-110 active:scale-90 transition-all flex-shrink-0"
                    >
                        {isSending ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                        ) : (
                            <Send className="h-5 w-5" />
                        )}
                    </Button>
                </form>
            </div>
        </div>
    );
}
