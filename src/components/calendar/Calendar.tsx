import { useState } from 'react';
import {
    format,
    startOfMonth,
    endOfMonth,
    eachDayOfInterval,
    isSameMonth,
    isSameDay,
    addMonths,
    subMonths,
    startOfWeek,
    endOfWeek,
    isToday
} from 'date-fns';
import { es } from 'date-fns/locale';
import { ChevronLeft, ChevronRight, Dumbbell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { Workout } from '@/types/database.types';

interface CalendarProps {
    workouts: Workout[];
    onSelectDate?: (date: Date) => void;
}

export function Calendar({ workouts, onSelectDate }: CalendarProps) {
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState<Date | null>(null);

    const firstDay = startOfMonth(currentMonth);
    const lastDay = endOfMonth(currentMonth);

    // Get all days to display (including padding for weeks)
    const startDate = startOfWeek(firstDay, { weekStartsOn: 1 }); // Monday start
    const endDate = endOfWeek(lastDay, { weekStartsOn: 1 });

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    const prevMonth = () => setCurrentMonth(subMonths(currentMonth, 1));
    const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));

    const getWorkoutsForDay = (day: Date) => {
        return workouts.filter(w => {
            // Append T12:00:00 to ensure we are in the middle of the day, avoiding timezone shifts
            // that might push us to the previous day (if 00:00 UTC)
            const workoutDate = new Date(`${w.workout_date}T12:00:00`);
            return isSameDay(workoutDate, day);
        });
    };

    const handleDateClick = (day: Date) => {
        setSelectedDate(day);
        if (onSelectDate) onSelectDate(day);
    };

    return (
        <div className="bg-white dark:bg-dark-surface rounded-3xl shadow-xl shadow-sand/10 dark:shadow-black/50 border-2 border-sand/80 dark:border-white/20 p-4 max-w-md mx-auto transition-colors">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-black italic uppercase tracking-tighter text-primary dark:text-beige">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="text-center text-[10px] uppercase tracking-widest text-primary/40 dark:text-beige/40 font-bold py-1">
                        {day}
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
                {days.map((day, dayIdx) => {
                    const dayWorkouts = getWorkoutsForDay(day);
                    const hasWorkout = dayWorkouts.length > 0;
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentMonth = isSameMonth(day, currentMonth);

                    return (
                        <div key={day.toString()} className="aspect-square relative flex items-center justify-center">
                            <button
                                onClick={() => handleDateClick(day)}
                                className={cn(
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all relative font-bold",
                                    !isCurrentMonth && "text-primary/20 dark:text-beige/20",
                                    isToday(day) && !isSelected && "bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige font-black border border-primary/20 dark:border-beige/20",
                                    isSelected && "bg-primary dark:bg-beige text-white dark:text-dark-bg scale-110 shadow-lg shadow-primary/20 dark:shadow-none ring-2 ring-primary/20 dark:ring-beige/20",
                                    hasWorkout && !isSelected && "bg-green-500/10 dark:bg-green-500/20 text-green-700 dark:text-green-400 font-black",
                                    hasWorkout && isSelected && "bg-green-600 dark:bg-green-500 text-white dark:text-dark-bg"
                                )}
                            >
                                {format(day, 'd')}

                                {/* Dot indicator for multiple workouts or specific types */}
                                {hasWorkout && (
                                    <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2">
                                        <div className={cn(
                                            "w-1 h-1 rounded-full",
                                            isSelected ? "bg-white/70" : "bg-green-500"
                                        )} />
                                    </span>
                                )}
                            </button>
                        </div>
                    );
                })}
            </div>

            {/* Selected Date Details */}
            {selectedDate && (
                <div className="mt-4 pt-4 border-t border-sand/30 dark:border-white/10">
                    <h3 className="text-[11px] font-black italic uppercase tracking-widest text-primary/60 dark:text-beige/60 mb-2">
                        {format(selectedDate, 'EEEE d, MMMM', { locale: es })}
                    </h3>
                    <div className="space-y-2">
                        {getWorkoutsForDay(selectedDate).length > 0 ? (
                            getWorkoutsForDay(selectedDate).map(workout => (
                                <div key={workout.id} className="flex items-center gap-3 p-3 rounded-2xl bg-earth-bg/50 dark:bg-dark-card border border-sand/30 dark:border-white/5 shadow-sm hover:shadow-md transition-all">
                                    <div className="p-2 bg-primary/5 dark:bg-beige/5 rounded-xl text-primary dark:text-beige">
                                        <Dumbbell className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-black italic uppercase tracking-tighter text-primary dark:text-beige">{workout.activity_type}</p>
                                        {workout.description && (
                                            <p className="text-[11px] font-bold text-primary/60 dark:text-beige/60 line-clamp-1 italic">"{workout.description}"</p>
                                        )}
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="bg-earth-bg/30 dark:bg-dark-card/30 rounded-2xl p-4 border border-dashed border-sand/50 dark:border-white/10 text-center">
                                <p className="text-[10px] text-primary/40 dark:text-beige/40 font-black uppercase tracking-widest italic">Sin actividad registrada en este día</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
