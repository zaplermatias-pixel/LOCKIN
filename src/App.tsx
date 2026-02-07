import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ProtectedRoute, PublicRoute } from '@/components/auth/RouteGuards';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { NewWorkout } from '@/pages/NewWorkout';
import { Feed } from '@/pages/Feed';

// Páginas temporales (Placeholders)
const Search = () => <div className="p-4"><h1 className="text-2xl font-bold">Buscar</h1></div>;
const Groups = () => <div className="p-4"><h1 className="text-2xl font-bold">Grupos</h1></div>;
const Messages = () => <div className="p-4"><h1 className="text-2xl font-bold">Mensajes</h1></div>;

export default function App() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route element={<PublicRoute />}>
        <Route path="/" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>

      {/* Rutas Protegidas */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/new-workout" element={<NewWorkout />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
