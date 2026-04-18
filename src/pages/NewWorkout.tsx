import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import confetti from 'canvas-confetti';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { useWorkouts } from '@/hooks/useWorkouts';
import {
    Camera,
    Image as ImageIcon,
    Music,
    X,
    Check,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const ACTIVITY_TYPES = [
    { value: 'gym', label: 'Gimnasio', icon: '💪' },
    { value: 'run', label: 'Correr', icon: '🏃' },
    { value: 'bike', label: 'Ciclismo', icon: '🚴' },
    { value: 'swim', label: 'Natación', icon: '🏊' },
    { value: 'yoga', label: 'Yoga', icon: '🧘' },
    { value: 'crossfit', label: 'Crossfit', icon: '🔥' },
    { value: 'sports', label: 'Deportes', icon: '⚽' },
    { value: 'other', label: 'Otro', icon: '✨' },
];

const MUSCLE_GROUPS = [
    { value: 'chest', label: 'Pecho' },
    { value: 'back', label: 'Espalda' },
    { value: 'legs', label: 'Piernas' },
    { value: 'shoulders', label: 'Hombros' },
    { value: 'arms', label: 'Brazos' },
    { value: 'abs', label: 'Abdominales' },
    { value: 'glutes', label: 'Glúteos' },
    { value: 'cardio', label: 'Cardio' },
    { value: 'full_body', label: 'Cuerpo Completo' },
];

export function NewWorkout() {
    const navigate = useNavigate();
    const { createWorkout, checkHasWorkedOutToday, isCreating: submitting } = useWorkouts();

    // States
    const [loading, setLoading] = useState(true);
    const [hasWorkedOut, setHasWorkedOut] = useState(false);
    const [justCompleted, setJustCompleted] = useState(false);
    
    const { user } = useAuth();
    const { profile } = useProfile(user?.id);
    const [selectedActivity, setSelectedActivity] = useState<string>('gym');
    const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [songName, setSongName] = useState('');
    const [songArtist, setSongArtist] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const cameraInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        const init = async () => {
            const result = await checkHasWorkedOutToday();
            setHasWorkedOut(result);
            setLoading(false);
        };
        init();
    }, []);

    const handleMuscleToggle = (muscle: string) => {
        setSelectedMuscles(prev =>
            prev.includes(muscle)
                ? prev.filter(m => m !== muscle)
                : [...prev, muscle]
        );
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length + mediaFiles.length > 4) {
            setError('Máximo 4 archivos por publicación');
            return;
        }

        const newMedia = [...mediaFiles, ...files];
        setMediaFiles(newMedia);

        const newPreviews = files.map(file => URL.createObjectURL(file));
        setPreviews(prev => [...prev, ...newPreviews]);
    };

    const removeMedia = (index: number) => {
        const newMedia = mediaFiles.filter((_, i) => i !== index);
        const newPreviews = previews.filter((_, i) => i !== index);
        setMediaFiles(newMedia);
        setPreviews(newPreviews);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (mediaFiles.length === 0) {
            setError('Debes subir al menos una foto o video');
            return;
        }

        try {
            await createWorkout({
                workoutData: {
                    description,
                    activity_type: selectedActivity as any,
                    song_name: songName || null,
                    song_artist: songArtist || null,
                },
                muscleGroups: selectedMuscles,
                mediaFiles
            });

            // Trigger Gamification & Confetti!
            confetti({
                particleCount: 150,
                spread: 70,
                origin: { y: 0.6 },
                colors: ['#000000', '#dcdac0', '#ffffff', '#4ade80']
            });

            setJustCompleted(true);
            setHasWorkedOut(true);
        } catch (err: any) {
            setError(err.message || 'Error al publicar el entrenamiento');
        }
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <Spinner size="lg" />
                <p className="mt-4 text-gray-500">Verificando estado diario...</p>
            </div>
        );
    }

    if (hasWorkedOut) {
        return (
            <div className="max-w-md mx-auto py-12 px-4 text-center space-y-6">
                <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                    <Check className="h-10 w-10 text-primary" strokeWidth={3} />
                </div>
                <h1 className="text-2xl font-bold">¡Objetivo Cumplido!</h1>
                <p className="text-primary/60 dark:text-beige/60 italic">
                    {justCompleted && profile?.current_streak === 1 && '"¡El primer paso es el más difícil, ya estás en el camino!"'}
                    {justCompleted && profile?.current_streak === 3 && '"¡3 días seguidos! Estás creando un hábito poderoso."'}
                    {justCompleted && profile?.current_streak === 7 && '"¡Una semana perfecta! Eres imparable."'}
                    {justCompleted && profile?.current_streak && profile.current_streak > 7 && `"¡Racha de ${profile.current_streak} días! Tu disciplina habla por sí misma."`}
                    {!justCompleted && '"La disciplina es el puente entre las metas y los logros."'}
                </p>
                <div className="p-4 bg-gray-100 rounded-xl border border-gray-200">
                    <p className="text-sm text-gray-700">Ya has publicado tu entrenamiento de hoy. Tómate el resto del día para descansar y motivar a tus amigos en el feed.</p>
                </div>
                <Button onClick={() => navigate('/feed')} className="w-full">
                    Ir al Feed
                </Button>
            </div>
        );
    }
    if (mediaFiles.length === 0) {
        return (
            <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center">
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute top-4 right-4 text-white z-50 hover:bg-white/20 mt-[env(safe-area-inset-top)]"
                    onClick={() => navigate('/feed')}
                >
                    <X className="h-8 w-8" />
                </Button>
                
                <div className="flex flex-col items-center justify-center text-beige">
                    <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="group flex flex-col items-center justify-center hover:scale-105 transition-all active:scale-95"
                    >
                        <div className="h-28 w-28 rounded-full border-[6px] border-beige flex items-center justify-center mb-6 shadow-[0_0_40px_rgba(245,245,220,0.3)] bg-white/10 backdrop-blur-sm group-hover:bg-white/20 transition-all">
                            <Camera className="h-12 w-12" />
                        </div>
                        <span className="text-xl font-black uppercase tracking-[0.2em] italic mb-12">Tomar Foto</span>
                    </button>

                    <button 
                        onClick={() => galleryInputRef.current?.click()}
                        className="text-xs font-bold text-beige/50 uppercase tracking-widest hover:text-beige transition-colors flex items-center gap-2"
                    >
                        <ImageIcon className="h-4 w-4" />
                        Subir de galería
                    </button>
                </div>

                <input
                    type="file"
                    ref={cameraInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"
                    capture="environment"
                />
                <input
                    type="file"
                    ref={galleryInputRef}
                    onChange={handleFileChange}
                    className="hidden"
                    accept="image/*,video/*"
                />
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-dark-bg overflow-y-auto no-scrollbar pb-[env(safe-area-inset-bottom)]">
            {/* Background Image Header */}
            <div className="sticky top-0 h-[50vh] w-full -z-10 bg-black">
                {previews[0] && (
                    <img src={previews[0]} alt="Preview" className="w-full h-full object-cover" />
                )}
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-dark-surface via-dark-surface/40 to-black/40" />
                
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="absolute left-4 text-white hover:bg-white/20 mt-[env(safe-area-inset-top)] top-4"
                    onClick={() => removeMedia(0)}
                >
                    <X className="h-6 w-6" />
                </Button>
            </div>

            {/* Form Overlay */}
            <div className="relative -mt-16 bg-white dark:bg-dark-surface rounded-t-[2.5rem] min-h-[60vh] px-6 pt-8 pb-[100px] shadow-[0_-15px_40px_rgba(0,0,0,0.5)]">
                <h1 className="text-2xl font-black mb-8 flex items-center gap-2 text-primary dark:text-beige uppercase italic tracking-tighter">
                   Detalles del Entrenamiento
                </h1>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                    {/* Activity Selector */}
                    <div className="space-y-4">
                        <Label className="text-[11px] font-black tracking-widest uppercase text-primary/60 dark:text-beige/60">¿Qué has hecho hoy?</Label>
                        <div className="grid grid-cols-4 gap-2">
                            {ACTIVITY_TYPES.map((activity) => (
                                <button
                                    key={activity.value}
                                    type="button"
                                    onClick={() => setSelectedActivity(activity.value)}
                                    className={cn(
                                        "flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all",
                                        selectedActivity === activity.value
                                            ? "border-primary bg-primary/10 text-primary scale-105 dark:border-beige dark:text-beige dark:bg-beige/10"
                                            : "border-sand/40 bg-white text-primary/50 hover:border-primary/30 dark:border-white/10 dark:bg-dark-card dark:text-beige/50 dark:hover:border-white/30 hover:scale-105"
                                    )}
                                >
                                    <span className="text-2xl mb-2 grayscale transition-all duration-300" style={{ filter: selectedActivity === activity.value ? 'none' : 'grayscale(100%)' }}>{activity.icon}</span>
                                    <span className="text-[9px] font-black uppercase tracking-wider whitespace-nowrap">{activity.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Muscle Groups */}
                    {['gym', 'crossfit', 'yoga'].includes(selectedActivity) && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                            <Label className="text-[11px] font-black tracking-widest uppercase text-primary/60 dark:text-beige/60">Músculos implicados</Label>
                            <div className="flex flex-wrap gap-2">
                                {MUSCLE_GROUPS.map((muscle) => (
                                    <button
                                        key={muscle.value}
                                        type="button"
                                        onClick={() => handleMuscleToggle(muscle.value)}
                                        className={cn(
                                            "px-4 py-2.5 rounded-full text-[10px] font-black uppercase tracking-wider border-2 transition-all active:scale-95",
                                            selectedMuscles.includes(muscle.value)
                                                ? "border-primary bg-primary text-white shadow-lg dark:bg-beige dark:border-beige dark:text-dark-bg"
                                                : "border-sand/40 bg-white text-primary/60 hover:border-primary/30 dark:border-white/10 dark:bg-dark-card dark:text-beige/60"
                                        )}
                                    >
                                        {muscle.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Description */}
                    <div className="space-y-4">
                        <Label htmlFor="description" className="text-[11px] font-black tracking-widest uppercase text-primary/60 dark:text-beige/60">Descripción (Opcional)</Label>
                        <textarea
                            id="description"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="¿Cómo te has sentido? ¿Qué pesos has movido?..."
                            className="flex min-h-[120px] w-full rounded-[1.5rem] border-2 border-sand/40 dark:border-white/10 bg-white dark:bg-dark-card dark:text-beige px-5 py-4 text-sm font-bold shadow-sm placeholder:text-primary/30 dark:placeholder:text-beige/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-beige transition-all resize-none italic"
                        />
                    </div>

                    {/* Music */}
                    <div className="space-y-4">
                        <Label className="flex items-center gap-2 text-[11px] font-black tracking-widest uppercase text-primary/60 dark:text-beige/60">
                            <Music className="h-3 w-3" />
                            Soundtrack (Opcional)
                        </Label>
                        <div className="grid grid-cols-2 gap-3">
                            <Input
                                placeholder="Canción"
                                className="h-14 rounded-2xl border-2 border-sand/40 dark:border-white/10 bg-white dark:bg-dark-card dark:text-beige font-bold text-sm focus-visible:ring-primary dark:focus-visible:ring-beige px-4"
                                value={songName}
                                onChange={(e) => setSongName(e.target.value)}
                            />
                            <Input
                                placeholder="Artista"
                                className="h-14 rounded-2xl border-2 border-sand/40 dark:border-white/10 bg-white dark:bg-dark-card dark:text-beige font-bold text-sm focus-visible:ring-primary dark:focus-visible:ring-beige px-4"
                                value={songArtist}
                                onChange={(e) => setSongArtist(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Media Management (for adding more than 1 photo) */}
                    {mediaFiles.length > 0 && (
                        <div className="space-y-4 pt-4 border-t-2 border-sand/20 dark:border-white/5">
                            <Label className="text-[11px] font-black tracking-widest uppercase text-primary/60 dark:text-beige/60">
                                Galería ({mediaFiles.length}/4)
                            </Label>
                            <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar">
                                {previews.map((preview, index) => (
                                    <div key={index} className="relative h-20 w-20 shrink-0 rounded-2xl overflow-hidden shadow-md">
                                        <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                        {index > 0 && (
                                            <button
                                                type="button"
                                                onClick={() => removeMedia(index)}
                                                className="absolute top-1 right-1 bg-black/60 text-white p-1 rounded-full backdrop-blur-sm"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                        {index === 0 && (
                                            <div className="absolute inset-x-0 bottom-0 py-0.5 bg-black/60 text-white text-[8px] font-bold text-center uppercase tracking-widest backdrop-blur-sm">Portada</div>
                                        )}
                                    </div>
                                ))}
                                {mediaFiles.length < 4 && (
                                    <button
                                        type="button"
                                        onClick={() => galleryInputRef.current?.click()}
                                        className="h-20 w-20 shrink-0 rounded-2xl border-2 border-dashed border-sand/60 dark:border-white/20 flex flex-col items-center justify-center gap-1 text-primary/40 dark:text-beige/40 hover:bg-primary/5 dark:hover:bg-white/5 transition-colors"
                                    >
                                        <ImageIcon className="h-5 w-5" />
                                        <span className="text-[9px] font-bold uppercase tracking-widest">Añadir</span>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}

                    {error && (
                        <div className="p-4 bg-red-50 dark:bg-red-500/10 border-2 border-red-200 dark:border-red-500/20 rounded-2xl flex items-center gap-3 text-red-600 dark:text-red-400">
                            <AlertCircle className="h-5 w-5 shrink-0" />
                            <p className="text-sm font-bold">{error}</p>
                        </div>
                    )}

                    {/* Fixed Bottom Action */}
                    <div className="fixed bottom-0 left-0 right-0 p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] bg-white/95 dark:bg-dark-surface/95 backdrop-blur-lg border-t-2 border-sand/40 dark:border-white/10 z-50 shadow-[0_-10px_20px_rgba(0,0,0,0.1)]">
                        <Button
                            type="submit"
                            className="w-full h-14 text-sm font-black uppercase tracking-widest rounded-2xl shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all bg-accent text-white hover:bg-accent/90"
                            disabled={submitting}
                        >
                            {submitting ? (
                                <>
                                    <Spinner size="sm" className="mr-3 border-t-white" />
                                    Publicando sesión...
                                </>
                            ) : (
                                '¡Bloquear Mi Entrenamiento!'
                            )}
                        </Button>
                    </div>
                </form>
            </div>
            {/* Provide the inputs that were needed */}
            <input
                type="file"
                ref={galleryInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/*,video/*"
            />
        </div>
    );
}
