import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { LoadingPage } from '@/components/ui/spinner';

export function ProtectedRoute() {
    const { session, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (!session) {
        return <Navigate to="/" replace />;
    }

    return <Outlet />;
}

export function PublicRoute() {
    const { session, loading } = useAuth();

    if (loading) {
        return <LoadingPage />;
    }

    if (session) {
        return <Navigate to="/feed" replace />;
    }

    return <Outlet />;
}
