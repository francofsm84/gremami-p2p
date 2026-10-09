-- ============================================================
-- MIGRACIÓN: Backfill email y username en tabla profiles
-- Ejecutar UNA VEZ en el SQL Editor de Supabase
-- para sincronizar usuarios existentes antes del fix.
-- ============================================================

-- 1. Copiar email desde auth.users a profiles para todos los usuarios existentes
UPDATE public.profiles p
SET
  email    = u.email,
  username = COALESCE(
    p.username,
    LOWER(REGEXP_REPLACE(
      COALESCE(u.raw_user_meta_data->>'name', SPLIT_PART(u.email, '@', 1)),
      '[^a-z0-9]', '_', 'g'
    ))
  ),
  updated_at = NOW()
FROM auth.users u
WHERE p.id = u.id
  AND (p.email IS NULL OR p.username IS NULL);

-- 2. Verificar resultado
SELECT id, full_name, email, username
FROM public.profiles
ORDER BY created_at DESC
LIMIT 20;
