import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Spinner } from '@/components/ui/spinner';
import { Camera, Upload, Check } from 'lucide-react';

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

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const filePath = `${user.id}-${Math.random()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('profile-pictures')
                .upload(filePath, file);

            if (uploadError) throw uploadError;

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('profile-pictures')
                .getPublicUrl(filePath);

            // 3. Update Profile
            await updateProfile({ profile_picture_url: publicUrl });

        } catch (error) {
            console.error('Error uploading avatar:', error);
            alert('Error al subir la imagen. Inténtalo de nuevo.');
        } finally {
            setIsUploading(false);
        }
    };

    const handleComplete = async () => {
        setIsSaving(true);
        try {
            if (bio.trim()) {
                await updateProfile({ bio });
            }
            // Navigate to feed after setup
            navigate('/feed');
        } catch (error) {
            console.error('Error completing onboarding:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl font-bold">¡Bienvenido, {user?.display_name}!</CardTitle>
                    <CardDescription>
                        Configura tu perfil para que otros atletas te reconozcan.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">

                    {/* Avatar Upload */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                            <Avatar className="h-32 w-32 border-4 border-white shadow-lg">
                                <AvatarImage src={user?.profile_picture_url || ''} />
                                <AvatarFallback className="text-4xl bg-primary/10 text-primary">
                                    {(user?.display_name?.[0] || 'U').toUpperCase()}
                                </AvatarFallback>
                            </Avatar>
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                                <Camera className="text-white h-8 w-8" />
                            </div>
                            {isUploading && (
                                <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-full">
                                    <Spinner size="md" />
                                </div>
                            )}
                        </div>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            Subir Foto
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileChange}
                        />
                    </div>

                    {/* Bio Input */}
                    <div className="space-y-2">
                        <Label htmlFor="bio">Tu Bio (Opcional)</Label>
                        <textarea
                            id="bio"
                            className="flex min-h-[100px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="Cuéntanos cuales son tus objetivos..."
                            value={bio}
                            onChange={(e) => setBio(e.target.value)}
                        />
                    </div>

                    <Button
                        onClick={handleComplete}
                        className="w-full"
                        size="lg"
                        disabled={isSaving || isUploading}
                    >
                        {isSaving ? (
                            <>
                                <Spinner className="mr-2 border-t-white" />
                                Guardando...
                            </>
                        ) : (
                            <>
                                <Check className="mr-2 h-4 w-4" />
                                Completar Perfil
                            </>
                        )}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
