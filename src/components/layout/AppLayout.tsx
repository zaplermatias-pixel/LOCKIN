import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import {
    Home,
    Search,
    PlusSquare,
    Users,
    MessageSquare,
    User as UserIcon,
    LogOut,
    Settings,
    Bell,
    Dumbbell
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

export function AppLayout() {
    const { user, session, signOut } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    const handleSignOut = async () => {
        await signOut();
        navigate('/');
    };

    const navItems = [
        { icon: Home, label: 'Feed', path: '/feed' },
        { icon: Search, label: 'Buscar', path: '/search' },
        { icon: PlusSquare, label: 'Publicar', path: '/new-workout' },
        { icon: Users, label: 'Grupos', path: '/groups' },
        { icon: MessageSquare, label: 'Mensajes', path: '/messages' },
    ];

    return (
        <div className="min-h-screen bg-earth-bg flex flex-col sm:flex-row">
            {/* Desktop Sidebar */}
            <aside className="hidden sm:flex flex-col w-64 h-screen sticky top-0 border-r border-sand/50 bg-white/50 backdrop-blur-md p-4">
                <Link to="/feed" className="text-2xl font-bold text-primary flex items-center gap-2 mb-8 px-2">
                    <Dumbbell className="h-7 w-7" />
                    <span className="italic tracking-tighter uppercase font-black">LockIn</span>
                </Link>

                <nav className="flex-1 space-y-1">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = location.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                to={item.path}
                                className={cn(
                                    "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-bold transition-all",
                                    isActive
                                        ? "bg-primary text-white shadow-lg shadow-primary/20"
                                        : "text-primary/60 hover:bg-primary/5 hover:text-primary"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-sand/50 pt-4">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-xl px-2 hover:bg-primary/5">
                                <Avatar key={user?.profile_picture_url} className="h-9 w-9 border-2 border-primary/20">
                                    <AvatarImage src={user?.profile_picture_url || ''} alt={user?.username} />
                                    <AvatarFallback className="bg-primary/10 text-primary">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start overflow-hidden">
                                    <span className="text-sm font-bold truncate w-full text-primary">{user?.display_name}</span>
                                    <span className="text-[10px] font-bold text-primary/40 truncate w-full uppercase tracking-widest">@{user?.username}</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-earth-bg/95 backdrop-blur-lg border-sand/50 shadow-xl rounded-2xl p-2" align="end" side="top">
                            <DropdownMenuItem onClick={() => {
                                const profileId = user?.id || session?.user?.id;
                                console.log('AppLayout (Desktop): Navigating to profile ID:', profileId);
                                navigate(`/profile/${profileId}`);
                            }} className="rounded-xl font-bold text-primary focus:bg-primary focus:text-white transition-all">
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Mi Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl font-bold text-primary focus:bg-primary focus:text-white transition-all">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configuración</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-sand/30" />
                            <DropdownMenuItem onClick={handleSignOut} className="rounded-xl font-bold text-accent focus:bg-accent focus:text-white transition-all">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="sticky top-0 z-40 w-full border-b border-sand/30 bg-white/60 backdrop-blur-md sm:hidden">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <Link to="/feed" className="text-2xl font-bold text-primary flex items-center gap-2">
                            <Dumbbell className="h-6 w-6" />
                            <span className="italic tracking-tighter uppercase font-black">LockIn</span>
                        </Link>

                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" className="relative text-primary rounded-xl hover:bg-primary/5">
                                <Bell className="h-5 w-5" />
                                <span className="absolute top-2 right-2 w-2 h-2 bg-accent rounded-full border-2 border-white" />
                            </Button>

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0 overflow-hidden ring-2 ring-primary/10">
                                        <Avatar key={user?.profile_picture_url} className="h-full w-full">
                                            <AvatarImage src={user?.profile_picture_url || ''} alt={user?.username} />
                                            <AvatarFallback className="bg-primary/10 text-primary">
                                                {user?.username?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-earth-bg/95 backdrop-blur-lg border-sand/50 shadow-xl rounded-2xl p-2" align="end">
                                    <DropdownMenuItem onClick={() => {
                                        const profileId = user?.id || session?.user?.id;
                                        console.log('AppLayout (Mobile): Navigating to profile ID:', profileId);
                                        navigate(`/profile/${profileId}`);
                                    }} className="rounded-xl font-bold text-primary focus:bg-primary focus:text-white transition-all">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Mi Perfil</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl font-bold text-primary focus:bg-primary focus:text-white transition-all">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Configuración</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-sand/30" />
                                    <DropdownMenuItem onClick={handleSignOut} className="rounded-xl font-bold text-accent focus:bg-accent focus:text-white transition-all">
                                        <LogOut className="mr-2 h-4 w-4" />
                                        <span>Cerrar Sesión</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 mb-16 sm:mb-0">
                    <div className="max-w-4xl mx-auto">
                        <Outlet />
                    </div>
                </main>

                {/* Mobile Bottom Navigation */}
                <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-sand/30 bg-white/80 backdrop-blur-md sm:hidden h-16">
                    <div className="flex justify-around items-center h-full px-2">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = location.pathname === item.path;
                            return (
                                <Link
                                    key={item.path}
                                    to={item.path}
                                    className={cn(
                                        "flex flex-col items-center justify-center w-full h-full transition-all rounded-xl",
                                        isActive ? "text-primary scale-110" : "text-primary/40"
                                    )}
                                >
                                    <Icon className={cn("h-5 w-5", isActive && "stroke-[3px]")} />
                                    <span className="text-[9px] mt-1 font-black uppercase tracking-tighter">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </nav>
            </div>
        </div>
    );
}
