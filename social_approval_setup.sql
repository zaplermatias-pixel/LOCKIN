-- 1. Cambiar el estado por defecto de las amistades a 'pending'
ALTER TABLE public.friendships ALTER COLUMN status SET DEFAULT 'pending';

-- 2. Asegurarse de que el tipo de notificación 'follow' se interprete como solicitud si está pendiente
-- (No hace falta cambio de esquema, solo lógica de hook)

-- 3. Habilitar política de actualización (UPDATE) para que el receptor pueda aceptar
-- El receptor es 'friend_id'. Solo él puede cambiar el status a 'accepted'
CREATE POLICY "Users can accept follow requests"
  ON public.friendships FOR UPDATE
  USING (auth.uid() = followed_id)
  WITH CHECK (status = 'accepted');

-- 4. Habilitar política de borrado para el receptor (RECHAZAR)
-- El receptor puede borrar una solicitud que no quiere
CREATE POLICY "Users can decline follow requests"
  ON public.friendships FOR DELETE
  USING (auth.uid() = followed_id);
