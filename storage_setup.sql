-- ============================================
-- STORAGE SETUP (SOLO IMÁGENES)
-- Ejecuta esto para habilitar la subida de fotos
-- ============================================

-- 1. Crear el bucket 'profile-pictures' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas antiguas DE STORAGE para evitar duplicados al recrearlas
DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Anyone with account can upload avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;

-- 3. Crear Políticas de Storage

-- Acceso público para VER imágenes
CREATE POLICY "Avatar images are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'profile-pictures' );

-- Acceso autenticado para SUBIR imágenes
CREATE POLICY "Anyone with account can upload avatars" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'profile-pictures' AND auth.role() = 'authenticated' );

-- Acceso para ACTUALIZAR propias imágenes (dueño del objeto)
CREATE POLICY "Users can update their own avatars" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'profile-pictures' AND auth.uid() = owner );

-- Acceso para BORRAR propias imágenes
CREATE POLICY "Users can delete their own avatars" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'profile-pictures' AND auth.uid() = owner );
