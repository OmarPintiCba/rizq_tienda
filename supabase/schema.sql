-- ============================================================================
-- ESQUEMA RIZQ TIENDA — Clientes y Administradores
-- ============================================================================
-- Cómo usar este archivo:
-- 1. Andá a tu proyecto en supabase.com
-- 2. Menú lateral → "SQL Editor"
-- 3. "New query"
-- 4. Pegá TODO este archivo
-- 5. Clic en "Run" (o Ctrl+Enter)
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. CLIENTES
-- ----------------------------------------------------------------------------
-- La identidad (email/contraseña) vive en auth.users, manejada por Supabase.
-- Acá solo guardamos los datos propios del negocio (nombre, teléfono, etc.),
-- enlazados 1 a 1 con auth.users mediante el mismo id.

create table if not exists public.customers (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  phone text,
  created_at timestamptz not null default now()
);

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  label text not null,
  street text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  is_default boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.customers enable row level security;
alter table public.customer_addresses enable row level security;

-- Un cliente solo puede ver/editar SU PROPIA fila, nunca la de otro cliente.
create policy "customers_select_own" on public.customers
  for select using (auth.uid() = id);

create policy "customers_insert_own" on public.customers
  for insert with check (auth.uid() = id);

create policy "customers_update_own" on public.customers
  for update using (auth.uid() = id);

-- Direcciones: mismo criterio, solo las propias.
create policy "addresses_select_own" on public.customer_addresses
  for select using (auth.uid() = customer_id);

create policy "addresses_insert_own" on public.customer_addresses
  for insert with check (auth.uid() = customer_id);

create policy "addresses_update_own" on public.customer_addresses
  for update using (auth.uid() = customer_id);

create policy "addresses_delete_own" on public.customer_addresses
  for delete using (auth.uid() = customer_id);


-- ----------------------------------------------------------------------------
-- 2. ADMINISTRADORES
-- ----------------------------------------------------------------------------
-- Sistema completamente separado del de clientes: tabla propia, políticas
-- propias. Comparte únicamente el motor de autenticación de Supabase (auth.users),
-- que es el mismo para todo el proyecto, pero un cliente jamás puede ver ni
-- tocar esta tabla, y un administrador no aparece en la tabla de clientes.

create type public.admin_role as enum (
  'super_admin',
  'admin',
  'operador',
  'vendedor',
  'deposito',
  'marketing'
);

create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  email text not null,
  role public.admin_role not null default 'admin',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references public.admin_users(id) on delete set null
);

alter table public.admin_users enable row level security;

-- Función auxiliar (security definer) para poder preguntar "¿el usuario X es
-- super_admin?" desde una política, sin caer en recursión infinita de RLS.
create or replace function public.is_super_admin(uid uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.admin_users
    where id = uid and role = 'super_admin' and is_active = true
  );
$$;

-- Un administrador puede ver su propia fila (para saber su propio rol al
-- loguearse), y un Super Admin puede ver TODAS las filas (para gestionarlas).
create policy "admin_select_own_or_superadmin" on public.admin_users
  for select using (
    auth.uid() = id or public.is_super_admin(auth.uid())
  );

-- Alta del PRIMER administrador únicamente (bootstrap): solo se permite
-- insertar una fila para uno mismo si la tabla todavía está completamente
-- vacía. Una vez que existe al menos un admin, esta vía se cierra sola.
create policy "admin_insert_only_if_empty" on public.admin_users
  for insert with check (
    auth.uid() = id and not exists (select 1 from public.admin_users)
  );

-- Solo un Super Admin puede modificar (rol, bloqueo) filas de otros admins.
create policy "admin_update_by_superadmin" on public.admin_users
  for update using (public.is_super_admin(auth.uid()));

-- Solo un Super Admin puede eliminar administradores.
create policy "admin_delete_by_superadmin" on public.admin_users
  for delete using (public.is_super_admin(auth.uid()));


-- ----------------------------------------------------------------------------
-- Listo. Después de correr esto deberías ver, en el menú "Table Editor":
--   - customers
--   - customer_addresses
--   - admin_users
-- con el candado de RLS activado (ícono de escudo verde) en las tres.
-- ----------------------------------------------------------------------------
