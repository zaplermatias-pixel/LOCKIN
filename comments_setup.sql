-- ============================================
-- COMENTARIOS EN WORKOUTS
-- ============================================

-- Tabla de comentarios
create table public.comments (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS (Seguridad)
alter table public.comments enable row level security;

-- 1. Ver comentarios: Cualquiera puede ver comentarios
create policy "Comments are viewable by everyone"
  on public.comments for select
  using (true);

-- 2. Comentar (Insertar): Solo usuarios autenticados
create policy "Authenticated users can comment"
  on public.comments for insert
  with check (auth.uid() = user_id);

-- 3. Borrar: Solo el autor del comentario o el dueño del workout puede borrarlo
create policy "Authors can delete their own comments"
  on public.comments for delete
  using (auth.uid() = user_id);

-- Índices para mejorar rendimiento
create index comments_workout_id_idx on public.comments(workout_id);
create index comments_user_id_idx on public.comments(user_id);
