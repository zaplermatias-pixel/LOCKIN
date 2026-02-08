-- ============================================
-- GROUPS (LOCK-INS) SYSTEM
-- ============================================

-- 1. Tabla de Grupos
create table public.groups (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  image_url text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  is_private boolean default false
);

-- 2. Tabla de Miembros del Grupo
create table public.group_members (
  id uuid default gen_random_uuid() primary key,
  group_id uuid references public.groups(id) on delete cascade not null,
  user_id uuid references public.users(id) on delete cascade not null,
  role text check (role in ('admin', 'member')) default 'member',
  joined_at timestamp with time zone default timezone('utc'::text, now()) not null,
  
  -- Evitar duplicados: un usuario solo puede estar una vez en un grupo
  unique(group_id, user_id)
);

-- RLS (Seguridad)
alter table public.groups enable row level security;
alter table public.group_members enable row level security;

-- POLÍTICAS DE GRUPOS

-- Ver grupos:
-- 1. Si es público, cualquiera lo ve.
-- 2. Si es privado, solo los miembros lo ven.
create policy "Groups visibility"
  on public.groups for select
  using (
    is_private = false 
    or 
    exists (
      select 1 from public.group_members 
      where group_id = public.groups.id and user_id = auth.uid()
    )
  );

-- Crear grupos: Cualquiera autenticado
create policy "Users can create groups"
  on public.groups for insert
  with check (auth.uid() = created_by);

-- Editar grupos: Solo admins (por ahora, el creador es admin inicial)
create policy "Admins can update groups"
  on public.groups for update
  using (
    exists (
      select 1 from public.group_members 
      where group_id = public.groups.id 
      and user_id = auth.uid() 
      and role = 'admin'
    )
  );

-- POLÍTICAS DE MIEMBROS

-- Ver miembros: Visible si puedes ver el grupo
create policy "Group members visibility"
  on public.group_members for select
  using (
    exists (
      select 1 from public.groups 
      where id = public.group_members.group_id
      and (
        is_private = false 
        or 
        exists (
          select 1 from public.group_members as gm
          where gm.group_id = public.groups.id and gm.user_id = auth.uid()
        )
      )
    )
  );

-- Unirse (Insertar):
-- 1. El creador del grupo puede insertarse a sí mismo (para el setup inicial)
create policy "Creators can join their own groups"
  on public.group_members for insert
  with check (
    auth.uid() = user_id 
    and exists (
      select 1 from public.groups 
      where id = group_id and created_by = auth.uid()
    )
  );

-- 2. Cualquiera se une a grupos públicos.
create policy "Users can join public groups"
  on public.group_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.groups
      where id = group_id and is_private = false
    )
  );

-- Salir (Borrar): Uno mismo se puede borrar
create policy "Users can leave groups"
  on public.group_members for delete
  using (auth.uid() = user_id);
