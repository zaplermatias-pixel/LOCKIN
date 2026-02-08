-- ============================================
-- GROUP INVITATIONS SYSTEM (CORRECTED)
-- ============================================

-- 1. Tabla de Invitaciones
create table public.group_invites (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  inviter_id uuid references public.users(id) on delete cascade not null,
  invitee_id uuid references public.users(id) on delete cascade not null,
  status text check (status in ('pending', 'accepted', 'rejected')) default 'pending',
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. Índice Único Parcial (Para evitar duplicados solo en estado 'pending')
create unique index group_invites_pending_unique 
on public.group_invites (group_id, invitee_id) 
where (status = 'pending');

-- 3. RLS
alter table public.group_invites enable row level security;

-- 4. POLÍTICAS

-- Ver invitaciones
create policy "Users can see their sent or received invites"
  on public.group_invites for select
  using (auth.uid() = inviter_id or auth.uid() = invitee_id);

-- Enviar invitaciones: Solo admins del grupo
create policy "Admins can send invites"
  on public.group_invites for insert
  with check (
    exists (
      select 1 from public.group_members 
      where group_id = public.group_invites.group_id 
      and user_id = auth.uid() 
      and role = 'admin'
    )
  );
