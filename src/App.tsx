import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { Login } from '@/pages/Login';
import { Register } from '@/pages/Register';
import { ProtectedRoute, PublicRoute } from '@/components/auth/RouteGuards';
import { Profile } from '@/pages/Profile';
import { Settings } from '@/pages/Settings';
import { NewWorkout } from '@/pages/NewWorkout';
import { Feed } from '@/pages/Feed';
import { Onboarding } from '@/pages/Onboarding';

// Páginas temporales (Placeholders)
import { Search } from '@/pages/Search';
import { Groups } from '@/pages/Groups';
import { GroupDetails } from '@/pages/GroupDetails';
import { Messages } from '@/pages/Messages';
import { Chat } from '@/pages/Chat';
import { WorkoutDetail } from '@/pages/WorkoutDetail';

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
        <Route path="/onboarding" element={<Onboarding />} />
        <Route element={<AppLayout />}>
          <Route path="/feed" element={<Feed />} />
          <Route path="/search" element={<Search />} />
          <Route path="/new-workout" element={<NewWorkout />} />
          <Route path="/groups" element={<Groups />} />
          <Route path="/groups/:groupId" element={<GroupDetails />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/:userId" element={<Chat />} />
          <Route path="/profile/:id" element={<Profile />} />
          <Route path="/workout/:id" element={<WorkoutDetail />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>

      {/* Redirección por defecto */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
