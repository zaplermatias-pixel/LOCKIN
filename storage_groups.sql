-- ============================================
-- STORAGE SETUP FOR GROUPS
-- ============================================

-- 1. Crear el bucket 'group-images' si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('group-images', 'group-images', true)
ON CONFLICT (id) DO NOTHING;

-- 2. Políticas de Storage para 'group-images'

-- Acceso público para VER imágenes
CREATE POLICY "Group images are publicly accessible" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'group-images' );

-- Acceso autenticado para SUBIR imágenes
CREATE POLICY "Anyone with account can upload group images" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'group-images' AND auth.role() = 'authenticated' );

-- Acceso para ACTUALIZAR propias imágenes (dueño del objeto)
CREATE POLICY "Users can update their group images" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'group-images' AND auth.uid() = owner );

-- Acceso para BORRAR propias imágenes
CREATE POLICY "Users can delete their group images" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'group-images' AND auth.uid() = owner );
