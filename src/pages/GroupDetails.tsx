import { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useGroupDetails } from '@/hooks/useGroupDetails';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { ChevronLeft, Users, Info, Trophy, Settings, Crown, UserPlus, MessageSquare, Send, Loader2, Award, Star } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WorkoutCard } from '@/components/workouts/WorkoutCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { InviteMemberDialog } from '@/components/groups/InviteMemberDialog';
import { GroupSettingsDialog } from '@/components/groups/GroupSettingsDialog';
import { useAuth } from '@/context/AuthContext';
import { useGroupMessages } from '@/hooks/useGroupMessages';
import { Input } from '@/components/ui/input';
import { supabase } from '@/lib/supabase';
import { useGroupLeaderboard, type LeaderboardPeriod } from '@/hooks/useGroupLeaderboard';
import { RankingPodium } from '@/components/groups/RankingPodium';

export function GroupDetails() {
    const { user } = useAuth();
    const { groupId } = useParams<{ groupId: string }>();
    const [searchParams, setSearchParams] = useSearchParams();
    const initialTab = searchParams.get('tab') || 'activity';

    const navigate = useNavigate();
    
    // React Query maneja el estado y la caché automáticamente 🚀
    const { 
        group, 
        members, 
        activity, 
        loading: detailsLoading, 
        fetchDetails 
    } = useGroupDetails(groupId || '');

    const { 
        messages, 
        loading: messagesLoading, 
        sendGroupMessage, 
        markAsRead,
        isSending
    } = useGroupMessages(groupId || '');

    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [isLeaving, setIsLeaving] = useState(false);
    const [groupMessage, setGroupMessage] = useState('');
    const [activeTab, setActiveTab] = useState(initialTab);
    const [leaderboardPeriod, setLeaderboardPeriod] = useState<LeaderboardPeriod>('weekly');
    const scrollRef = useRef<HTMLDivElement>(null);

    const { data: leaderboard, isLoading: leaderboardLoading } = useGroupLeaderboard(groupId!, leaderboardPeriod);

    const isAdmin = members.find(m => m.user_id === user?.id)?.role === 'admin';

    // Auto-scroll al final del chat
    useEffect(() => {
        if (activeTab === 'chat' && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;

            if (messages.length > 0) {
                markAsRead(messages[messages.length - 1].id);
            }
        }
    }, [messages, activeTab, markAsRead]);

    const handleLeaveGroup = async () => {
        if (!user || !groupId || isLeaving) return;
        setIsLeaving(true);
        try {
            const { error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', user.id);
            if (error) throw error;
            navigate('/groups');
        } catch (err) {
            console.error('Error leaving group:', err);
        } finally {
            setIsLeaving(false);
            setShowLeaveConfirm(false);
        }
    };

    const handleSendGroupMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!groupMessage.trim() || isSending) return;
        try {
            await sendGroupMessage(groupMessage);
            setGroupMessage('');
        } catch (error) {
            console.error('Failed to send group message:', error);
        }
    };

    if (detailsLoading && !group) {
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
                <Tabs
                    value={activeTab}
                    onValueChange={(val) => {
                        setActiveTab(val);
                        setSearchParams({ tab: val });
                        if (val === 'chat' && messages.length > 0) {
                            markAsRead(messages[messages.length - 1].id);
                        }
                    }}
                    className="w-full"
                >
                    <TabsList className="grid grid-cols-5 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-xl p-2 h-auto rounded-[2.5rem] shadow-2xl border border-gray-100 dark:border-white/10 mb-10 transition-colors">
                        <TabsTrigger value="activity" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary dark:data-[state=active]:bg-beige data-[state=active]:text-white dark:data-[state=active]:text-dark-bg data-[state=active]:shadow-lg shadow-primary/20 transition-all dark:text-beige/40">
                            <Trophy className="h-3.5 w-3.5" /> Feed
                        </TabsTrigger>
                        <TabsTrigger value="chat" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary dark:data-[state=active]:bg-beige data-[state=active]:text-white dark:data-[state=active]:text-dark-bg transition-all dark:text-beige/40">
                            <MessageSquare className="h-3.5 w-3.5" /> Chat
                        </TabsTrigger>
                        <TabsTrigger value="members" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary dark:data-[state=active]:bg-beige data-[state=active]:text-white dark:data-[state=active]:text-dark-bg transition-all dark:text-beige/40">
                            <Users className="h-3.5 w-3.5" /> Equipo
                        </TabsTrigger>
                        <TabsTrigger value="info" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary dark:data-[state=active]:bg-beige data-[state=active]:text-white dark:data-[state=active]:text-dark-bg transition-all dark:text-beige/40">
                            <Info className="h-3.5 w-3.5" /> Info
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="rounded-[1.8rem] py-4 text-[9px] font-black italic uppercase tracking-widest gap-2 data-[state=active]:bg-primary dark:data-[state=active]:bg-beige data-[state=active]:text-white dark:data-[state=active]:text-dark-bg transition-all dark:text-beige/40">
                            <Award className="h-3.5 w-3.5" /> Rank
                        </TabsTrigger>
                    </TabsList>

                    {/* ACTIVITY FEED TAB */}
                    <TabsContent value="activity" className="space-y-4 outline-none">
                        {activity.length > 0 ? (
                            activity.map(workout => (
                                <WorkoutCard key={workout.id} workout={workout} isLocked={false} />
                            ))
                        ) : (
                            <div className="text-center py-24 bg-white/40 dark:bg-dark-surface/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-sand/30 dark:border-white/10 ring-1 ring-sand/20 dark:ring-white/5 transition-colors">
                                <div className="bg-sand/30 dark:bg-white/5 p-8 rounded-[2.5rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <Trophy className="h-10 w-10 text-primary/20 dark:text-beige/20" />
                                </div>
                                <h3 className="text-2xl font-black uppercase italic tracking-tighter text-primary/40 dark:text-beige/40 mb-2">Feed Silencioso</h3>
                                <p className="text-xs font-bold text-primary/30 dark:text-beige/30 max-w-[200px] mx-auto px-4 leading-relaxed">Nadie ha publicado en este Lock-In todavía. ¡Sé el primero!</p>
                            </div>
                        )}
                    </TabsContent>

                    {/* GROUP CHAT TAB */}
                    <TabsContent value="chat" className="space-y-4 outline-none">
                        <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-[3rem] p-6 shadow-xl border border-gray-100 dark:border-white/10 flex flex-col min-h-[500px] max-h-[600px] transition-colors">
                            <div
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto space-y-4 mb-6 pr-2 scrollbar-thin scrollbar-thumb-primary/10"
                            >
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
                                                    <span className="text-[9px] font-black text-primary/40 dark:text-beige/40 uppercase tracking-[0.2em] ml-4 mb-1">
                                                        {msg.user?.display_name || msg.user?.username}
                                                    </span>
                                                )}
                                                <div className="flex items-end gap-2 group max-w-[85%]">
                                                    {!isMe && showHeader && (
                                                        <Avatar className="h-6 w-6 border-2 border-white dark:border-dark-surface shadow-sm ring-1 ring-primary/5 dark:ring-beige/5">
                                                            <AvatarImage src={msg.user?.profile_picture_url || ''} />
                                                            <AvatarFallback className="text-[8px] bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige font-black uppercase">
                                                                {msg.user?.username?.[0]}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                    )}
                                                    {!isMe && !showHeader && <div className="w-6" />}

                                                    <div className={`rounded-3xl px-5 py-3.5 text-sm font-bold shadow-sm ${isMe
                                                        ? 'bg-primary text-white rounded-br-lg shadow-lg shadow-primary/20'
                                                        : 'bg-white dark:bg-dark-card text-primary dark:text-beige rounded-bl-lg border border-gray-100 dark:border-white/10'
                                                        }`}>
                                                        <p className="leading-relaxed">{msg.content}</p>
                                                        <span className={`text-[7px] font-black uppercase tracking-widest mt-1 block opacity-30 text-right ${isMe ? 'text-white' : 'text-primary dark:text-beige'}`}>
                                                            {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })
                                ) : (
                                    <div className="text-center py-20 opacity-20 flex flex-col items-center text-primary dark:text-beige">
                                        <MessageSquare className="h-16 w-16 mb-4" />
                                        <p className="text-xs font-black uppercase italic tracking-widest">Empieza el Lock-In Chat</p>
                                    </div>
                                )}
                            </div>

                            <form onSubmit={handleSendGroupMessage} className="flex gap-3 bg-gray-50 dark:bg-dark-card/50 p-2 rounded-[2rem] border border-transparent focus-within:border-primary/20 dark:focus-within:border-beige/20 transition-all shadow-inner">
                                <Input
                                    value={groupMessage}
                                    onChange={(e) => setGroupMessage(e.target.value)}
                                    placeholder="Mensaje al equipo..."
                                    className="bg-transparent border-none focus-visible:ring-0 font-bold h-12 shadow-none text-xs text-primary dark:text-beige placeholder:text-primary/20 dark:placeholder:text-beige/20"
                                />
                                <Button
                                    type="submit"
                                    disabled={!groupMessage.trim() || isSending}
                                    className="rounded-full h-12 w-12 p-0 bg-primary dark:bg-beige text-white dark:text-dark-bg shadow-lg shadow-primary/20 dark:shadow-none hover:scale-110 active:scale-90 transition-all flex-shrink-0"
                                >
                                    {isSending ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-white dark:text-dark-bg" />
                                    ) : (
                                        <Send className="h-4 w-4" />
                                    )}
                                </Button>
                            </form>
                        </div>
                    </TabsContent>

                    {/* MEMBERS TAB */}
                    <TabsContent value="members" className="space-y-4 outline-none">
                        <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-[3rem] p-6 shadow-xl border border-gray-100 dark:border-white/10 transition-colors overflow-hidden">
                            <div className="flex items-center justify-between mb-8 px-2">
                                <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 dark:text-beige/40">Miembros del equipo</h4>
                                {isAdmin && (
                                    <Button
                                        onClick={() => setIsInviteOpen(true)}
                                        size="sm"
                                        className="rounded-xl h-8 gap-2 bg-primary/5 dark:bg-beige/5 hover:bg-primary/10 dark:hover:bg-beige/10 text-primary dark:text-beige font-black text-[9px] uppercase tracking-widest px-4 border border-primary/5 dark:border-beige/5"
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
                                        className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-dark-card/30 hover:bg-primary/5 dark:hover:bg-beige/5 transition-all cursor-pointer group border border-transparent hover:border-primary/10 dark:hover:border-beige/10"
                                    >
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-white dark:border-dark-surface shadow-md ring-2 ring-primary/5 dark:ring-beige/5">
                                                <AvatarImage src={member.users?.profile_picture_url || ''} />
                                                <AvatarFallback className="bg-primary/10 dark:bg-beige/10 text-primary dark:text-beige font-black italic text-xs">
                                                    {member.users?.username?.[0]?.toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-sm text-primary dark:text-beige uppercase italic tracking-tight truncate max-w-[120px]">
                                                        {member.users?.display_name || member.users?.username}
                                                    </p>
                                                    {member.role === 'admin' && (
                                                        <Crown className="h-3 w-3 text-yellow-500 fill-yellow-500/20" />
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-primary/40 dark:text-beige/40 font-bold uppercase tracking-widest">
                                                    @{member.users?.username}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="bg-white dark:bg-dark-surface text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full shadow-sm border border-gray-100 dark:border-white/5 group-hover:bg-primary dark:group-hover:bg-beige group-hover:text-white dark:group-hover:text-dark-bg transition-colors">
                                            {member.role === 'admin' ? 'CAPITÁN' : 'GUERRERO'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </TabsContent>

                    {/* LEADERBOARD TAB */}
                    <TabsContent value="leaderboard" className="space-y-4 outline-none">
                        <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-xl rounded-[3rem] p-6 shadow-2xl border border-gray-100 dark:border-white/10 transition-colors overflow-hidden relative">
                            <div className="flex flex-col sm:flex-row items-center justify-between mb-8 gap-4 px-2">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 dark:text-beige/40">Ranking de Competencia</h4>
                                    <p className="text-[10px] font-bold text-primary/20 dark:text-beige/20 uppercase tracking-widest mt-1">Días entrenados según periodo</p>
                                </div>
                                <div className="flex p-1 bg-gray-100 dark:bg-dark-card rounded-2xl border border-gray-200 dark:border-white/5">
                                    {(['weekly', 'monthly', 'all'] as const).map((p) => (
                                        <button
                                            key={p}
                                            onClick={() => setLeaderboardPeriod(p)}
                                            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                                leaderboardPeriod === p 
                                                    ? 'bg-white dark:bg-beige text-primary dark:text-dark-bg shadow-sm' 
                                                    : 'text-primary/40 dark:text-beige/40 hover:text-primary dark:hover:text-beige'
                                            }`}
                                        >
                                            {p === 'weekly' ? 'S7' : p === 'monthly' ? 'S30' : 'Global'}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {leaderboardLoading ? (
                                <div className="flex justify-center py-20">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin opacity-20" />
                                </div>
                            ) : leaderboard && leaderboard.length > 0 ? (
                                <div className="space-y-8">
                                    {/* TOP 3 PODIUM */}
                                    <RankingPodium entries={leaderboard} />

                                    {/* REST OF THE LIST */}
                                    {leaderboard.length > 3 && (
                                        <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5 mx-2">
                                            {leaderboard.slice(3).map((entry, index) => (
                                                <div
                                                    key={entry.user_id}
                                                    onClick={() => navigate(`/profile/${entry.user_id}`)}
                                                    className="flex items-center justify-between p-4 rounded-2xl bg-gray-50/50 dark:bg-dark-card/30 hover:bg-primary/5 dark:hover:bg-beige/5 transition-all cursor-pointer group border border-transparent hover:border-primary/10 dark:hover:border-beige/10"
                                                >
                                                    <div className="flex items-center gap-4">
                                                        <div className="text-xs font-black italic text-primary/30 dark:text-beige/30 w-6 text-center">
                                                            {index + 4}
                                                        </div>
                                                        <Avatar className="h-10 w-10 border border-white dark:border-dark-surface shadow-md">
                                                            <AvatarImage src={entry.profile_picture_url || ''} />
                                                            <AvatarFallback className="bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige text-xs font-black italic">
                                                                {entry.username?.[0]?.toUpperCase()}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <p className="font-black text-xs text-primary dark:text-beige uppercase italic tracking-tight truncate max-w-[120px]">
                                                                {entry.display_name}
                                                            </p>
                                                            <p className="text-[9px] text-primary/30 dark:text-beige/30 font-bold uppercase tracking-widest leading-none">
                                                                @{entry.username}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-dark-surface rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                                                        <Star className="h-3 w-3 text-primary/20 dark:text-beige/20" />
                                                        <span className="text-[10px] font-black italic text-primary dark:text-beige">
                                                            {entry.points} pts
                                                        </span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="text-center py-20 opacity-20">
                                    <Trophy className="h-16 w-16 mx-auto mb-4" />
                                    <p className="font-black uppercase italic tracking-widest text-sm">Nadie ha puntuado todavía</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    {/* INFO TAB */}
                    <TabsContent value="info" className="space-y-4 outline-none">
                        <div className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-[3rem] p-8 shadow-xl border border-gray-100 dark:border-white/10 transition-colors">
                            <div className="space-y-8">
                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 dark:text-beige/40 mb-4 px-2">Estadísticas del Lock-In</h4>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-primary/5 dark:bg-beige/5 p-6 rounded-[2rem] border border-primary/10 dark:border-beige/10 text-center shadow-inner">
                                            <p className="text-2xl font-black italic text-primary dark:text-beige leading-none mb-1">{activity.length}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 dark:text-beige/40">Entrenamientos</p>
                                        </div>
                                        <div className="bg-accent/5 dark:bg-accent/5 p-6 rounded-[2rem] border border-accent/10 dark:border-accent/10 text-center shadow-inner">
                                            <p className="text-2xl font-black italic text-secondary dark:text-accent leading-none mb-1">{members.length}</p>
                                            <p className="text-[9px] font-black uppercase tracking-widest opacity-40 dark:text-accent/40">Miembros</p>
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/40 dark:text-beige/40 mb-4 px-2">Acerca de</h4>
                                    <div className="bg-earth-bg/50 dark:bg-dark-card/50 p-6 rounded-[2rem] space-y-4 border border-sand/20 dark:border-white/5">
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold opacity-40 dark:text-beige/40 uppercase tracking-widest">Creado el</span>
                                            <span className="font-black text-primary dark:text-beige uppercase italic">{new Date(group.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                                        </div>
                                        <div className="h-px bg-sand/10 dark:bg-white/5" />
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold opacity-40 dark:text-beige/40 uppercase tracking-widest">Privacidad</span>
                                            <span className="font-black text-primary dark:text-beige uppercase italic">{group.is_private ? 'Privado (Solo Invitación)' : 'Público'}</span>
                                        </div>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => setShowLeaveConfirm(true)}
                                    disabled={isAdmin}
                                    className="w-full rounded-2xl h-14 border-red-200 dark:border-red-900/40 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 font-black uppercase italic text-xs tracking-widest gap-2 disabled:opacity-30"
                                >
                                    {isAdmin ? 'El admin no puede abandonar' : 'Abandonar Lock-In'}
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
                    onUpdate={() => fetchDetails()}
                />
            )}

            {/* Leave Group Confirmation */}
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLeaveConfirm(false)} />
                    <div className="relative bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border-2 border-sand/80 dark:border-white/20 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-primary dark:text-beige mb-2">¿Abandonar {group?.name}?</h2>
                        <p className="text-sm text-primary/60 dark:text-beige/60 font-bold mb-8">Perderás acceso al grupo y tendrás que ser invitado nuevamente.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="flex-1 h-12 rounded-2xl bg-sand/40 dark:bg-white/5 text-primary dark:text-beige font-black text-sm uppercase tracking-widest hover:bg-sand dark:hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleLeaveGroup}
                                disabled={isLeaving}
                                className="flex-1 h-12 rounded-2xl bg-red-500 text-white font-black text-sm uppercase tracking-widest hover:bg-red-600 transition-all shadow-lg shadow-red-500/20 disabled:opacity-50"
                            >
                                {isLeaving ? 'Saliendo...' : 'Abandonar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
