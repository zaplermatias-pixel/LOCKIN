-- ============================================
-- GROUP MESSAGING SYSTEM (LOCK-IN CHAT)
-- ============================================

-- 1. Tabla de Mensajes de Grupo
create table if not exists public.group_messages (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Seguridad (RLS)
alter table public.group_messages enable row level security;

-- Eliminar políticas antiguas para evitar errores de duplicado
drop policy if exists "Group messages are viewable by members" on public.group_messages;
drop policy if exists "Group members can send messages" on public.group_messages;

-- Ver mensajes: Solo si eres miembro del grupo
create policy "Group messages are viewable by members"
  on public.group_messages for select
  using (   
    exists (
      select 1 from public.group_members
      where group_id = public.group_messages.group_id
      and user_id = auth.uid()
    )
  );

-- Enviar mensajes: Solo si eres miembro del grupo
create policy "Group members can send messages"
  on public.group_messages for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_members
      where group_id = public.group_messages.group_id
      and user_id = auth.uid()
    )
  );

-- 3. Habilitar Tiempo Real
-- Nota: Esto puede fallar si ya está en la publicación, pero no detiene la ejecución
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'group_messages'
  ) then
    alter publication supabase_realtime add table public.group_messages;
  end if;
end $$;
