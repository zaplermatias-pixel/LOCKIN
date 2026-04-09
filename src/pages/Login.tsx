import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';
import { useState } from 'react';
import { Spinner } from '@/components/ui/spinner';

const loginSchema = z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(6, 'Mínimo 6 caracteres'),
});

type LoginForm = z.infer<typeof loginSchema>;

export function Login() {
    const { signIn } = useAuth();
    const navigate = useNavigate();
    const [error, setError] = useState<string | null>(null);

    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
        resolver: zodResolver(loginSchema),
    });

    const onSubmit = async (data: LoginForm) => {
        setError(null);
        try {
            await signIn(data.email, data.password);
            navigate('/feed');
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Error al iniciar sesión');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-earth-bg dark:bg-dark-bg px-4 transition-colors duration-300">
            <Card className="w-full max-w-md bg-white dark:bg-dark-surface backdrop-blur-md border-2 border-sand/80 dark:border-white/20 shadow-2xl">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-black italic uppercase tracking-tighter mb-2 text-primary dark:text-beige">LockIn</CardTitle>
                    <p className="text-sm font-bold uppercase tracking-widest text-primary/60 dark:text-beige/60">El esfuerzo no se presume, se honra</p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                {...register('email')}
                            />
                            {errors.email && (
                                <p className="text-sm text-red-500">{errors.email.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Contraseña</Label>
                            <Input
                                id="password"
                                type="password"
                                placeholder="••••••"
                                {...register('password')}
                            />
                            {errors.password && (
                                <p className="text-sm text-red-500">{errors.password.message}</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size="sm" className="mr-2 border-t-white" /> : null}
                            {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
                        </Button>

                        <div className="text-center text-xs font-bold uppercase tracking-wider mt-6">
                            <span className="text-primary/60 dark:text-beige/60">¿No tienes cuenta? </span>
                            <Link to="/register" className="text-primary dark:text-beige hover:underline transition-all underline-offset-4">
                                Regístrate
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
