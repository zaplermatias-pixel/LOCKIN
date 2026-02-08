-- ============================================
-- FRIENDSHIPS / FOLLOW SYSTEM
-- ============================================

-- Tabla de relaciones (quién sigue a quién)
create table public.friendships (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null, -- El que sigue (follower)
  friend_id uuid references public.users(id) on delete cascade not null, -- Al que siguen (following)
  status text check (status in ('accepted', 'pending')) default 'accepted', -- 'pending' para cuentas privadas en el futuro
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Evitar duplicados: no puedes seguir al mismo dos veces
  unique(user_id, friend_id),
  -- No te puedes seguir a ti mismo
  constraint no_self_follow check (user_id != friend_id)
);

-- RLS (Seguridad)
alter table public.friendships enable row level security;

-- 1. Ver seguidores/seguidos: Cualquiera puede ver quién sigue a quién (público base)
create policy "Friendships are viewable by everyone"
  on public.friendships for select
  using (true);

-- 2. Seguir (Insertar): Solo el usuario autenticado puede crear una relación donde él sea el 'user_id'
create policy "Users can follow others"
  on public.friendships for insert
  with check (auth.uid() = user_id);

-- 3. Dejar de seguir (Borrar): Solo el usuario autenticado puede borrar su propio 'follow'
create policy "Users can unfollow"
  on public.friendships for delete
  using (auth.uid() = user_id);

-- Índices para mejorar rendimiento
create index friendships_user_id_idx on public.friendships(user_id);
create index friendships_friend_id_idx on public.friendships(friend_id);
