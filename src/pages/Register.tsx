import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';
import { Dumbbell, AlertCircle } from 'lucide-react';

const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    username: z.string()
        .min(3, 'Mínimo 3 caracteres')
        .max(20, 'Máximo 20 caracteres')
        .regex(/^[a-zA-Z0-9_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
    displayName: z.string().min(1, 'El nombre es requerido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
    confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
});

type RegisterForm = z.infer<typeof registerSchema>;

export function Register() {
    const { signUp } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<RegisterForm>({
        resolver: zodResolver(registerSchema),
    });

    const onSubmit = async (data: RegisterForm) => {
        setError(null);
        try {
            const { data: existingUser, error: checkError } = await supabase
                .from('users')
                .select('username')
                .eq('username', data.username)
                .maybeSingle();

            if (checkError) throw checkError;
            if (existingUser) {
                setError('El nombre de usuario ya está en uso');
                return;
            }

            await signUp(data.email, data.password, data.username, data.displayName);
            navigate('/onboarding');
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Error al crear la cuenta');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-earth-bg dark:bg-dark-bg px-4 py-8 transition-colors duration-300">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-[1.5rem] bg-primary dark:bg-beige shadow-2xl shadow-primary/30 dark:shadow-beige/10 mb-5">
                        <Dumbbell className="h-8 w-8 text-white dark:text-dark-bg" />
                    </div>
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter text-primary dark:text-beige">LockIn</h1>
                    <p className="text-sm font-bold uppercase tracking-widest text-primary/50 dark:text-beige/50 mt-1">Únete. Entrena. Bloquea.</p>
                </div>

                {/* Card */}
                <div className="bg-white dark:bg-dark-surface border-2 border-sand/80 dark:border-white/20 rounded-[2.5rem] shadow-2xl p-8 space-y-5">
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                        {/* Display Name */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-primary/60 dark:text-beige/60">Nombre Completo</Label>
                            <Input
                                id="displayName"
                                placeholder="Juan Pérez"
                                {...register('displayName')}
                                className="h-12 rounded-2xl border-sand dark:border-white/10 bg-earth-bg/50 dark:bg-dark-card text-primary dark:text-beige placeholder:text-primary/30 dark:placeholder:text-beige/30 font-bold focus-visible:ring-primary dark:focus-visible:ring-beige/50"
                            />
                            {errors.displayName && (
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{errors.displayName.message}
                                </p>
                            )}
                        </div>

                        {/* Username */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-primary/60 dark:text-beige/60">Nombre de Usuario</Label>
                            <div className="relative">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-primary/30 dark:text-beige/30 font-black text-sm">@</span>
                                <Input
                                    id="username"
                                    placeholder="juan_fitness"
                                    {...register('username')}
                                    className="h-12 pl-8 rounded-2xl border-sand dark:border-white/10 bg-earth-bg/50 dark:bg-dark-card text-primary dark:text-beige placeholder:text-primary/30 dark:placeholder:text-beige/30 font-bold focus-visible:ring-primary dark:focus-visible:ring-beige/50"
                                />
                            </div>
                            {errors.username && (
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{errors.username.message}
                                </p>
                            )}
                        </div>

                        {/* Email */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-primary/60 dark:text-beige/60">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                {...register('email')}
                                className="h-12 rounded-2xl border-sand dark:border-white/10 bg-earth-bg/50 dark:bg-dark-card text-primary dark:text-beige placeholder:text-primary/30 dark:placeholder:text-beige/30 font-bold focus-visible:ring-primary dark:focus-visible:ring-beige/50"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{errors.email.message}
                                </p>
                            )}
                        </div>

                        {/* Password */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-primary/60 dark:text-beige/60">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••"
                                {...register('password')}
                                className="h-12 rounded-2xl border-sand dark:border-white/10 bg-earth-bg/50 dark:bg-dark-card text-primary dark:text-beige placeholder:text-primary/30 dark:placeholder:text-beige/30 font-bold focus-visible:ring-primary dark:focus-visible:ring-beige/50"
                            />
                            {errors.password && (
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{errors.password.message}
                                </p>
                            )}
                        </div>

                        {/* Confirm Password */}
                        <div className="space-y-2">
                            <Label className="text-xs font-black uppercase tracking-widest text-primary/60 dark:text-beige/60">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••"
                                {...register('confirmPassword')}
                                className="h-12 rounded-2xl border-sand dark:border-white/10 bg-earth-bg/50 dark:bg-dark-card text-primary dark:text-beige placeholder:text-primary/30 dark:placeholder:text-beige/30 font-bold focus-visible:ring-primary dark:focus-visible:ring-beige/50"
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-500 font-bold flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />{errors.confirmPassword.message}
                                </p>
                            )}
                        </div>

                        {/* Global Error */}
                        {error && (
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/40 rounded-2xl flex items-start gap-3">
                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                                <p className="text-sm text-red-600 dark:text-red-400 font-bold">{error}</p>
                            </div>
                        )}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full h-14 rounded-2xl bg-primary dark:bg-beige text-white dark:text-dark-bg font-black text-sm uppercase tracking-widest shadow-lg shadow-primary/30 dark:shadow-none hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-60 flex items-center justify-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <Spinner size="sm" className="border-t-white dark:border-t-dark-bg" />
                                    Creando cuenta...
                                </>
                            ) : '¡Crear Mi Cuenta!'}
                        </button>
                    </form>

                    {/* Footer */}
                    <div className="text-center pt-2">
                        <span className="text-sm font-bold text-primary/50 dark:text-beige/50">¿Ya tienes cuenta? </span>
                        <Link to="/" className="text-sm font-black text-primary dark:text-beige hover:underline uppercase tracking-widest">
                            Iniciar Sesión
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
