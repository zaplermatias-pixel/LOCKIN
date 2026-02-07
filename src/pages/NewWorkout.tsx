import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useWorkouts } from '@/hooks/useWorkouts';
import {
    Dumbbell,
    Image as ImageIcon,
    Music,
    X,
    Check,
    Type,
    ChevronDown,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
    const { createWorkout, checkHasWorkedOutToday, loading: submitting } = useWorkouts();

    // States
    const [loading, setLoading] = useState(true);
    const [hasWorkedOut, setHasWorkedOut] = useState(false);
    const [selectedActivity, setSelectedActivity] = useState<string>('gym');
    const [selectedMuscles, setSelectedMuscles] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [songName, setSongName] = useState('');
    const [songArtist, setSongArtist] = useState('');
    const [mediaFiles, setMediaFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    const fileInputRef = useRef<HTMLInputElement>(null);

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
            await createWorkout(
                {
                    description,
                    activity_type: selectedActivity as any,
                    song_name: songName || null,
                    song_artist: songArtist || null,
                },
                selectedMuscles,
                mediaFiles
            );
            navigate('/feed');
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
                <p className="text-gray-600 italic">
                    "La disciplina es el puente entre las metas y los logros."
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

    return (
        <div className="max-w-2xl mx-auto pb-10">
            <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Dumbbell className="text-primary h-6 w-6" />
                Registrar Entrenamiento
            </h1>

            <form onSubmit={handleSubmit} className="space-y-6">
                {/* Media Upload */}
                <Card className="border-none shadow-sm sm:border">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-semibold text-gray-500 uppercase tracking-wider">
                            Evidencia Visual
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {previews.map((preview, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border bg-gray-100">
                                    <img src={preview} alt="Preview" className="w-full h-full object-cover" />
                                    <button
                                        type="button"
                                        onClick={() => removeMedia(index)}
                                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full hover:bg-black/70 transition-colors"
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            ))}
                            {mediaFiles.length < 4 && (
                                <button
                                    type="button"
                                    onClick={() => fileInputRef.current?.click()}
                                    className="aspect-square rounded-lg border-2 border-dashed border-gray-300 flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-primary hover:text-primary hover:bg-primary/5 transition-all"
                                >
                                    <ImageIcon className="h-8 w-8" />
                                    <span className="text-[10px] font-bold uppercase">Subir</span>
                                </button>
                            )}
                        </div>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleFileChange}
                            className="hidden"
                            accept="image/*,video/*"
                            multiple
                        />
                        <p className="text-xs text-gray-400">Puedes subir hasta 4 fotos o videos de tu sesión.</p>
                    </CardContent>
                </Card>

                {/* Activity Selector */}
                <div className="space-y-3">
                    <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">¿Qué has hecho hoy?</Label>
                    <div className="grid grid-cols-4 gap-2">
                        {ACTIVITY_TYPES.map((activity) => (
                            <button
                                key={activity.value}
                                type="button"
                                onClick={() => setSelectedActivity(activity.value)}
                                className={cn(
                                    "flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all",
                                    selectedActivity === activity.value
                                        ? "border-primary bg-primary/5 text-primary shadow-sm"
                                        : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                                )}
                            >
                                <span className="text-2xl mb-1">{activity.icon}</span>
                                <span className="text-[10px] font-bold whitespace-nowrap">{activity.label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Muscle Groups */}
                {['gym', 'crossfit', 'yoga'].includes(selectedActivity) && (
                    <div className="space-y-3">
                        <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Músculos implicados</Label>
                        <div className="flex flex-wrap gap-2">
                            {MUSCLE_GROUPS.map((muscle) => (
                                <button
                                    key={muscle.value}
                                    type="button"
                                    onClick={() => handleMuscleToggle(muscle.value)}
                                    className={cn(
                                        "px-4 py-2 rounded-full text-xs font-semibold border-2 transition-all",
                                        selectedMuscles.includes(muscle.value)
                                            ? "border-primary bg-primary text-white"
                                            : "border-gray-100 bg-white text-gray-500 hover:border-gray-200"
                                    )}
                                >
                                    {muscle.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Description */}
                <div className="space-y-2">
                    <Label htmlFor="description" className="text-sm font-semibold text-gray-500 uppercase tracking-wider uppercase">Detalles del Entrenamiento</Label>
                    <textarea
                        id="description"
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="¿Cómo te has sentido? ¿Qué pesos has movido?"
                        className="flex min-h-[100px] w-full rounded-xl border border-input bg-white px-4 py-3 text-sm shadow-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                {/* Music (Optional) */}
                <Card className="border-none shadow-sm sm:border bg-gray-50/50">
                    <CardContent className="pt-6 space-y-4">
                        <Label className="text-sm font-semibold text-gray-500 uppercase tracking-wider flex items-center gap-2">
                            <Music className="h-4 w-4" />
                            ¿Qué estabas escuchando? (Opcional)
                        </Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="relative">
                                <div className="absolute left-3 top-3 h-4 w-4 text-gray-400">🎵</div>
                                <Input
                                    placeholder="Canción"
                                    className="pl-9 h-11 rounded-xl bg-white border-none shadow-sm"
                                    value={songName}
                                    onChange={(e) => setSongName(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <div className="absolute left-3 top-3 h-4 w-4 text-gray-400">👤</div>
                                <Input
                                    placeholder="Artista"
                                    className="pl-9 h-11 rounded-xl bg-white border-none shadow-sm"
                                    value={songArtist}
                                    onChange={(e) => setSongArtist(e.target.value)}
                                />
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {error && (
                    <div className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600">
                        <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                        <p className="text-sm font-medium">{error}</p>
                    </div>
                )}

                <Button
                    type="submit"
                    className="w-full h-14 text-lg font-bold rounded-2xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Spinner size="sm" className="mr-2 border-t-white" />
                            Publicando sesión...
                        </>
                    ) : (
                        '¡Bloquear Mi Entrenamiento!'
                    )}
                </Button>
            </form>
        </div>
    );
}
