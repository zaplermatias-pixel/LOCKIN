-- ============================================
-- FIX: PERMISSIONS FOR GROUP INVITATIONS
-- ============================================

-- 1. Permitir que los invitados actualicen su invitación (Aceptar/Rechazar)
create policy "Invitees can update their invites"
  on public.group_invites for update
  using (auth.uid() = invitee_id)
  with check (auth.uid() = invitee_id);

-- 2. Permitir unirse a grupos PRIVADOS si existe una invitación aceptada
create policy "Users can join private groups if invited"
  on public.group_members for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.group_invites
      where group_id = public.group_members.group_id
      and invitee_id = auth.uid()
      and status = 'accepted'
    )
  );

-- 3. Asegurar que los perfiles de usuario sean visibles para todos (necesario para el join del feed)
-- (Si ya existe, esta política simplemente se sumará o fallará si el nombre es idéntico)
do $$
begin
    if not exists (
        select 1 from pg_policies 
        where tablename = 'users' and policyname = 'Profiles are viewable by everyone'
    ) then
        create policy "Profiles are viewable by everyone" on public.users
        for select using (true);
    end if;
end $$;
