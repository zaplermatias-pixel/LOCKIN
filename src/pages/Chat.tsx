import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMessages, type Message } from '@/hooks/useMessages';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, Send, MoreVertical, Loader2 } from 'lucide-react';

export function Chat() {
    const { userId: otherUserId } = useParams<{ userId: string }>();
    const navigate = useNavigate();
    const { user } = useAuth();
    const { messages, loading, fetchMessages, sendMessage, setMessages } = useMessages();
    const [newMessage, setNewMessage] = useState('');
    const [isSending, setIsSending] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (otherUserId) {
            fetchMessages(otherUserId);
        }
    }, [otherUserId, fetchMessages]);

    // Real-time subscription
    useEffect(() => {
        if (!user || !otherUserId) return;

        const channel = supabase
            .channel(`chat:${user.id}:${otherUserId}`)
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    setMessages(prev => [...prev, newMsg]);

                    // Mark as read immediately if in chat
                    supabase.from('messages').update({ is_read: true }).eq('id', newMsg.id);
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, otherUserId, setMessages]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSend = async (e?: React.FormEvent) => {
        e?.preventDefault();
        if (!newMessage.trim() || !otherUserId || isSending) return;

        setIsSending(true);
        try {
            const sent = await sendMessage(otherUserId, newMessage);
            if (sent) {
                setMessages(prev => [...prev, sent]);
                setNewMessage('');
            }
        } catch (error) {
            console.error('Failed to send message:', error);
        } finally {
            setIsSending(false);
        }
    };

    const otherUser = messages.find(m => m.sender_id === otherUserId)?.sender ||
        messages.find(m => m.receiver_id === otherUserId)?.receiver;

    return (
        <div className="flex flex-col h-screen max-w-md mx-auto bg-white">
            {/* Header */}
            <header className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-xl sticky top-0 z-10">
                <button
                    onClick={() => navigate('/messages')}
                    className="p-2 hover:bg-gray-100 rounded-2xl transition-all"
                >
                    <ChevronLeft className="h-6 w-6 text-black" />
                </button>

                <div
                    className="flex flex-1 items-center gap-3 cursor-pointer"
                    onClick={() => navigate(`/profile/${otherUserId}`)}
                >
                    <Avatar className="h-10 w-10 border border-white shadow-sm ring-2 ring-primary/5">
                        <AvatarImage src={otherUser?.profile_picture_url || ''} />
                        <AvatarFallback className="bg-primary/5 text-primary text-xs font-black italic">
                            {otherUser?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                        <h2 className="font-black italic text-sm text-black uppercase tracking-tight truncate">
                            {otherUser?.display_name || otherUser?.username || 'Cargando...'}
                        </h2>
                        <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">En línea</p>
                        </div>
                    </div>
                </div>

                <button className="p-2 hover:bg-gray-100 rounded-2xl transition-all">
                    <MoreVertical className="h-5 w-5 text-gray-400" />
                </button>
            </header>

            {/* Messages Area */}
            <div
                ref={scrollRef}
                className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50"
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
                                    <Avatar className="h-6 w-6 border-2 border-white mb-1 shadow-sm">
                                        <AvatarImage src={msg.sender?.profile_picture_url || ''} />
                                        <AvatarFallback className="text-[8px] bg-primary/5 text-primary font-black uppercase">
                                            {msg.sender?.username?.[0]}
                                        </AvatarFallback>
                                    </Avatar>
                                )}
                                {!isMe && !showAvatar && <div className="w-6" />}

                                <div className={`max-w-[80%] rounded-3xl px-5 py-3.5 text-sm font-bold shadow-sm ${isMe
                                    ? 'bg-primary text-white rounded-br-lg'
                                    : 'bg-white text-gray-800 rounded-bl-lg border border-gray-100'
                                    }`}>
                                    <p className="leading-relaxed">{msg.content}</p>
                                    <span className={`text-[8px] font-black uppercase tracking-widest mt-1 block opacity-40 text-right ${isMe ? 'text-white' : 'text-primary'}`}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                ) : (
                    <div className="text-center py-20 opacity-20">
                        <MessageSquare className="h-16 w-16 mx-auto mb-4" />
                        <p className="text-sm font-black uppercase italic tracking-widest">Sin mensajes todavía</p>
                    </div>
                )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-white border-t border-gray-100">
                <form
                    onSubmit={handleSend}
                    className="flex gap-3 bg-gray-50 p-2 rounded-[2rem] border border-transparent focus-within:border-primary/20 transition-all shadow-inner"
                >
                    <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Escribe algo motivador..."
                        className="bg-transparent border-none focus-visible:ring-0 font-bold h-12 shadow-none"
                    />
                    <Button
                        type="submit"
                        disabled={!newMessage.trim() || isSending}
                        className="rounded-full h-12 w-12 p-0 bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all flex-shrink-0"
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

const MessageSquare = ({ className }: { className?: string }) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
        <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
);
