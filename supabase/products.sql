-- ============================================================================
-- PRODUCTOS + IMÁGENES — RIZQ TIENDA
-- ============================================================================
-- Ejecutar DESPUÉS de schema.sql y categories.sql.
-- Crea catálogo persistente, costo privado para administradores y bucket público
-- para imágenes de productos.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null default '',
  price numeric(12,2) not null check (price >= 0),
  sale_price numeric(12,2) check (sale_price is null or sale_price >= 0),
  sku text not null unique,
  barcode text,
  category_id uuid references public.categories(id) on delete set null,
  brand text not null default '',
  stock integer not null default 0 check (stock >= 0),
  min_stock integer not null default 0 check (min_stock >= 0),
  is_active boolean not null default true,
  is_featured boolean not null default false,
  badge text,
  images text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Datos sensibles/operativos separados para no exponer el costo en el catálogo público.
create table if not exists public.product_private (
  product_id uuid primary key references public.products(id) on delete cascade,
  cost numeric(12,2) not null default 0 check (cost >= 0),
  updated_at timestamptz not null default now()
);

create index if not exists products_category_id_idx on public.products(category_id);
create index if not exists products_is_active_idx on public.products(is_active);
create index if not exists products_is_featured_idx on public.products(is_featured);

alter table public.products enable row level security;
alter table public.product_private enable row level security;

-- Visitantes: solo productos activos. Administradores activos: todos.
drop policy if exists "products_select_public_or_admin" on public.products;
create policy "products_select_public_or_admin" on public.products
  for select using (
    is_active = true or public.is_active_admin(auth.uid())
  );

-- Solo administradores activos modifican catálogo.
drop policy if exists "products_insert_admin" on public.products;
create policy "products_insert_admin" on public.products
  for insert with check (public.is_active_admin(auth.uid()));

drop policy if exists "products_update_admin" on public.products;
create policy "products_update_admin" on public.products
  for update using (public.is_active_admin(auth.uid()))
  with check (public.is_active_admin(auth.uid()));

drop policy if exists "products_delete_admin" on public.products;
create policy "products_delete_admin" on public.products
  for delete using (public.is_active_admin(auth.uid()));

-- El costo jamás es público.
drop policy if exists "product_private_select_admin" on public.product_private;
create policy "product_private_select_admin" on public.product_private
  for select using (public.is_active_admin(auth.uid()));

drop policy if exists "product_private_insert_admin" on public.product_private;
create policy "product_private_insert_admin" on public.product_private
  for insert with check (public.is_active_admin(auth.uid()));

drop policy if exists "product_private_update_admin" on public.product_private;
create policy "product_private_update_admin" on public.product_private
  for update using (public.is_active_admin(auth.uid()))
  with check (public.is_active_admin(auth.uid()));

drop policy if exists "product_private_delete_admin" on public.product_private;
create policy "product_private_delete_admin" on public.product_private
  for delete using (public.is_active_admin(auth.uid()));

-- Mantener updated_at automáticamente.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists product_private_set_updated_at on public.product_private;
create trigger product_private_set_updated_at
before update on public.product_private
for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- STORAGE: bucket público de imágenes. Subidas/borrados solo por admin activo.
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = excluded.public;

drop policy if exists "product_images_insert_admin" on storage.objects;
create policy "product_images_insert_admin" on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'product-images'
    and public.is_active_admin(auth.uid())
  );

drop policy if exists "product_images_update_admin" on storage.objects;
create policy "product_images_update_admin" on storage.objects
  for update to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_active_admin(auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and public.is_active_admin(auth.uid())
  );

drop policy if exists "product_images_delete_admin" on storage.objects;
create policy "product_images_delete_admin" on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'product-images'
    and public.is_active_admin(auth.uid())
  );

-- El catálogo inicia vacío. Los productos se crean desde el administrador.
