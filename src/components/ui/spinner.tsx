import { cn } from "@/lib/utils";

interface SpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

export function Spinner({ className, size = 'md' }: SpinnerProps) {
    const sizeClasses = {
        sm: 'h-4 w-4 border-2',
        md: 'h-8 w-8 border-b-2',
        lg: 'h-12 w-12 border-b-4',
    };

    return (
        <div className={cn(
            "animate-spin rounded-full border-primary/30 border-t-primary dark:border-beige/30 dark:border-t-beige",
            sizeClasses[size],
            className
        )}></div>
    );
}

export function LoadingPage() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-earth-bg dark:bg-dark-bg transition-colors duration-300">
            <Spinner size="lg" />
            <p className="mt-4 text-primary/80 dark:text-beige/80 font-bold uppercase tracking-widest text-sm">Cargando LockIn...</p>
        </div>
    );
}
