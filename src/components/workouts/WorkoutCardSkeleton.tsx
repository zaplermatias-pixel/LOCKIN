import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function WorkoutCardSkeleton() {
    return (
        <Card className="overflow-hidden border-2 border-sand/80 dark:border-white/20 shadow-2xl bg-white dark:bg-dark-surface rounded-[2.5rem] mb-8">
            <CardHeader className="p-5 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-11 w-11 rounded-full" />
                    <div className="space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                    </div>
                </div>
                <Skeleton className="h-8 w-20 rounded-2xl" />
            </CardHeader>

            <div className="mx-2 rounded-[2rem] overflow-hidden">
                <Skeleton className="aspect-[4/5] w-full" />
            </div>

            <CardContent className="p-6 space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
                <div className="flex gap-2 pt-2">
                    <Skeleton className="h-6 w-16 rounded-xl" />
                    <Skeleton className="h-6 w-16 rounded-xl" />
                </div>
            </CardContent>

            <CardFooter className="p-6 pt-0 flex gap-4">
                <Skeleton className="h-12 flex-1 rounded-2xl" />
                <Skeleton className="h-12 w-12 rounded-2xl" />
            </CardFooter>
        </Card>
    );
}
