-- ============================================================================
-- CATEGORÍAS — tabla real en Supabase (reemplaza el estado en memoria)
-- ============================================================================
-- Cómo usar: SQL Editor de Supabase → New query → pegar → Run

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  parent_id uuid references public.categories(id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;

-- Cualquier visitante (incluso sin sesión) puede VER las categorías —
-- son necesarias para navegar la tienda pública.
create policy "categories_select_public" on public.categories
  for select using (true);

-- Solo un administrador activo puede crear, editar o borrar categorías.
-- Reutiliza la función is_super_admin ya creada, pero acá alcanza con
-- "es cualquier admin activo", no hace falta ser super_admin específicamente.
create or replace function public.is_active_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_users
    where id = uid and is_active = true
  );
$$;

grant execute on function public.is_active_admin(uuid) to anon, authenticated;

create policy "categories_insert_admin" on public.categories
  for insert with check (public.is_active_admin(auth.uid()));

create policy "categories_update_admin" on public.categories
  for update using (public.is_active_admin(auth.uid()));

create policy "categories_delete_admin" on public.categories
  for delete using (public.is_active_admin(auth.uid()));

-- La v22 no inserta categorías de demostración.
-- Las categorías se crean desde el administrador y pueden tener cualquier nivel mediante parent_id.
