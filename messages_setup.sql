-- ============================================
-- MESSAGING SYSTEM
-- ============================================

-- 1. Tabla de Mensajes
create table public.messages (
  id uuid default gen_random_uuid() primary key,
  sender_id uuid references public.users(id) on delete cascade not null,
  receiver_id uuid references public.users(id) on delete cascade not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- RLS
alter table public.messages enable row level security;

-- POLÍTICAS

-- Ver mensajes: Solo el emisor o el receptor
create policy "Users can see their own messages"
  on public.messages for select
  using (auth.uid() = sender_id or auth.uid() = receiver_id);

-- Enviar mensajes: Solo el emisor puede ser el usuario autenticado
create policy "Users can send messages"
  on public.messages for insert
  with check (auth.uid() = sender_id);

-- Marcar como leído: Solo el receptor
create policy "Receivers can mark messages as read"
  on public.messages for update
  using (auth.uid() = receiver_id)
  with check (auth.uid() = receiver_id);

-- Realtime: Habilitar para la tabla de mensajes
alter publication supabase_realtime add table public.messages;
