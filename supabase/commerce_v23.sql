-- ============================================================================
-- RIZQ v23 — CHECKOUT + VENTAS + CARRITOS ABANDONADOS
-- Ejecutar UNA SOLA VEZ en Supabase SQL Editor después de products.sql.
-- Mercado Pago NO se integra en esta versión; queda preparado para v24.
-- ============================================================================

create table if not exists public.checkout_carts (
  id uuid primary key default gen_random_uuid(),
  session_token uuid not null unique,
  status text not null default 'active' check (status in ('active','abandoned','converted')),
  customer_first_name text,
  customer_last_name text,
  customer_email text,
  customer_phone text,
  customer_document text,
  street text,
  street_number text,
  city text,
  province text,
  postal_code text,
  notes text,
  subtotal numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  created_at timestamptz not null default now(),
  last_activity_at timestamptz not null default now(),
  converted_at timestamptz
);

create table if not exists public.checkout_cart_items (
  id uuid primary key default gen_random_uuid(),
  cart_id uuid not null references public.checkout_carts(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create table if not exists public.sales (
  id uuid primary key default gen_random_uuid(),
  sale_number bigint generated always as identity unique,
  cart_id uuid references public.checkout_carts(id) on delete set null,
  customer_first_name text not null,
  customer_last_name text not null,
  customer_email text not null,
  customer_phone text not null,
  customer_document text not null,
  street text not null,
  street_number text not null,
  city text not null,
  province text not null,
  postal_code text not null,
  notes text,
  delivery_method text not null default 'local_pickup' check (delivery_method in ('local_pickup','shipping')),
  payment_method text not null check (payment_method in ('cash','mercadopago')),
  payment_status text not null check (payment_status in ('pending','paid','rejected','cancelled')),
  fulfillment_status text not null default 'pending' check (fulfillment_status in ('pending','preparing','ready','delivered','cancelled')),
  subtotal numeric(12,2) not null check (subtotal >= 0),
  shipping_amount numeric(12,2) not null default 0 check (shipping_amount >= 0),
  total numeric(12,2) not null check (total >= 0),
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  sku text,
  unit_price numeric(12,2) not null check (unit_price >= 0),
  quantity integer not null check (quantity > 0),
  line_total numeric(12,2) not null check (line_total >= 0),
  created_at timestamptz not null default now()
);

create index if not exists checkout_carts_status_idx on public.checkout_carts(status);
create index if not exists checkout_carts_activity_idx on public.checkout_carts(last_activity_at desc);
create index if not exists checkout_cart_items_cart_idx on public.checkout_cart_items(cart_id);
create index if not exists sales_created_at_idx on public.sales(created_at desc);
create index if not exists sales_payment_status_idx on public.sales(payment_status);
create index if not exists sale_items_sale_idx on public.sale_items(sale_id);

alter table public.checkout_carts enable row level security;
alter table public.checkout_cart_items enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;

-- Solo administradores pueden leer/modificar las tablas directamente.
drop policy if exists "checkout_carts_admin_all" on public.checkout_carts;
create policy "checkout_carts_admin_all" on public.checkout_carts for all
  using (public.is_active_admin(auth.uid()))
  with check (public.is_active_admin(auth.uid()));

drop policy if exists "checkout_cart_items_admin_all" on public.checkout_cart_items;
create policy "checkout_cart_items_admin_all" on public.checkout_cart_items for all
  using (public.is_active_admin(auth.uid()))
  with check (public.is_active_admin(auth.uid()));

drop policy if exists "sales_admin_all" on public.sales;
create policy "sales_admin_all" on public.sales for all
  using (public.is_active_admin(auth.uid()))
  with check (public.is_active_admin(auth.uid()));

drop policy if exists "sale_items_admin_all" on public.sale_items;
create policy "sale_items_admin_all" on public.sale_items for all
  using (public.is_active_admin(auth.uid()))
  with check (public.is_active_admin(auth.uid()));

-- Guardar/actualizar un carrito público sin exponer los carritos de otros clientes.
create or replace function public.save_checkout_cart(
  p_session_token uuid,
  p_customer jsonb,
  p_items jsonb,
  p_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_item jsonb;
  v_product public.products%rowtype;
  v_qty integer;
  v_price numeric(12,2);
  v_subtotal numeric(12,2) := 0;
begin
  if p_session_token is null then raise exception 'Sesión de carrito inválida'; end if;
  if jsonb_typeof(p_items) <> 'array' then raise exception 'Items inválidos'; end if;

  insert into public.checkout_carts (
    session_token, status, customer_first_name, customer_last_name, customer_email,
    customer_phone, customer_document, street, street_number, city, province,
    postal_code, notes, last_activity_at
  ) values (
    p_session_token, 'active', nullif(trim(p_customer->>'firstName'),''), nullif(trim(p_customer->>'lastName'),''),
    nullif(lower(trim(p_customer->>'email')),''), nullif(trim(p_customer->>'phone'),''), nullif(trim(p_customer->>'document'),''),
    nullif(trim(p_customer->>'street'),''), nullif(trim(p_customer->>'streetNumber'),''), nullif(trim(p_customer->>'city'),''),
    nullif(trim(p_customer->>'province'),''), nullif(trim(p_customer->>'postalCode'),''), nullif(trim(p_notes),''), now()
  )
  on conflict (session_token) do update set
    status = case when checkout_carts.status = 'converted' then checkout_carts.status else 'active' end,
    customer_first_name = excluded.customer_first_name,
    customer_last_name = excluded.customer_last_name,
    customer_email = excluded.customer_email,
    customer_phone = excluded.customer_phone,
    customer_document = excluded.customer_document,
    street = excluded.street,
    street_number = excluded.street_number,
    city = excluded.city,
    province = excluded.province,
    postal_code = excluded.postal_code,
    notes = excluded.notes,
    last_activity_at = now()
  returning id into v_cart_id;

  if exists(select 1 from public.checkout_carts where id=v_cart_id and status='converted') then
    return v_cart_id;
  end if;

  delete from public.checkout_cart_items where cart_id = v_cart_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty := greatest(1, least(99, coalesce((v_item->>'quantity')::integer,1)));
    select * into v_product from public.products
      where id = (v_item->>'productId')::uuid and is_active = true;
    if not found then continue; end if;
    v_qty := least(v_qty, v_product.stock);
    if v_qty <= 0 then continue; end if;
    v_price := coalesce(v_product.sale_price, v_product.price);
    insert into public.checkout_cart_items(cart_id, product_id, product_name, sku, unit_price, quantity, line_total)
    values(v_cart_id, v_product.id, v_product.name, v_product.sku, v_price, v_qty, v_price * v_qty);
    v_subtotal := v_subtotal + (v_price * v_qty);
  end loop;

  update public.checkout_carts set subtotal=v_subtotal, total=v_subtotal, last_activity_at=now() where id=v_cart_id;
  return v_cart_id;
end;
$$;

-- Crear una venta pendiente en efectivo. Efectivo = retiro en local exclusivamente.
create or replace function public.create_cash_sale(
  p_session_token uuid,
  p_customer jsonb,
  p_items jsonb,
  p_notes text default null
)
returns table(sale_id uuid, sale_number bigint, total numeric)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cart_id uuid;
  v_sale_id uuid;
  v_sale_number bigint;
  v_total numeric(12,2);
  v_missing text;
begin
  if nullif(trim(p_customer->>'firstName'),'') is null then v_missing := 'nombre';
  elsif nullif(trim(p_customer->>'lastName'),'') is null then v_missing := 'apellido';
  elsif nullif(trim(p_customer->>'email'),'') is null then v_missing := 'email';
  elsif nullif(trim(p_customer->>'phone'),'') is null then v_missing := 'teléfono';
  elsif nullif(trim(p_customer->>'document'),'') is null then v_missing := 'DNI/CUIT';
  elsif nullif(trim(p_customer->>'street'),'') is null then v_missing := 'calle';
  elsif nullif(trim(p_customer->>'streetNumber'),'') is null then v_missing := 'número';
  elsif nullif(trim(p_customer->>'city'),'') is null then v_missing := 'ciudad';
  elsif nullif(trim(p_customer->>'province'),'') is null then v_missing := 'provincia';
  elsif nullif(trim(p_customer->>'postalCode'),'') is null then v_missing := 'código postal';
  end if;
  if v_missing is not null then raise exception 'Falta completar %', v_missing; end if;

  v_cart_id := public.save_checkout_cart(p_session_token, p_customer, p_items, p_notes);
  select c.total into v_total from public.checkout_carts c where c.id=v_cart_id and c.status <> 'converted';
  if coalesce(v_total,0) <= 0 then raise exception 'El carrito está vacío o sin stock'; end if;

  insert into public.sales as s(
    cart_id, customer_first_name, customer_last_name, customer_email, customer_phone, customer_document,
    street, street_number, city, province, postal_code, notes, delivery_method, payment_method,
    payment_status, fulfillment_status, subtotal, shipping_amount, total
  )
  select c.id, c.customer_first_name, c.customer_last_name, c.customer_email, c.customer_phone, c.customer_document,
    c.street, c.street_number, c.city, c.province, c.postal_code, c.notes,
    'local_pickup', 'cash', 'pending', 'pending', c.subtotal, 0, c.total
  from public.checkout_carts c where c.id=v_cart_id
  returning s.id, s.sale_number into v_sale_id, v_sale_number;

  insert into public.sale_items(sale_id, product_id, product_name, sku, unit_price, quantity, line_total)
  select v_sale_id, product_id, product_name, sku, unit_price, quantity, line_total
  from public.checkout_cart_items where cart_id=v_cart_id;

  update public.checkout_carts set status='converted', converted_at=now(), last_activity_at=now() where id=v_cart_id;
  return query select v_sale_id, v_sale_number, v_total;
end;
$$;

create or replace function public.mark_sale_paid(p_sale_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_admin(auth.uid()) then raise exception 'No autorizado'; end if;
  update public.sales set payment_status='paid', paid_at=now(), updated_at=now()
  where id=p_sale_id and payment_status='pending';
end;
$$;

create or replace function public.update_sale_fulfillment(p_sale_id uuid, p_status text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_active_admin(auth.uid()) then raise exception 'No autorizado'; end if;
  if p_status not in ('pending','preparing','ready','delivered','cancelled') then raise exception 'Estado inválido'; end if;
  update public.sales set fulfillment_status=p_status, updated_at=now() where id=p_sale_id;
end;
$$;

grant execute on function public.save_checkout_cart(uuid,jsonb,jsonb,text) to anon, authenticated;
grant execute on function public.create_cash_sale(uuid,jsonb,jsonb,text) to anon, authenticated;
grant execute on function public.mark_sale_paid(uuid) to authenticated;
grant execute on function public.update_sale_fulfillment(uuid,text) to authenticated;
