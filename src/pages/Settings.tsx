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
import { Spinner } from '@/components/ui/spinner';
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
        <div className="max-w-2xl mx-auto space-y-6">
            <div className="flex items-center justify-between px-1">
                <h1 className="text-2xl font-bold">Configuración</h1>
                <Button variant="ghost" size="sm" onClick={() => {
                    const profileId = user?.id || session?.user?.id;
                    console.log('Settings: Navigating to profile ID:', profileId);
                    navigate(`/profile/${profileId}`);
                }}>
                    Ver Perfil
                </Button>
            </div>

            <div className="grid gap-6">
                {/* Avatar Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Foto de Perfil</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-col items-center gap-4">
                        <div className="relative group">
                            <Avatar key={user?.profile_picture_url || 'settings-avatar'} className="h-32 w-32 border-2 border-primary/10 shadow-sm transition-opacity group-hover:opacity-80">
                                <AvatarImage src={user?.profile_picture_url || ''} />
                                <AvatarFallback className="text-4xl bg-primary/5 text-primary">
                                    {(user?.display_name?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                disabled={isUploading}
                                className="absolute inset-0 flex items-center justify-center bg-black/40 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity disabled:cursor-not-allowed"
                            >
                                {isUploading ? <Loader2 className="animate-spin" /> : <Camera />}
                            </button>
                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                className="hidden"
                                accept="image/*"
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">Formatos: JPG, PNG, GIF. Máx 2MB.</p>
                    </CardContent>
                </Card>

                {/* Profile Info Section */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Información Personal</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="displayName">Nombre a mostrar</Label>
                                <div className="relative">
                                    <UserIcon className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="displayName"
                                        className="pl-9"
                                        placeholder="Ej. Tiago Gym"
                                        {...register('displayName')}
                                    />
                                </div>
                                {errors.displayName && (
                                    <p className="text-xs text-red-500 font-medium">{errors.displayName.message}</p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="bio">Biografía</Label>
                                <div className="relative">
                                    <FileText className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <textarea
                                        id="bio"
                                        className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-9 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                                        placeholder="Cuéntanos sobre tu camino fitness..."
                                        {...register('bio')}
                                    />
                                </div>
                                {errors.bio && (
                                    <p className="text-xs text-red-500 font-medium">{errors.bio.message}</p>
                                )}
                            </div>

                            {error && (
                                <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md flex items-center gap-2">
                                    <X className="h-4 w-4" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 text-sm text-emerald-600 bg-emerald-50 rounded-md flex items-center gap-2">
                                    <Check className="h-4 w-4" />
                                    Perfil actualizado con éxito
                                </div>
                            )}

                            <Button type="submit" className="w-full" disabled={isSubmitting || isUploading}>
                                {isSubmitting ? (
                                    <>
                                        <Spinner size="sm" className="mr-2 border-t-white" />
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
