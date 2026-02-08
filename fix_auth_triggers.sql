-- ============================================
-- AUTOMATIC PROFILE CREATION (TRIGGERS)
-- Ejecuta esto para que el perfil se cree SOLO
-- ============================================

-- 1. Crear la función que maneja el nuevo usuario
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (
    id, 
    email, 
    username, 
    display_name, 
    profile_picture_url,
    account_type,
    current_streak,
    total_workouts
  )
  VALUES (
    NEW.id,
    NEW.email,
    -- Usar metadata si existe, sino crear uno por defecto
    COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', NEW.raw_user_meta_data->>'full_name', 'Nuevo Usuario'),
    COALESCE(NEW.raw_user_meta_data->>'avatar_url', ''),
    'public',
    0,
    0
  )
  ON CONFLICT (id) DO NOTHING; -- Si ya existe, no hacer nada
  return NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Asegurar que el trigger no exista duplicado
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. Crear el Trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. Opcional: Asegurar que los perfiles existentes tengan su fila (Retroactive fix)
INSERT INTO public.users (id, email, username, display_name)
SELECT 
  id, 
  email, 
  'user_' || substr(id::text, 1, 8), 
  'Usuario Recuperado'
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.users)
ON CONFLICT DO NOTHING;
