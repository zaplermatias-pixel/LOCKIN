-- ============================================
-- BUSQUEDA DE USUARIOS (FUZZY SEARCH SIMPLE)
-- ============================================

-- Función RPC para buscar usuarios
-- Se llama desde el cliente con: supabase.rpc('p_users_search', { query: 'juan' })

create or replace function p_users_search(query text)
returns setof public.users
language sql
security definer
as $$
  select *
  from public.users
  where (
    username ilike '%' || query || '%'
    or display_name ilike '%' || query || '%'
  )
  order by 
    case 
      when username ilike query then 1 -- Match exacto prioridad
      when username ilike query || '%' then 2 -- Empieza por query
      else 3 
    end,
    username asc
  limit 20;
$$;

-- Política de seguridad (asegurate que public.users tenga RLS habilitado y políticas de lectura)
-- Ya tenemos "Public profiles are viewable by everyone" en workouts_setup.sql o similar, 
-- pero confirmamos que esta función devuelve datos públicos.
