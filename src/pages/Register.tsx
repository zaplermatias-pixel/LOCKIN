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
import { supabase } from '@/lib/supabase';
import { Spinner } from '@/components/ui/spinner';

const registerSchema = z.object({
    email: z.string().email('Email inválido'),
    username: z.string()
        .min(3, 'Mínimo 3 caracteres')
        .max(20, 'Máximo 20 caracteres')
        .regex(/^[a-zA-Z0-0_-]+$/, 'Solo letras, números, guiones y guiones bajos'),
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
            // Validar si el username ya existe
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
            navigate('/feed');
        } catch (error: any) {
            console.error(error);
            setError(error.message || 'Error al crear la cuenta');
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-8">
            <Card className="w-full max-w-md">
                <CardHeader className="text-center">
                    <CardTitle className="text-4xl font-bold mb-2">💪 LockIn</CardTitle>
                    <p className="text-gray-600">Únete a la comunidad de deporte real</p>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="displayName">Nombre Completo</Label>
                            <Input
                                id="displayName"
                                placeholder="Juan Pérez"
                                {...register('displayName')}
                            />
                            {errors.displayName && (
                                <p className="text-sm text-red-500">{errors.displayName.message}</p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="username">Nombre de Usuario</Label>
                            <Input
                                id="username"
                                placeholder="juan_fitness"
                                {...register('username')}
                            />
                            {errors.username && (
                                <p className="text-sm text-red-500">{errors.username.message}</p>
                            )}
                        </div>

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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="••••••"
                                {...register('confirmPassword')}
                            />
                            {errors.confirmPassword && (
                                <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {error && (
                            <div className="p-3 text-sm text-red-500 bg-red-50 rounded-md">
                                {error}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? <Spinner size="sm" className="mr-2 border-t-white" /> : null}
                            {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
                        </Button>

                        <div className="text-center text-sm">
                            <span className="text-gray-600">¿Ya tienes cuenta? </span>
                            <Link to="/" className="text-primary font-medium hover:underline">
                                Inicia sesión
                            </Link>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
