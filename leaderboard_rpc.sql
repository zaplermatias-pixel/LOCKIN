-- Eliminar la función si ya existe para evitar errores de cambio de tipo de retorno
DROP FUNCTION IF EXISTS get_group_leaderboard(UUID, TEXT);

-- Función para obtener el ranking de un grupo por periodos (Semanal, Mensual, Histórico)
-- Puntos = Días con al menos un entrenamiento
CREATE OR REPLACE FUNCTION get_group_leaderboard(p_group_id UUID, p_period TEXT)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  profile_picture_url TEXT,
  points BIGINT
) AS $$
DECLARE
  v_start_date DATE;
BEGIN
  -- Definir fecha de inicio basada en el periodo
  IF p_period = 'weekly' THEN
    v_start_date := CURRENT_DATE - INTERVAL '7 days';
  ELSIF p_period = 'monthly' THEN
    v_start_date := CURRENT_DATE - INTERVAL '30 days';
  ELSE
    v_start_date := '1900-01-01'::DATE;
  END IF;

  RETURN QUERY
  SELECT 
    u.id as user_id,
    u.username,
    u.display_name,
    u.profile_picture_url,
    -- Contamos cuántos días únicos ha entrenado el usuario en ese rango
    COALESCE(sub.workout_days, 0) as points
  FROM public.group_members gm
  JOIN public.users u ON gm.user_id = u.id
  LEFT JOIN (
    SELECT 
      w.user_id, 
      COUNT(DISTINCT w.workout_date) as workout_days
    FROM public.workouts w
    WHERE w.is_deleted = false 
      AND w.workout_date >= v_start_date
    GROUP BY w.user_id
  ) sub ON u.id = sub.user_id
  WHERE gm.group_id = p_group_id
  ORDER BY points DESC, u.username ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
