import { useState, useRef } from 'react';
import { useGroups } from '@/hooks/useGroups';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2, Save, X } from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';

interface GroupSettingsDialogProps {
    group: any;
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    onUpdate: () => void;
}

export function GroupSettingsDialog({ group, isOpen, onOpenChange, onUpdate }: GroupSettingsDialogProps) {
    const { updateGroup, uploadGroupImage } = useGroups();
    const [name, setName] = useState(group.name);
    const [description, setDescription] = useState(group.description || '');
    const [imageUrl, setImageUrl] = useState(group.image_url || '');
    const [isSaving, setIsSaving] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const url = await uploadGroupImage(file);
            if (url) setImageUrl(url);
        } catch (error) {
            console.error('Failed to upload image:', error);
        } finally {
            setIsUploading(false);
        }
    };

    const handleSave = async () => {
        if (!name.trim()) return;
        setIsSaving(true);
        try {
            await updateGroup(group.id, {
                name,
                description,
                image_url: imageUrl
            });
            onUpdate();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update group:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="rounded-[2.5rem] border-none p-8 max-w-[90vw] sm:max-w-md bg-white">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-black text-left">Ajustes del Lock-In</DialogTitle>
                    <DialogDescription className="text-gray-400 font-bold text-left">
                        Personaliza la identidad visual y misión de tu equipo.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-6 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                    {/* Image Preview & Upload */}
                    <div className="relative group/cover">
                        <div className="w-full h-40 bg-gray-100 rounded-[2rem] overflow-hidden border-2 border-dashed border-gray-200 flex items-center justify-center relative">
                            {imageUrl ? (
                                <img src={imageUrl} alt="Cover" className="w-full h-full object-cover" />
                            ) : (
                                <Camera className="h-10 w-10 text-gray-300" />
                            )}
                            {isUploading && (
                                <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center">
                                    <Loader2 className="h-8 w-8 text-primary animate-spin" />
                                </div>
                            )}
                        </div>
                        <Button
                            variant="secondary"
                            size="sm"
                            className="absolute bottom-4 right-4 rounded-xl font-black text-[10px] uppercase tracking-widest bg-white/90 backdrop-blur-md shadow-lg"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            <Camera className="h-3 w-3 mr-2" />
                            {imageUrl ? 'Cambiar Foto' : 'Subir Foto'}
                        </Button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            onChange={handleImageUpload}
                            className="hidden"
                            accept="image/*"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-1">Nombre del Lock-In</label>
                        <Input
                            placeholder="Nombre del equipo..."
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="rounded-2xl bg-gray-50 border-none h-14 px-5 font-bold focus-visible:ring-primary/20"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-1">La Misión</label>
                        <Textarea
                            placeholder="¿Cuál es el objetivo principal?"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            className="rounded-2xl bg-gray-50 border-none min-h-[120px] p-5 font-bold focus-visible:ring-primary/20 resize-none"
                        />
                    </div>
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-3 pt-4">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        className="rounded-2xl font-bold order-2 sm:order-1"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim() || isUploading}
                        className="rounded-2xl font-black uppercase italic bg-primary text-white h-14 px-8 shadow-xl shadow-primary/20 order-1 sm:order-2 flex-1"
                    >
                        {isSaving ? <Spinner size="sm" className="mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
