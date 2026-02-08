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
        <div className="bg-white rounded-3xl shadow-sm border p-4 max-w-md mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <Button variant="ghost" size="icon" onClick={prevMonth} className="h-8 w-8">
                    <ChevronLeft className="h-4 w-4" />
                </Button>
                <h2 className="text-lg font-bold capitalize">
                    {format(currentMonth, 'MMMM yyyy', { locale: es })}
                </h2>
                <Button variant="ghost" size="icon" onClick={nextMonth} className="h-8 w-8">
                    <ChevronRight className="h-4 w-4" />
                </Button>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 mb-2">
                {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(day => (
                    <div key={day} className="text-center text-xs text-gray-400 font-medium py-1">
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
                                    "w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all relative",
                                    !isCurrentMonth && "text-gray-300",
                                    isToday(day) && !isSelected && "bg-gray-100 text-gray-900 font-bold",
                                    isSelected && "bg-primary text-white scale-110 shadow-md ring-2 ring-primary/20",
                                    hasWorkout && !isSelected && "bg-green-100 text-green-700 font-bold",
                                    hasWorkout && isSelected && "bg-green-600 text-white"
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
                <div className="mt-4 pt-4 border-t">
                    <h3 className="text-sm font-semibold text-gray-500 mb-2 capitalize">
                        {format(selectedDate, 'EEEE d, MMMM', { locale: es })}
                    </h3>
                    <div className="space-y-2">
                        {getWorkoutsForDay(selectedDate).length > 0 ? (
                            getWorkoutsForDay(selectedDate).map(workout => (
                                <div key={workout.id} className="flex items-center gap-3 p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                                    <div className="p-2 bg-white rounded-full border shadow-sm text-primary">
                                        <Dumbbell className="h-4 w-4" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium capitalize">{workout.activity_type}</p>
                                        {workout.description && (
                                            <p className="text-xs text-gray-500 line-clamp-1">{workout.description}</p>
                                        )}
                                    </div>
                                    <span className="text-xs text-gray-400">
                                        {/* Time could go here if we had it */}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-gray-400 italic text-center py-2">Sin actividad este día</p>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
