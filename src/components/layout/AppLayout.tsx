import { useState, useEffect } from 'react';
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
    Dumbbell,
    Moon,
    Sun
} from 'lucide-react';
import { NotificationBell } from './NotificationBell';
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
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const [isDarkMode, setIsDarkMode] = useState(() => {
        return localStorage.getItem('theme') === 'dark' ||
            (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    });

    useEffect(() => {
        if (isDarkMode) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
        } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
        }
    }, [isDarkMode]);

    const toggleDarkMode = () => setIsDarkMode(!isDarkMode);

    const handleSignOut = async () => {
        setShowLogoutConfirm(false);
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
        <div className="min-h-[100dvh] bg-earth-bg dark:bg-dark-bg flex flex-col sm:flex-row transition-colors duration-300">
            {/* Desktop Sidebar */}
            <aside className="hidden sm:flex flex-col w-64 h-screen sticky top-0 border-r-2 border-sand/80 dark:border-white/20 bg-white/90 dark:bg-dark-surface/90 backdrop-blur-md p-4 transition-colors shadow-2xl z-50">
                <div className="flex items-center justify-between mb-8 px-2">
                    <Link to="/feed" className="text-2xl font-bold text-primary dark:text-beige flex items-center gap-2">
                        <Dumbbell className="h-7 w-7" />
                        <span className="italic tracking-tighter uppercase font-black">LockIn</span>
                    </Link>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={toggleDarkMode}
                        className="rounded-xl h-9 w-9 text-primary dark:text-beige hover:bg-primary/5 dark:hover:bg-white/5"
                    >
                        {isDarkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                    </Button>
                </div>

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
                                        : "text-primary/60 dark:text-beige/40 hover:bg-primary/5 dark:hover:bg-white/5 hover:text-primary dark:hover:text-beige"
                                )}
                            >
                                <Icon className={cn("h-5 w-5", isActive && "stroke-[2.5px]")} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                <div className="border-t border-sand/50 dark:border-white/10 pt-4 space-y-2">
                    <div className="flex justify-center sm:justify-start px-2">
                        <NotificationBell />
                    </div>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="w-full justify-start gap-3 h-14 rounded-xl px-2 hover:bg-primary/5 dark:hover:bg-white/5 transition-colors">
                                <Avatar key={user?.profile_picture_url} className="h-9 w-9 border-2 border-primary/20 dark:border-beige/20">
                                    <AvatarImage src={user?.profile_picture_url || ''} alt={user?.username} />
                                    <AvatarFallback className="bg-primary/10 dark:bg-beige/10 text-primary dark:text-beige">
                                        {user?.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="flex flex-col items-start overflow-hidden text-left">
                                    <span className="text-sm font-bold truncate w-full text-primary dark:text-beige">{user?.display_name}</span>
                                    <span className="text-[10px] font-bold text-primary/40 dark:text-beige/40 truncate w-full uppercase tracking-widest">@{user?.username}</span>
                                </div>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent className="w-56 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-lg border-sand/50 dark:border-white/10 shadow-xl rounded-2xl p-2" align="end" side="top">
                            <DropdownMenuItem onClick={() => {
                                const profileId = user?.id || session?.user?.id;
                                navigate(`/profile/${profileId}`);
                            }} className="rounded-xl font-bold text-primary dark:text-beige focus:bg-primary dark:focus:bg-beige focus:text-white dark:focus:text-dark-bg transition-all">
                                <UserIcon className="mr-2 h-4 w-4" />
                                <span>Mi Perfil</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl font-bold text-primary dark:text-beige focus:bg-primary dark:focus:bg-beige focus:text-white dark:focus:text-dark-bg transition-all">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Configuración</span>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-sand/30 dark:bg-white/10" />
                            <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} className="rounded-xl font-bold text-accent focus:bg-accent focus:text-white transition-all">
                                <LogOut className="mr-2 h-4 w-4" />
                                <span>Cerrar Sesión</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </aside>

            <div className="flex-1 flex flex-col min-w-0">
                {/* Mobile Header (Hidden on Desktop) */}
                <header className="sticky top-0 z-40 w-full border-b-2 border-sand/80 dark:border-white/20 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md sm:hidden transition-colors shadow-md safe-pt">
                    <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                        <Link to="/feed" className="text-2xl font-bold text-primary dark:text-beige flex items-center gap-2">
                            <Dumbbell className="h-6 w-6" />
                            <span className="italic tracking-tighter uppercase font-black">LockIn</span>
                        </Link>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={toggleDarkMode}
                                className="rounded-xl h-10 w-10 text-primary dark:text-beige hover:bg-primary/5 dark:hover:bg-white/5"
                            >
                                {isDarkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
                            </Button>
                            <NotificationBell />

                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" className="relative h-10 w-10 rounded-xl p-0 overflow-hidden ring-2 ring-primary/10 dark:ring-beige/10">
                                        <Avatar key={user?.profile_picture_url} className="h-full w-full">
                                            <AvatarImage src={user?.profile_picture_url || ''} alt={user?.username} />
                                            <AvatarFallback className="bg-primary/10 dark:bg-beige/10 text-primary dark:text-beige">
                                                {user?.username?.[0]?.toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent className="w-56 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-lg border-sand/50 dark:border-white/10 shadow-xl rounded-2xl p-2" align="end">
                                    <DropdownMenuItem onClick={() => {
                                        const profileId = user?.id || session?.user?.id;
                                        navigate(`/profile/${profileId}`);
                                    }} className="rounded-xl font-bold text-primary dark:text-beige focus:bg-primary dark:focus:bg-beige focus:text-white dark:focus:text-dark-bg transition-all">
                                        <UserIcon className="mr-2 h-4 w-4" />
                                        <span>Mi Perfil</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => navigate('/settings')} className="rounded-xl font-bold text-primary dark:text-beige focus:bg-primary dark:focus:bg-beige focus:text-white dark:focus:text-dark-bg transition-all">
                                        <Settings className="mr-2 h-4 w-4" />
                                        <span>Configuración</span>
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator className="bg-sand/30 dark:bg-white/10" />
                                    <DropdownMenuItem onClick={() => setShowLogoutConfirm(true)} className="rounded-xl font-bold text-accent focus:bg-accent focus:text-white transition-all">
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
                <nav className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-sand/80 dark:border-white/20 bg-white/95 dark:bg-dark-surface/95 backdrop-blur-md sm:hidden safe-h-nav safe-pb transition-colors shadow-[0_-5px_15px_-5px_rgba(0,0,0,0.15)]">
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
                                        isActive ? "text-primary dark:text-beige scale-110" : "text-primary/40 dark:text-beige/30"
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

            {/* Logout Confirmation Dialog */}
            {showLogoutConfirm && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutConfirm(false)} />
                    <div className="relative bg-white dark:bg-dark-surface rounded-[2.5rem] p-8 w-full max-w-sm shadow-2xl border-2 border-sand/80 dark:border-white/20 animate-in zoom-in-95 duration-200">
                        <h2 className="text-xl font-black italic uppercase tracking-tighter text-primary dark:text-beige mb-2">¿Cerrar Sesión?</h2>
                        <p className="text-sm text-primary/60 dark:text-beige/60 font-bold mb-8">Tendrás que volver a iniciar sesión para acceder a tu cuenta.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setShowLogoutConfirm(false)}
                                className="flex-1 h-12 rounded-2xl bg-sand/40 dark:bg-white/5 text-primary dark:text-beige font-black text-sm uppercase tracking-widest hover:bg-sand dark:hover:bg-white/10 transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSignOut}
                                className="flex-1 h-12 rounded-2xl bg-accent text-white font-black text-sm uppercase tracking-widest hover:opacity-90 transition-all shadow-lg shadow-accent/20"
                            >
                                Cerrar Sesión
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
