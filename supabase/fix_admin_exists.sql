-- ============================================================================
-- FIX: permitir que cualquier visitante (sin sesión) pueda preguntar
-- "¿existe al menos un administrador?" sin poder ver ningún dato real.
-- ============================================================================
-- Cómo usar: SQL Editor de Supabase → New query → pegar esto → Run

create or replace function public.admin_exists()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.admin_users);
$$;

grant execute on function public.admin_exists() to anon, authenticated;
