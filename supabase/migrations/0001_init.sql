-- ============================================================================
--  Compras de Mercado — esquema inicial
-- ----------------------------------------------------------------------------
--  Rode este arquivo inteiro no Supabase:
--    Dashboard > SQL Editor > New query > cole tudo > Run
--
--  Modelo de dados: uso doméstico compartilhado.
--  Qualquer usuário autenticado enxerga e edita os mesmos dados
--  (você e sua esposa, por exemplo). Pessoas sem login não acessam nada.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
--  profiles — espelho de auth.users só para exibir um nome amigável
-- ----------------------------------------------------------------------------
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  display_name text,
  created_at   timestamptz not null default now()
);

alter table public.profiles enable row level security;

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles
  for select to authenticated using (true);

drop policy if exists "profiles_upsert_self" on public.profiles;
create policy "profiles_upsert_self" on public.profiles
  for insert to authenticated with check (id = auth.uid());

drop policy if exists "profiles_update_self" on public.profiles;
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- cria o profile automaticamente quando um usuário novo é registrado
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1))
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ----------------------------------------------------------------------------
--  markets — mercados onde você compra (personalizável)
-- ----------------------------------------------------------------------------
create table if not exists public.markets (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  color      text,                       -- hex opcional para os gráficos
  archived   boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.markets enable row level security;
drop policy if exists "markets_rw" on public.markets;
create policy "markets_rw" on public.markets
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
--  categories — agrupam produtos nos gráficos
-- ----------------------------------------------------------------------------
create table if not exists public.categories (
  id         uuid primary key default gen_random_uuid(),
  name       text not null unique,
  color      text,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
drop policy if exists "categories_rw" on public.categories;
create policy "categories_rw" on public.categories
  for all to authenticated using (true) with check (true);

-- ----------------------------------------------------------------------------
--  purchases — uma ida ao mercado (tem vários itens)
-- ----------------------------------------------------------------------------
create table if not exists public.purchases (
  id            uuid primary key default gen_random_uuid(),
  market_id     uuid references public.markets (id) on delete set null,
  purchase_date date not null default current_date,
  status        text not null default 'aberta' check (status in ('aberta', 'concluida')),
  note          text,
  created_by    uuid default auth.uid() references auth.users (id) on delete set null,
  created_at    timestamptz not null default now()
);

alter table public.purchases enable row level security;
drop policy if exists "purchases_rw" on public.purchases;
create policy "purchases_rw" on public.purchases
  for all to authenticated using (true) with check (true);

create index if not exists purchases_date_idx on public.purchases (purchase_date desc);

-- ----------------------------------------------------------------------------
--  purchase_items — produto + valor dentro de uma compra
--    quantidade x valor unitário. Para itens por peso, quantity = kg e
--    unit_price = preço por kg — o total continua quantity * unit_price.
-- ----------------------------------------------------------------------------
create table if not exists public.purchase_items (
  id          uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  name        text not null,
  category_id uuid references public.categories (id) on delete set null,
  is_weight   boolean not null default false,
  quantity    numeric(12, 3) not null default 1 check (quantity >= 0),
  unit_price  numeric(12, 2) not null default 0 check (unit_price >= 0),
  total       numeric(12, 2) generated always as (round(quantity * unit_price, 2)) stored,
  created_at  timestamptz not null default now()
);

alter table public.purchase_items enable row level security;
drop policy if exists "purchase_items_rw" on public.purchase_items;
create policy "purchase_items_rw" on public.purchase_items
  for all to authenticated using (true) with check (true);

create index if not exists purchase_items_purchase_idx on public.purchase_items (purchase_id);
create index if not exists purchase_items_name_idx on public.purchase_items (lower(name));

-- ----------------------------------------------------------------------------
--  list_templates — modelos de lista de compras reaproveitáveis
-- ----------------------------------------------------------------------------
create table if not exists public.list_templates (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  is_default boolean not null default false,
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  created_at timestamptz not null default now()
);

alter table public.list_templates enable row level security;
drop policy if exists "list_templates_rw" on public.list_templates;
create policy "list_templates_rw" on public.list_templates
  for all to authenticated using (true) with check (true);

-- só um modelo pode ser o padrão
create unique index if not exists list_templates_single_default
  on public.list_templates (is_default) where is_default;

create table if not exists public.list_template_items (
  id          uuid primary key default gen_random_uuid(),
  template_id uuid not null references public.list_templates (id) on delete cascade,
  name        text not null,
  category_id uuid references public.categories (id) on delete set null,
  quantity    numeric(12, 3) not null default 1,
  is_weight   boolean not null default false,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.list_template_items enable row level security;
drop policy if exists "list_template_items_rw" on public.list_template_items;
create policy "list_template_items_rw" on public.list_template_items
  for all to authenticated using (true) with check (true);

create index if not exists list_template_items_tpl_idx on public.list_template_items (template_id);

-- ----------------------------------------------------------------------------
--  shopping_lists — a lista de um mês (normalmente gerada de um modelo)
-- ----------------------------------------------------------------------------
create table if not exists public.shopping_lists (
  id              uuid primary key default gen_random_uuid(),
  title           text not null,
  reference_month date not null default date_trunc('month', current_date)::date,
  template_id     uuid references public.list_templates (id) on delete set null,
  market_id       uuid references public.markets (id) on delete set null,
  status          text not null default 'ativa' check (status in ('ativa', 'concluida', 'arquivada')),
  purchase_id     uuid references public.purchases (id) on delete set null,
  created_by      uuid default auth.uid() references auth.users (id) on delete set null,
  created_at      timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;
drop policy if exists "shopping_lists_rw" on public.shopping_lists;
create policy "shopping_lists_rw" on public.shopping_lists
  for all to authenticated using (true) with check (true);

create index if not exists shopping_lists_month_idx on public.shopping_lists (reference_month desc);

create table if not exists public.shopping_list_items (
  id          uuid primary key default gen_random_uuid(),
  list_id     uuid not null references public.shopping_lists (id) on delete cascade,
  name        text not null,
  category_id uuid references public.categories (id) on delete set null,
  quantity    numeric(12, 3) not null default 1,
  is_weight   boolean not null default false,
  unit_price  numeric(12, 2),
  checked     boolean not null default false,
  note        text,
  sort_order  int not null default 0,
  created_at  timestamptz not null default now()
);

alter table public.shopping_list_items enable row level security;
drop policy if exists "shopping_list_items_rw" on public.shopping_list_items;
create policy "shopping_list_items_rw" on public.shopping_list_items
  for all to authenticated using (true) with check (true);

create index if not exists shopping_list_items_list_idx on public.shopping_list_items (list_id);

-- ----------------------------------------------------------------------------
--  RPC: gerar uma lista do mês a partir de um modelo
-- ----------------------------------------------------------------------------
create or replace function public.generate_list_from_template(
  p_template_id uuid,
  p_month       date default date_trunc('month', current_date)::date,
  p_title       text default null,
  p_market_id   uuid default null
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_list_id uuid;
  v_title   text;
  v_month   date := date_trunc('month', coalesce(p_month, current_date))::date;
begin
  v_title := coalesce(
    nullif(trim(p_title), ''),
    (select name from public.list_templates where id = p_template_id),
    'Lista de compras'
  );

  insert into public.shopping_lists (title, reference_month, template_id, market_id)
  values (v_title, v_month, p_template_id, p_market_id)
  returning id into v_list_id;

  insert into public.shopping_list_items (list_id, name, category_id, quantity, is_weight, sort_order)
  select v_list_id, ti.name, ti.category_id, ti.quantity, ti.is_weight, ti.sort_order
  from public.list_template_items ti
  where ti.template_id = p_template_id;

  return v_list_id;
end;
$$;

-- ----------------------------------------------------------------------------
--  RPC: transformar uma lista em compra registrada
--    Usa os itens marcados (checked). Se nenhum estiver marcado, usa todos.
-- ----------------------------------------------------------------------------
create or replace function public.convert_list_to_purchase(
  p_list_id       uuid,
  p_purchase_date date default current_date
)
returns uuid
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_purchase_id uuid;
  v_market_id   uuid;
  v_has_checked boolean;
begin
  select market_id into v_market_id from public.shopping_lists where id = p_list_id;

  select exists(
    select 1 from public.shopping_list_items where list_id = p_list_id and checked
  ) into v_has_checked;

  insert into public.purchases (market_id, purchase_date, status, note)
  values (v_market_id, coalesce(p_purchase_date, current_date), 'concluida',
          'Gerada a partir de uma lista de compras')
  returning id into v_purchase_id;

  insert into public.purchase_items (purchase_id, name, category_id, is_weight, quantity, unit_price)
  select v_purchase_id, i.name, i.category_id, i.is_weight,
         coalesce(i.quantity, 1), coalesce(i.unit_price, 0)
  from public.shopping_list_items i
  where i.list_id = p_list_id
    and (i.checked or not v_has_checked);

  update public.shopping_lists
  set status = 'concluida', purchase_id = v_purchase_id
  where id = p_list_id;

  return v_purchase_id;
end;
$$;

-- ============================================================================
--  Fim do esquema. Rode supabase/seed.sql em seguida (opcional) para começar
--  com categorias e um modelo de lista já prontos.
-- ============================================================================
