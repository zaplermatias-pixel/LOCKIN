import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Camera, ArrowRight, Dumbbell } from 'lucide-react';

export function Onboarding() {
    const { user, updateProfile } = useAuth();
    const navigate = useNavigate();
    const [bio, setBio] = useState('');
    const [isUploading, setIsUploading] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user) return;
        try {
            setIsUploading(true);
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}-${Math.random()}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file);
            if (uploadError) throw uploadError;
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);
            await updateProfile({ profile_picture_url: publicUrl });
        } catch (error) {
            console.error('Error uploading avatar:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            if (bio.trim()) await updateProfile({ bio });
            navigate('/feed');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-earth-bg dark:bg-dark-bg px-4 py-8 transition-colors duration-300">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary dark:bg-beige shadow-2xl shadow-primary/30 dark:shadow-beige/10 mb-5">
                        <Dumbbell className="h-8 w-8 text-white dark:text-dark-bg" />
                    </div>
                    <h1 className="text-3xl font-black italic uppercase tracking-tighter text-primary dark:text-beige">
                        ¡Bienvenido, {user?.display_name}!
                    </h1>
                    <p className="text-sm font-bold uppercase tracking-widest text-primary/50 dark:text-beige/50 mt-1">
                        Último paso antes del Lock-In
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-dark-surface border-2 border-sand/80 dark:border-white/20 rounded-[2.5rem] shadow-2xl p-8 space-y-8">

                    {/* Avatar */}
                    <div className="flex flex-col items-center gap-4">
                        <div
                            className="relative group cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Avatar className="h-28 w-28 border-4 border-white dark:border-dark-surface shadow-xl ring-4 ring-primary/10 dark:ring-beige/10">
                                <AvatarImage src={user?.profile_picture_url || ''} />
                                <AvatarFallback className="text-4xl bg-primary/10 dark:bg-beige/10 text-primary dark:text-beige font-black italic">
                                    {(user?.display_name?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200">
                                <Camera className="text-white h-7 w-7" />
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 dark:bg-dark-surface/80 rounded-full">
                                    <Spinner size="md" />
                                </div>
                            )}
                        </div>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                            className="text-xs font-black uppercase tracking-widest text-primary/50 dark:text-beige/50 hover:text-primary dark:hover:text-beige transition-colors flex items-center gap-1.5 disabled:opacity-40"
                        >
                            <Camera className="h-3 w-3" />
                            {isUploading ? 'Subiendo...' : 'Añadir foto de perfil'}
                        </button>
                        <input ref={fileInputRef} type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </div>

                    {/* Bio */}
                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/60 dark:text-beige/60">
                            Tu Bio <span className="font-bold normal-case">(Opcional)</span>
                        </label>
                        <textarea
                            id="bio"
                            className="flex min-h-[100px] w-full rounded-2xl border border-sand dark:border-white/10 bg-earth-bg/50 dark:bg-dark-card text-primary dark:text-beige px-4 py-3 text-sm font-bold shadow-sm placeholder:text-primary/30 dark:placeholder:text-beige/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 dark:focus-visible:ring-beige/30 transition-colors"
                            placeholder="¿Cuáles son tus objetivos? ¿Qué te mueve a entrenar?"
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    {/* Submit */}
                    <button
                        onClick={handleComplete}
                        disabled={isSaving || isUploading}
                        className="w-full h-14 rounded-2xl bg-primary dark:bg-beige text-white dark:text-dark-bg font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/30 dark:shadow-none hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                    >
                        {isSaving ? (
                            <>
                                <Spinner size="sm" className="border-t-white dark:border-t-dark-bg" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                ¡Entrar al Lock-In!
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </button>

                    <p className="text-center text-xs font-bold text-primary/30 dark:text-beige/30 uppercase tracking-widest">
                        Puedes completar esto después desde tu perfil
                    </p>
                </div>
            </div>
        </div>
    );
}
