-- ============================================
-- SISTEMA DE NOTIFICACIONES
-- ============================================

-- Tipos de notificación: follow, comment, workout, invite
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.users(id) on delete cascade not null, -- Quién recibe
  actor_id uuid references public.users(id) on delete cascade not null, -- Quién lo hace
  type text not null,
  resource_id uuid, -- ID del workout, grupo, etc.
  message text,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Seguridad (RLS)
alter table public.notifications enable row level security;

-- Solo el usuario puede ver sus propias notificaciones
create policy "Users can see their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

-- El sistema (o triggers) insertarán, pero por ahora permitimos insert si es autenticado
-- (En un entorno ideal, esto se haría mediante funciones RPC o triggers de DB)
create policy "Users can insert notifications"
  on public.notifications for insert
  with check (auth.uid() = actor_id);

-- El usuario puede marcar como leídas sus propias notificaciones
create policy "Users can update their own notifications"
  on public.notifications for update
  using (auth.uid() = user_id);

-- Habilitar Tiempo Real
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
