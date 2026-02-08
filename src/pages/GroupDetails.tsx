import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useGroupDetails } from '@/hooks/useGroupDetails';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ChevronLeft, Users, Info, Trophy, Settings, Crown, UserPlus, MessageSquare, Send, Loader2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutCard } from '@/components/workouts/WorkoutCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteMemberDialog } from '@/components/groups/InviteMemberDialog';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { useAuth } from '@/context/AuthContext';
import { useGroupMessages } from '@/hooks/useGroupMessages';
import { Input } from '@/components/ui/input';

export function GroupDetails() {
    const { user } = useAuth();
    const { groupId } = useParams<{ groupId: string }>();
    const navigate = useNavigate();
    const { group, members, activity, loading, fetchDetails } = useGroupDetails(groupId || '');
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [groupMessage, setGroupMessage] = useState('');
    const [isSending, setIsSending] = useState(false);

    const { messages, loading: messagesLoading, fetchMessages, sendGroupMessage } = useGroupMessages(groupId || '');

    const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin';

    useEffect(() => {
        fetchDetails();
        fetchMessages();
    }, [fetchDetails, fetchMessages]);

    const handleSendGroupMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupMessage.trim() || isSending) return;
        setIsSending(true);
        try {
            await sendGroupMessage(groupMessage);
            setGroupMessage('');
        } catch (error) {
            console.error('Failed to send group message:', error);
        } finally {
            setIsSending(false);
        }
    };

    if (loading && !group) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
                <div className="relative">
                    <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                    <Spinner size="lg" className="relative z-10" />
                </div>
                <p className="text-primary font-black uppercase italic tracking-widest text-[10px] animate-pulse">Sincronizando Lock-In...</p>
            </div>
        );
    }

    if (!group) {
        return (
            <div className="p-8 text-center pt-20">
                <div className="bg-red-50 text-red-500 p-8 rounded-[3rem] border-2 border-red-100 shadow-xl shadow-red-500/5">
                    <h2 className="text-2xl font-black uppercase italic mb-2 leading-none tracking-tighter">Acceso Denegado</h2>
                    <p className="font-bold text-sm mb-8 opacity-60">Este grupo es privado o ya no existe.</p>
                    <Button onClick={() => navigate('/groups')} className="rounded-2xl font-black bg-red-500 text-white px-10 h-14 uppercase italic text-xs tracking-widest">
                        Volver a mis Lock-Ins
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-32">
            {/* Header / Cover */}
            <div className="relative bg-primary text-white pt-12 pb-24 px-6 rounded-b-[4rem] shadow-2xl shadow-primary/20 overflow-hidden">
                {/* Visual Flair */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -mr-20 -mt-20 blur-3xl animate-pulse" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-black/10 rounded-full -ml-10 -mb-10 blur-2xl" />

                <div className="relative z-10 max-w-md mx-auto">
                    <div className="flex items-center justify-between mb-8">
                        <button
                            onClick={() => navigate('/groups')}
                            className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center group"
                        >
                            <ChevronLeft className="h-6 w-6 group-hover:-translate-x-1 transition-transform" />
                        </button>
                        {isAdmin && (
                            <button
                                onClick={() => setIsSettingsOpen(true)}
                                className="bg-white/10 p-3 rounded-2xl hover:bg-white/20 transition-all flex items-center justify-center group"
                            >
                                <Settings className="h-6 w-6 opacity-60" />
                            </button>
                        )}
                    </div>

                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-24 h-24 bg-white/10 backdrop-blur-xl rounded-[2.5rem] flex items-center justify-center border-2 border-white/20 shadow-2xl overflow-hidden ring-4 ring-white/5">
                            {group.image_url ? (
                                <img src={group.image_url} alt={group.name} className="w-full h-full object-cover" />
                            ) : (
                                <Users className="h-10 w-10 text-white opacity-40" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h1 className="text-4xl font-black italic uppercase leading-none tracking-tighter mb-2">
                                {group.name}
                            </h1>
                            <div className="flex gap-2">
                                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    {group.is_private ? '🔒 Privado' : '🌍 Público'}
                                </span>
                                <span className="text-[9px] font-black uppercase tracking-widest bg-white/20 px-3 py-1.5 rounded-full backdrop-blur-md border border-white/10">
                                    {members.length} MIEMBROS
                                </span>
                            </div>
                        </div>
                    </div>

                    {group.description && (
                        <div className="relative">
                            <div className="absolute inset-0 bg-white/5 rounded-[2rem] blur-sm" />
                            <p className="relative text-sm font-bold opacity-90 leading-relaxed bg-white/5 p-5 rounded-[2rem] border border-white/10 italic">
                                "{group.description}"
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Content Tabs */}
            <div className="max-w-md mx-auto px-4 -mt-10 relative z-20">
                <Tabs defaultValue="activity" className="w-full">
                    <TabsList className="grid grid-cols-4 bg-white/90 backdrop-blur-xl p-2 h-auto rounded-[2.5rem] shadow-2xl border border-gray-100 mb-10">
                        <TabsTrigger value="activity" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white data-[state=active]:shadow-lg shadow-primary/20 transition-all">
                            <Trophy className="h-3.5 w-3.5" /> Feed
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white transition-all">
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </TabsTrigger>
                        <TabsTrigger value="members" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Users className="h-3.5 w-3.5" /> Equipo
                        </TabsTrigger>
                        <TabsTrigger value="info" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary data-[state=active]:text-white">
                            <Info className="h-3.5 w-3.5" /> Info
                        </TabsTrigger>
                    </TabsList>

                    {/* ACTIVITY FEED TAB */}
                    <TabsContent value="activity" className="space-y-4 outline-none">
                        {activity.length > 0 ? (
                            activity.map(workout => (
                                <WorkoutCard key={workout.id} workout={workout} isLocked={false} />
                            ))
                        ) : (
                            <div className="text-center py-20 bg-white/50 backdrop-blur-md rounded-[3.5rem] border-4 border-dashed border-sand/30 ring-1 ring-sand/20">
                                <div className="bg-sand/30 p-8 rounded-[2.5rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Trophy className="h-10 w-10 text-primary/20" />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-primary/40 mb-2">Feed Silencioso</h3>
                                <p className="text-xs font-bold text-primary/30 max-w-[200px] mx-auto px-4 leading-relaxed">Nadie ha publicado en este Lock-In todavía. ¡Sé el primero!</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* GROUP CHAT TAB */}
                    <TabsContent value="chat" className="space-y-4 outline-none">
                        <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-6 shadow-xl border border-gray-100 flex flex-col min-h-[500px] max-h-[600px]">
                            {/* Messages Container */}
                            <div className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin scrollbar-thumb-primary/10">
                                {messagesLoading && messages.length === 0 ? (
                                    <div className="flex justify-center py-20">
                                        <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
                                    </div>
                                ) : messages.length > 0 ? (
                                    messages.map((msg, idx) => {
                                        const isMe = msg.user_id === user?.id;
                                        const prevMsg = messages[idx - 1];
                                        const showHeader = !prevMsg || prevMsg.user_id !== msg.user_id;

                                        return (
                                            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} gap-1 animate-in slide-in-from-bottom-2 duration-300`}>
                                                {showHeader && !isMe && (
                                                    <span className="text-[9px] font-black text-primary/40 uppercase tracking-[0.2em] ml-4 mb-1">
                                                        {msg.user?.display_name || msg.user?.username}
                                                    </span>
                                                )}
                                                <div className="flex items-end gap-2 group max-w-[85%]">
                                                    {!isMe && showHeader && (
                                                        <Avatar className="h-6 w-6 border-2 border-white shadow-sm ring-1 ring-primary/5">
                                                            <AvatarImage src={msg.user?.profile_picture_url || ''} />
                                                            <AvatarFallback className="text-[8px] bg-primary/5 text-primary font-black uppercase">
                                                                {msg.user?.username?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    {!isMe && !showHeader && <div className="w-6" />}

                                                    <div className={`rounded-3xl px-5 py-3.5 text-sm font-bold shadow-sm ${isMe
                                                        ? 'bg-primary text-white rounded-br-lg'
                                                        : 'bg-white text-gray-800 rounded-bl-lg border border-gray-100'
                                                        }`}>
                                                        <p className="leading-relaxed">{msg.content}</p>
                                                        <span className={`text-[7px] font-black uppercase tracking-widest mt-1 block opacity-30 text-right ${isMe ? 'text-white' : 'text-primary'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-20 opacity-20 flex flex-col items-center">
                                        <MessageSquare className="h-16 w-16 mb-4" />
                                        <p className="text-xs font-black uppercase italic tracking-widest">Empieza el Lock-In Chat</p>
                                    </div>
                                )}
                            </div>

                            {/* Input Form */}
                            <form onSubmit={handleSendGroupMessage} className="flex gap-3 bg-gray-50 p-2 rounded-[2rem] border border-transparent focus-within:border-primary/20 transition-all shadow-inner">
                                <Input
                                    value={groupMessage}
                                    onChange={(e) => setGroupMessage(e.target.value)}
                                    placeholder="Mensaje al equipo..."
                                    className="bg-transparent border-none focus-visible:ring-0 font-bold h-12 shadow-none text-xs"
                                />
                                <Button
                                    type="submit"
                                    disabled={!groupMessage.trim() || isSending}
                                    className="rounded-full h-12 w-12 p-0 bg-primary text-white shadow-lg shadow-primary/20 hover:scale-110 active:scale-90 transition-all flex-shrink-0"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    </TabsContent>


                    {/* MEMBERS TAB */}
                    <TabsContent value="members" className="space-y-4 outline-none">
                        <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-6 shadow-xl border border-gray-100 overflow-hidden">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40">Miembros del equipo</h4>
                                {isAdmin && (
                                    <Button
                                        onClick={() => setIsInviteOpen(true)}
                                        size="sm"
                                        className="rounded-xl h-8 gap-2 bg-primary/5 hover:bg-primary/10 text-primary font-black text-[9px] uppercase tracking-widest px-4 border border-primary/5"
                                    >
                                        <UserPlus className="h-3 w-3" /> Invitar
                                    </Button>
                                )}
                            </div>
                            <div className="space-y-3">
                                {members.map((member: any) => (
                                    <div
                                        key={member.id}
                                        onClick={() => navigate(`/profile/${member.user_id}`)}
                                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 hover:bg-primary/5 transition-all cursor-pointer group border border-transparent hover:border-primary/10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-white shadow-md ring-2 ring-primary/5">
                                                <AvatarImage src={member.users?.profile_picture_url || ''} />
                                                <AvatarFallback className="bg-primary/10 text-primary font-black italic text-xs">
                                                    {member.users?.username?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-sm text-gray-900 uppercase italic tracking-tight truncate max-w-[120px]">
                                                        {member.users?.display_name || member.users?.username}
                                                    </p>
                                                    {member.role === 'admin' && (
                                                        <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500/20" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">
                                                    @{member.users?.username}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm border border-gray-100 group-hover:bg-primary group-hover:text-white transition-colors">
                                            {member.role === 'admin' ? 'CAPITÁN' : 'GUERRERO'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* INFO TAB */}
                    <TabsContent value="info" className="space-y-4 outline-none">
                        <div className="bg-white/80 backdrop-blur-md rounded-[3rem] p-8 shadow-xl border border-gray-100">
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 mb-4 px-2">Estadísticas del Lock-In</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-primary/5 p-6 rounded-[2rem] border border-primary/10 text-center shadow-inner">
                                            <p className="text-2xl font-black italic text-primary leading-none mb-1">{activity.length}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Entrenamientos</p>
                                        </div>
                                        <div className="bg-accent/5 p-6 rounded-[2rem] border border-accent/10 text-center shadow-inner">
                                            <p className="text-2xl font-black italic text-accent leading-none mb-1">{members.length}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40">Miembros</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 mb-4 px-2">Acerca de</h4>
                                    <div className="bg-gray-50 p-6 rounded-[2rem] space-y-4 border border-gray-100">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold opacity-40 uppercase tracking-widest">Creado el</span>
                                            <span className="font-black text-primary uppercase italic">{new Date(group.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="h-px bg-gray-200" />
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold opacity-40 uppercase tracking-widest">Privacidad</span>
                                            <span className="font-black text-primary uppercase italic">{group.is_private ? 'Privado (Solo Invitación)' : 'Público'}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button variant="outline" className="w-full rounded-2xl h-14 border-red-100 text-red-500 hover:bg-red-50 font-black uppercase italic text-xs tracking-widest gap-2">
                                    Abandonar Lock-In
                                </Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </div>

            <InviteMemberDialog
                groupId={groupId || ''}
                isOpen={isInviteOpen}
                onOpenChange={setIsInviteOpen}
            />

            {group && (
                <GroupSettingsDialog
                    group={group}
                    isOpen={isSettingsOpen}
                    onOpenChange={setIsSettingsOpen}
                    onUpdate={fetchDetails}
                />
            )}
        </div>
    );
}
