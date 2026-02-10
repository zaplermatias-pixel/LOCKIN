import { useState, useEffect } from 'react';
import { Bell, Calendar, MessageSquare, UserPlus } from 'lucide-react';
import { useNotifications, type Notification } from '@/hooks/useNotifications';
import { Button } from '@/components/ui/button';
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';

export function NotificationBell() {
    const { notifications, unreadCount, fetchNotifications, markAsRead, markAllAsRead } = useNotifications();
    const [open, setOpen] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);

    const handleNotificationClick = (notification: Notification) => {
        markAsRead(notification.id);
        setOpen(false);

        // Redirect based on type
        switch (notification.type) {
            case 'follow':
                navigate(`/profile/${notification.actor_id}`);
                break;
            case 'comment':
            case 'workout':
                if (notification.resource_id) {
                    navigate(`/workout/${notification.resource_id}`);
                }
                break;
            case 'invite':
                navigate('/groups');
                break;
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case 'follow': return <UserPlus className="h-3.5 w-3.5 text-blue-500" />;
            case 'comment': return <MessageSquare className="h-3.5 w-3.5 text-green-500" />;
            case 'workout': return <Calendar className="h-3.5 w-3.5 text-orange-500" />;
            case 'invite': return <UserPlus className="h-3.5 w-3.5 text-purple-500" />;
            default: return <Bell className="h-3.5 w-3.5 text-gray-500" />;
        }
    };

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative text-primary rounded-xl hover:bg-primary/5">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute top-2 right-2 flex h-4 w-4 items-center justify-center bg-accent text-white text-[8px] font-black rounded-full border-2 border-white animate-pulse shadow-[0_0_8px_rgba(255,107,107,0.8)]">
                            {unreadCount > 9 ? '9+' : unreadCount}
                        </span>
                    )}
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 bg-white/95 backdrop-blur-xl border-sand/30 shadow-2xl rounded-3xl overflow-hidden" align="end">
                <div className="p-4 border-b border-sand/30 bg-primary/5 flex items-center justify-between">
                    <h4 className="text-xs font-black uppercase italic tracking-widest text-primary">Notificaciones</h4>
                    {unreadCount > 0 && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={markAllAsRead}
                            className="h-7 text-[9px] font-black uppercase hover:bg-primary/10 text-primary/60"
                        >
                            Leer todo
                        </Button>
                    )}
                </div>
                <div className="max-h-[400px] overflow-y-auto">
                    {notifications.length > 0 ? (
                        <div className="divide-y divide-gray-50">
                            {notifications.map((n) => (
                                <div
                                    key={n.id}
                                    onClick={() => handleNotificationClick(n)}
                                    className={cn(
                                        "p-4 flex gap-3 cursor-pointer transition-colors hover:bg-gray-50",
                                        !n.is_read && "bg-primary/[0.02]"
                                    )}
                                >
                                    <div className="relative flex-shrink-0">
                                        <Avatar className="h-10 w-10 border-2 border-white shadow-sm">
                                            <AvatarImage src={n.actor?.profile_picture_url || ''} />
                                            <AvatarFallback className="bg-primary/10 text-primary font-black italic text-xs">
                                                {n.actor?.username?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-sm border border-gray-100">
                                            {getIcon(n.type)}
                                        </div>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-bold text-gray-900 leading-tight">
                                            <span className="font-black italic uppercase tracking-tighter text-primary">@{n.actor?.username}</span>
                                            {" "}{n.message || "realizó una acción"}
                                        </p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">
                                            {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: es })}
                                        </p>
                                    </div>
                                    {!n.is_read && (
                                        <div className="w-2 h-2 rounded-full bg-accent mt-2 shrink-0" />
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="py-12 text-center opacity-20">
                            <Bell className="h-12 w-12 mx-auto mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Sin notificaciones</p>
                        </div>
                    )}
                </div>
            </PopoverContent>
        </Popover>
    );
}
