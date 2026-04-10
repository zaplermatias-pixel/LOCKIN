-- ============================================
-- WORKOUT MOTIVATIONS (LIKES/REACTIONS)
-- ============================================

create table if not exists public.workout_motivations (
  id uuid default gen_random_uuid() primary key,
  workout_id uuid references public.workouts(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,

  -- Un usuario solo puede motivar una vez por workout
  unique(workout_id, user_id)
);

-- RLS
alter table public.workout_motivations enable row level security;

-- Ver motivaciones: todos pueden verlas
create policy "Motivations are viewable by everyone"
  on public.workout_motivations for select
  using (true);

-- Agregar motivación: solo usuarios autenticados
create policy "Users can motivate workouts"
  on public.workout_motivations for insert
  with check (auth.uid() = user_id);

-- Quitar motivación: solo el propio usuario
create policy "Users can remove their own motivations"
  on public.workout_motivations for delete
  using (auth.uid() = user_id);

-- Index para performance
create index if not exists motivations_workout_id_idx on public.workout_motivations(workout_id);
create index if not exists motivations_user_id_idx on public.workout_motivations(user_id);
