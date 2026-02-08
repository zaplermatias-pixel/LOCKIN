-- ============================================
-- STORAGE SETUP (ENTRENAMIENTOS)
-- ============================================

-- 1. Crear el bucket 'workouts'
INSERT INTO storage.buckets (id, name, public) 
VALUES ('workouts', 'workouts', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Eliminar políticas antiguas (si las hubiera)
DROP POLICY IF EXISTS "Public access to workout media" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload workout media" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own workout media" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own workout media" ON storage.objects;

-- 3. Crear Políticas

-- VER: Público (para que amigos vean fotos)
CREATE POLICY "Public access to workout media" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'workouts' );

-- SUBIR: Solo autenticados
CREATE POLICY "Authenticated users can upload workout media" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'workouts' AND auth.role() = 'authenticated' );

-- BORRAR: Solo el dueño
CREATE POLICY "Users can delete their own workout media" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'workouts' AND auth.uid() = owner );
