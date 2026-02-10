-- ============================================
-- GROUP UNREAD TRACKING SYSTEM
-- ============================================

-- 1. Tabla para rastrear el último mensaje leído por cada usuario en cada grupo
create table if not exists public.group_message_reads (
  user_id uuid references public.users(id) on delete cascade not null,
  group_id uuid references public.groups(id) on delete cascade not null,
  last_read_message_id uuid references public.group_messages(id) on delete cascade,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  primary key (user_id, group_id)
);

-- 2. Seguridad (RLS)
alter table public.group_message_reads enable row level security;

-- Solo el usuario puede ver/modificar sus propios registros de lectura
drop policy if exists "Users can see their own group read status" on public.group_message_reads;
drop policy if exists "Users can update their own group read status" on public.group_message_reads;
drop policy if exists "Users can modify their own group read status" on public.group_message_reads;

create policy "Users can see their own group read status"
  on public.group_message_reads for select
  using (auth.uid() = user_id);

create policy "Users can update their own group read status"
  on public.group_message_reads for insert
  with check (auth.uid() = user_id);

create policy "Users can modify their own group read status"
  on public.group_message_reads for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 3. Habilitar Tiempo Real
do $$
begin
  if not exists (
    select 1 from pg_publication_tables 
    where pubname = 'supabase_realtime' 
    and schemaname = 'public' 
    and tablename = 'group_message_reads'
  ) then
    alter publication supabase_realtime add table public.group_message_reads;
  end if;
end $$;
