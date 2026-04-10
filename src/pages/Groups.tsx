import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGroups } from '@/hooks/useGroups';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Spinner } from '@/components/ui/spinner';
import { Plus, Users, Check, X, Bell } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';

export function Groups() {
    const navigate = useNavigate();
    const { groups, invites, loading, createGroup, respondToInvite, isCreating } = useGroups();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');

    // React Query maneja la carga automáticamente al montar el componente 🚀

    const handleCreate = async () => {
        if (!newName.trim()) return;

        try {
            await createGroup(newName, newDesc);
            setIsCreateOpen(false);
            setNewName('');
            setNewDesc('');
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Error al crear el grupo. Inténtalo de nuevo.');
        }
    };

    if (loading && groups.length === 0) {
        return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    return (
        <div className="pb-20 pt-4 px-4 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-primary dark:text-beige">Mis Lock-Ins</h1>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl gap-2 font-bold bg-primary dark:bg-beige text-white dark:text-dark-bg shadow-lg shadow-primary/20 dark:shadow-none hover:scale-105 transition-all">
                            <Plus className="h-4 w-4" /> Crear
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] border-none p-8 max-w-[90vw] sm:max-w-md bg-white dark:bg-dark-surface shadow-2xl transition-colors">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-primary dark:text-beige text-left">Nuevo Lock-In</DialogTitle>
                            <DialogDescription className="text-primary/40 dark:text-beige/40 font-bold text-left">
                                Crea un grupo para entrenar y competir con tus amigos.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/40 dark:text-beige/40 ml-1">Nombre del Grupo</label>
                                <Input
                                    placeholder="Ej: Madrugadores 5AM"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="rounded-2xl bg-earth-bg/50 dark:bg-dark-card/50 border-none h-14 px-5 font-bold focus-visible:ring-primary/20 dark:focus-visible:ring-beige/20 text-primary dark:text-beige transition-all"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/40 dark:text-beige/40 ml-1">Misión (Opcional)</label>
                                <Textarea
                                    placeholder="¿Cuál es el objetivo?"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="rounded-2xl bg-earth-bg/50 dark:bg-dark-card/50 border-none min-h-[100px] p-5 font-bold focus-visible:ring-primary/20 dark:focus-visible:ring-beige/20 resize-none text-primary dark:text-beige transition-all"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-3">
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-2xl font-bold order-2 sm:order-1 text-primary dark:text-beige hover:bg-earth-bg dark:hover:bg-white/5 transition-all">Cancelar</Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating || !newName.trim()}
                                className="rounded-2xl font-black uppercase italic bg-primary dark:bg-beige text-white dark:text-dark-bg h-14 px-8 shadow-xl shadow-primary/20 dark:shadow-none order-1 sm:order-2"
                            >
                                {isCreating ? <Spinner size="sm" className="mr-2" /> : 'Crear Lock-In'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {/* PENDING INVITES SECTION */}
            {invites.length > 0 && (
                <div className="mb-10 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="flex items-center gap-2 mb-4 px-2">
                        <Bell className="h-4 w-4 text-primary dark:text-beige animate-bounce" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 dark:text-beige/60">Invitaciones Pendientes</h2>
                    </div>
                    <div className="space-y-3">
                        {invites.map((invite) => (
                            <div
                                key={invite.id}
                                className="bg-white/80 dark:bg-dark-surface/80 backdrop-blur-md rounded-[2.5rem] p-5 shadow-xl border border-primary/10 dark:border-white/10 flex items-center justify-between gap-4 ring-4 ring-primary/5 dark:ring-white/5 transition-colors"
                            >
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-black italic text-sm uppercase tracking-tight text-primary dark:text-beige truncate">
                                        {invite.groups?.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-primary/40 dark:text-beige/40 uppercase tracking-widest mt-0.5">
                                        De: @{invite.inviter?.username}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => respondToInvite(invite.id, invite.group_id, 'rejected')}
                                        className="w-10 h-10 rounded-full bg-sand/20 dark:bg-white/5 flex items-center justify-center text-primary/40 dark:text-beige/40 hover:bg-red-500 hover:text-white dark:hover:bg-red-500 transition-all shadow-inner"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => respondToInvite(invite.id, invite.group_id, 'accepted')}
                                        className="w-10 h-10 rounded-full bg-primary dark:bg-beige flex items-center justify-center text-white dark:text-dark-bg hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20 dark:shadow-none"
                                    >
                                        <Check className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="h-px bg-primary/5 mt-10 mb-2" />
                </div>
            )}

            <div className="space-y-4">
                {groups.length > 0 ? (
                    <div className="grid gap-4">
                        {groups.map(group => (
                            <Card
                                key={group.id}
                                onClick={() => navigate(`/groups/${group.id}`)}
                                className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white/60 dark:bg-dark-card/40 rounded-[2rem] overflow-hidden group active:scale-[0.98] ring-1 ring-sand/20 dark:ring-white/10"
                            >
                                <CardContent className="p-0 flex">
                                    <div className="w-20 bg-primary/5 dark:bg-beige/5 flex items-center justify-center text-primary dark:text-beige transition-colors group-hover:bg-primary/10 dark:group-hover:bg-beige/10">
                                        <Users className="h-6 w-6 opacity-40" />
                                    </div>
                                    <div className="p-5 flex-1">
                                        <h3 className="font-black italic text-lg uppercase tracking-tight leading-none mb-1 text-primary dark:text-beige">{group.name}</h3>
                                        {group.description && (
                                            <p className="text-sm text-primary/40 dark:text-beige/40 line-clamp-1 leading-tight font-bold">{group.description}</p>
                                        )}
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-primary/5 dark:bg-beige/5 px-3 py-1 rounded-full text-primary/30 dark:text-beige/30 uppercase tracking-widest border border-primary/5 dark:border-beige/5">
                                                {group.is_private ? 'Privado' : 'Público'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-24 bg-white/40 dark:bg-dark-surface/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-sand/30 dark:border-white/10 ring-1 ring-sand/20 dark:ring-white/5 transition-colors">
                        <div className="bg-sand/30 dark:bg-white/5 p-8 rounded-[2.5rem] w-24 h-24 flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <Users className="h-10 w-10 text-primary/20 dark:text-beige/20" />
                        </div>
                        <h3 className="text-xl font-black uppercase italic tracking-tighter text-primary/40 dark:text-beige/40 mb-2">Sin Grupos</h3>
                        <p className="text-[10px] font-bold text-primary/30 dark:text-beige/30 max-w-[200px] mx-auto px-4 leading-relaxed uppercase tracking-widest opacity-60">Crea tu propio Lock-In para competir con amigos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
