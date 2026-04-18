import { useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
    Camera,
    User as UserIcon,
    FileText,
    Check,
    X,
    Loader2
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useNavigate } from 'react-router-dom';

const profileSchema = z.object({
    displayName: z.string().min(1, 'El nombre es requerido'),
    bio: z.string().max(160, 'Máximo 160 caracteres').optional(),
});

type ProfileForm = z.infer<typeof profileSchema>;

export function Settings() {
    const { user, session, updateProfile } = useAuth();
    const [isUploading, setIsUploading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const navigate = useNavigate();

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProfileForm>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: user?.display_name || '',
            bio: user?.bio || '',
        },
    });

    const onSubmit = async (data: ProfileForm) => {
        setError(null);
        setSuccess(false);
        try {
            await updateProfile({
                display_name: data.displayName,
                bio: data.bio || null,
            });
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            setError(err.message || 'Error al actualizar el perfil');
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        const currentUserId = user?.id || session?.user?.id;

        console.log('Settings: handleFileChange triggered', { hasFile: !!file, currentUserId });

        if (!file || !currentUserId) {
            console.warn('Settings: Missing file or user ID', { file, currentUserId });
            return;
        }

        // Validar tipo y tamaño (máx 2MB)
        if (!file.type.startsWith('image/')) {
            setError('Por favor selecciona una imagen válida');
            return;
        }
        if (file.size > 2 * 1024 * 1024) {
            setError('La imagen debe pesar menos de 2MB');
            return;
        }

        try {
            setIsUploading(true);
            setError(null);
            console.log('Settings: Starting file upload for ID:', currentUserId);

            const fileExt = file.name.split('.').pop();
            const fileName = `${currentUserId}-${Math.random()}.${fileExt}`;
            const filePath = `${fileName}`;

            // 1. Subir a Supabase Storage
            console.log('Settings: [DEBUG] Uploading to bucket profile-pictures...', filePath);
            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file, { upsert: true });

            if (uploadError) {
                console.error('Settings: [DEBUG] Storage upload error:', uploadError);
                throw uploadError;
            }
            console.log('Settings: [DEBUG] File uploaded successfully to Storage');

            // 2. Obtener URL pública
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);
            console.log('Settings: [DEBUG] Public URL generated:', publicUrl);

            // 3. Actualizar perfil del usuario con cache busting
            const urlWithCacheBust = `${publicUrl}?t=${Date.now()}`;
            console.log('Settings: [DEBUG] Updating profile with new URL:', urlWithCacheBust);
            await updateProfile({ profile_picture_url: urlWithCacheBust });

            console.log('Settings: [DEBUG] Profile update finished successfully');
            setSuccess(true);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err: any) {
            console.error('Settings: [FATAL ERROR] in handleFileChange:', err);
            setError(err.message || 'Error al subir la imagen');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-8 pb-20 animate-in fade-in duration-500 transition-colors">
            <header className="flex flex-col sm:flex-row items-center justify-between gap-4 px-1">
                <div>
                    <h1 className="text-4xl font-black text-primary dark:text-beige italic uppercase tracking-tighter leading-none text-center sm:text-left">Ajustes</h1>
                    <p className="text-[10px] font-bold text-primary/40 dark:text-beige/40 uppercase tracking-[0.2em] mt-2 text-center sm:text-left">Configuración y cuenta</p>
                </div>
                <Button variant="ghost" size="sm" className="rounded-2xl font-black uppercase italic text-primary dark:text-beige hover:bg-primary/5 dark:hover:bg-white/5" onClick={() => {
                    const profileId = user?.id || session?.user?.id;
                    navigate(`/profile/${profileId}`);
                }}>
                    Ver Mi Perfil
                </Button>
            </header>

            <div className="grid gap-8">
                {/* Avatar Section */}
                <Card className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-primary dark:text-beige">Foto de Perfil</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-6 p-8 pt-0">
                        <div className="relative group">
                            <Avatar key={user?.profile_picture_url || 'settings-avatar'} className="h-40 w-40 aspect-square border-4 border-white dark:border-dark-card shadow-2xl transition-transform duration-500 group-hover:scale-105">
                                <AvatarImage src={user?.profile_picture_url || ''} />
                                <AvatarFallback className="text-4xl bg-primary/5 dark:bg-beige/5 text-primary dark:text-beige font-black italic">
                                    {(user?.display_name?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                            >
                                {isUploading ? <Loader2 className="animate-spin h-8 w-8" /> : <Camera className="h-8 w-8" />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <p className="text-[10px] font-bold text-primary/40 dark:text-beige/40 uppercase tracking-widest">Formatos: JPG, PNG, GIF. Máx 2MB.</p>
                    </CardContent>
                </Card>

                {/* Profile Info Section */}
                <Card className="bg-white/60 dark:bg-dark-surface/60 backdrop-blur-xl rounded-[2.5rem] border border-white/40 dark:border-white/10 shadow-xl overflow-hidden transition-colors">
                    <CardHeader className="p-8 pb-4">
                        <CardTitle className="text-xl font-black italic uppercase tracking-tighter text-primary dark:text-beige">Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent className="p-8 pt-0">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="displayName" className="text-[11px] font-black uppercase tracking-widest text-primary/60 dark:text-beige/60 ml-1">Nombre a mostrar</Label>
                                <div className="relative group">
                                    <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary/30 dark:text-beige/30 transition-colors group-focus-within:text-primary dark:group-focus-within:text-beige" />
                                    <Input
                                        id="displayName"
                                        className="pl-12 h-14 rounded-2xl border-sand/50 dark:border-white/10 bg-white/50 dark:bg-dark-card/50 focus:ring-primary dark:focus:ring-beige transition-all font-bold text-primary dark:text-beige"
                                        placeholder="Tu nombre ninja..."
                                        {...register('displayName')}
                                    />
                                </div>
                                {errors.displayName && (
                                    <p className="text-xs text-red-500 font-bold ml-1">{errors.displayName.message}</p>
                                )}
                            </div>

                            <div className="space-y-3">
                                <Label htmlFor="bio" className="text-[11px] font-black uppercase tracking-widest text-primary/60 dark:text-beige/60 ml-1">Biografía</Label>
                                <div className="relative group">
                                    <FileText className="absolute left-4 top-4 h-5 w-5 text-primary/30 dark:text-beige/30 transition-colors group-focus-within:text-primary dark:group-focus-within:text-beige" />
                                    <textarea
                                        id="bio"
                                        className="flex min-h-[120px] w-full rounded-[1.5rem] border border-sand/50 dark:border-white/10 bg-white/50 dark:bg-dark-card/50 px-12 py-4 text-sm font-bold shadow-sm placeholder:text-primary/20 dark:placeholder:text-beige/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary dark:focus-visible:ring-beige disabled:cursor-not-allowed disabled:opacity-50 text-primary dark:text-beige transition-all italic"
                                        placeholder="Cuéntanos sobre tu camino fitness..."
                                        {...register('bio')}
                                    />
                                </div>
                                {errors.bio && (
                                    <p className="text-xs text-red-500 font-bold ml-1">{errors.bio.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-4 text-sm text-red-500 bg-red-50 dark:bg-red-950/20 rounded-2xl flex items-center gap-3 border border-red-100 dark:border-red-900/50 font-bold">
                                    <X className="h-5 w-5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-4 text-sm text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 rounded-2xl flex items-center gap-3 border border-emerald-100 dark:border-emerald-900/50 font-bold">
                                    <Check className="h-5 w-5 shrink-0" />
                                    ¡Perfil actualizado con éxito!
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full h-14 rounded-2xl font-black uppercase italic tracking-widest shadow-xl transition-all active:scale-95 bg-primary dark:bg-beige text-white dark:text-dark-bg hover:opacity-90"
                                disabled={isSubmitting || isUploading}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                        Guardando...
                                    </>
                                ) : 'Guardar Cambios'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
