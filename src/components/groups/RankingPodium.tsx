import { Trophy, Medal, Star } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { LeaderboardEntry } from '@/hooks/useGroupLeaderboard';
import { useNavigate } from 'react-router-dom';

interface RankingPodiumProps {
    entries: LeaderboardEntry[];
}

export function RankingPodium({ entries }: RankingPodiumProps) {
    const navigate = useNavigate();
    
    // El orden visual suele ser: [2do, 1er, 3er]
    const top3 = [
        entries[1] || null, // 2do
        entries[0] || null, // 1er
        entries[2] || null  // 3er
    ];

    if (entries.length === 0) return null;

    return (
        <div className="flex items-end justify-center gap-2 pb-10 pt-4 px-2">
            {top3.map((entry, index) => {
                if (!entry) return <div key={index} className="flex-1" />;
                
                const isFirst = index === 1;
                const isSecond = index === 0;
                const isThird = index === 2;

                return (
                    <div 
                        key={entry.user_id}
                        className={`flex flex-col items-center flex-1 transition-all duration-700 animate-in fade-in slide-in-from-bottom-10 delay-${index * 200}`}
                    >
                        {/* Avatar & Medal Container */}
                        <div className="relative group cursor-pointer" onClick={() => navigate(`/profile/${entry.user_id}`)}>
                            <div className={`
                                relative rounded-full p-1.5 transition-transform group-hover:scale-110 duration-500
                                ${isFirst ? 'bg-gradient-to-t from-yellow-600 to-yellow-300 shadow-[0_0_30px_rgba(234,179,8,0.3)] ring-4 ring-yellow-400/20' : ''}
                                ${isSecond ? 'bg-gradient-to-t from-gray-400 to-gray-200 shadow-[0_0_20px_rgba(156,163,175,0.2)] ring-4 ring-gray-400/10' : ''}
                                ${isThird ? 'bg-gradient-to-t from-orange-600 to-orange-300 shadow-[0_0_20px_rgba(194,120,57,0.2)] ring-4 ring-orange-400/10' : ''}
                            `}>
                                <Avatar className={`
                                    ${isFirst ? 'h-24 w-24' : 'h-16 w-16'} 
                                    border-2 border-white/50 dark:border-dark-surface/50 shadow-xl
                                `}>
                                    <AvatarImage src={entry.profile_picture_url || ''} />
                                    <AvatarFallback className="bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige font-black italic">
                                        {entry.username?.[0]?.toUpperCase()}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Badge de Posición */}
                                <div className={`
                                    absolute -bottom-2 -right-1 h-8 w-8 rounded-full flex items-center justify-center border-2 border-white dark:border-dark-surface shadow-lg
                                    ${isFirst ? 'bg-yellow-400 text-yellow-900' : ''}
                                    ${isSecond ? 'bg-gray-300 text-gray-700' : ''}
                                    ${isThird ? 'bg-orange-400 text-orange-900' : ''}
                                `}>
                                    {isFirst ? <Trophy className="h-4 w-4 fill-current" /> : 
                                     isSecond ? <Medal className="h-4 w-4 fill-current" /> : 
                                     <Medal className="h-4 w-4" />}
                                </div>
                            </div>
                        </div>

                        {/* Text Info */}
                        <div className="mt-4 text-center">
                            <p className={`
                                font-black uppercase italic tracking-tighter leading-none truncate max-w-[80px]
                                ${isFirst ? 'text-lg text-primary dark:text-beige' : 'text-sm text-primary/70 dark:text-beige/70'}
                            `}>
                                {entry.display_name}
                            </p>
                            <div className="flex items-center justify-center gap-1 mt-1">
                                <Star className={`h-3 w-3 ${isFirst ? 'text-yellow-500 fill-current' : 'text-primary/20 dark:text-beige/20'}`} />
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isFirst ? 'text-primary dark:text-beige' : 'text-primary/40 dark:text-beige/40'}`}>
                                    {entry.points} pts
                                </span>
                            </div>
                        </div>

                        {/* Podium Stand (Base visual) */}
                        <div className={`
                            mt-4 w-full rounded-t-2xl border-x border-t border-white/20 dark:border-white/5 transition-all
                            ${isFirst ? 'h-24 bg-gradient-to-b from-yellow-400/10 to-transparent' : 'h-16 bg-gradient-to-b from-white/10 to-transparent'}
                            ${isSecond ? 'bg-gradient-to-b from-gray-400/10 to-transparent' : ''}
                            ${isThird ? 'bg-gradient-to-b from-orange-400/10 to-transparent' : ''}
                        `} />
                    </div>
                );
            })}
        </div>
    );
}
