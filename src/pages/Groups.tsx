import { useEffect, useState } from 'react';
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
    const { groups, invites, loading, fetchGroups, createGroup, fetchInvites, respondToInvite } = useGroups();
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    // Form State
    const [newName, setNewName] = useState('');
    const [newDesc, setNewDesc] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    useEffect(() => {
        fetchGroups();
        fetchInvites();
    }, [fetchGroups, fetchInvites]);

    const handleCreate = async () => {
        if (!newName.trim()) return;

        setIsCreating(true);
        try {
            await createGroup(newName, newDesc);
            setIsCreateOpen(false);
            setNewName('');
            setNewDesc('');
        } catch (error) {
            console.error('Error creating group:', error);
            alert('Error al crear el grupo. Inténtalo de nuevo.');
        } finally {
            setIsCreating(false);
        }
    };

    if (loading && groups.length === 0) {
        return <div className="flex justify-center py-20"><Spinner /></div>;
    }

    return (
        <div className="pb-20 pt-4 px-4 max-w-md mx-auto">
            <div className="flex items-center justify-between mb-8">
                <h1 className="text-2xl font-black italic uppercase tracking-tighter text-black">Mis Lock-Ins</h1>

                <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                    <DialogTrigger asChild>
                        <Button className="rounded-2xl gap-2 font-bold bg-primary text-white shadow-lg shadow-primary/20">
                            <Plus className="h-4 w-4" /> Crear
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="rounded-[2.5rem] border-none p-8 max-w-[90vw] sm:max-w-md bg-white">
                        <DialogHeader>
                            <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter text-black text-left">Nuevo Lock-In</DialogTitle>
                            <DialogDescription className="text-gray-400 font-bold text-left">
                                Crea un grupo para entrenar y competir con tus amigos.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-6">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-1">Nombre del Grupo</label>
                                <Input
                                    placeholder="Ej: Madrugadores 5AM"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="rounded-2xl bg-gray-50 border-none h-14 px-5 font-bold focus-visible:ring-primary/20 text-black"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-primary/40 ml-1">Misión (Opcional)</label>
                                <Textarea
                                    placeholder="¿Cuál es el objetivo?"
                                    value={newDesc}
                                    onChange={(e) => setNewDesc(e.target.value)}
                                    className="rounded-2xl bg-gray-50 border-none min-h-[100px] p-5 font-bold focus-visible:ring-primary/20 resize-none text-black"
                                />
                            </div>
                        </div>
                        <DialogFooter className="flex-col sm:flex-row gap-3">
                            <Button variant="ghost" onClick={() => setIsCreateOpen(false)} className="rounded-2xl font-bold order-2 sm:order-1 text-black">Cancelar</Button>
                            <Button
                                onClick={handleCreate}
                                disabled={isCreating || !newName.trim()}
                                className="rounded-2xl font-black uppercase italic bg-primary text-white h-14 px-8 shadow-xl shadow-primary/20 order-1 sm:order-2"
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
                        <Bell className="h-4 w-4 text-primary animate-bounce" />
                        <h2 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60">Invitaciones Pendientes</h2>
                    </div>
                    <div className="space-y-3">
                        {invites.map((invite) => (
                            <div
                                key={invite.id}
                                className="bg-white/80 backdrop-blur-md rounded-[2.5rem] p-5 shadow-xl border border-primary/10 flex items-center justify-between gap-4 ring-4 ring-primary/5"
                            >
                                <div className="flex-1 overflow-hidden">
                                    <h3 className="font-black italic text-sm uppercase tracking-tight text-primary truncate">
                                        {invite.groups?.name}
                                    </h3>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">
                                        De: @{invite.inviter?.username}
                                    </p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => respondToInvite(invite.id, invite.group_id, 'rejected')}
                                        className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors shadow-inner"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                    <button
                                        onClick={() => respondToInvite(invite.id, invite.group_id, 'accepted')}
                                        className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/20"
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
                                className="border-none shadow-sm hover:shadow-md transition-all cursor-pointer bg-white rounded-[2rem] overflow-hidden group active:scale-[0.98]"
                            >
                                <CardContent className="p-0 flex">
                                    <div className="w-20 bg-primary/5 flex items-center justify-center text-primary transition-colors group-hover:bg-primary/10">
                                        <Users className="h-6 w-6 opacity-40" />
                                    </div>
                                    <div className="p-5 flex-1">
                                        <h3 className="font-black italic text-lg uppercase tracking-tight leading-none mb-1 text-black">{group.name}</h3>
                                        {group.description && (
                                            <p className="text-sm text-gray-400 line-clamp-1 leading-tight">{group.description}</p>
                                        )}
                                        <div className="mt-3 flex items-center gap-2">
                                            <span className="text-[9px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-400 uppercase tracking-widest">
                                                {group.is_private ? 'Privado' : 'Público'}
                                            </span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-white/40 backdrop-blur-md rounded-[3rem] border-4 border-dashed border-sand/30">
                        <div className="bg-sand/30 p-6 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-6">
                            <Users className="h-10 w-10 text-primary/20" />
                        </div>
                        <h3 className="text-lg font-black uppercase italic text-primary/40">Sin Grupos</h3>
                        <p className="text-sm font-bold text-primary/30 max-w-[200px] mx-auto mt-2">Crea tu propio Lock-In para competir con amigos.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
