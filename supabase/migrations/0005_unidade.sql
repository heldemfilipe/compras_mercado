-- ============================================================================
--  Unidade do item: unidade (un), quilo (kg) ou grama (g)
-- ----------------------------------------------------------------------------
--  Rode DEPOIS de 0001..0004.
--
--  Para peso, a quantidade é sempre guardada em KG (300 g -> quantity 0,3),
--  e unit_price é o preço por kg. Assim o total continuar sendo
--  quantity * unit_price.  O campo `unit` é só como mostrar/digitar.
--  `is_weight` é mantido em sincronia (unit <> 'un') por gatilho.
-- ============================================================================

alter table public.purchase_items
  add column if not exists unit text not null default 'un'
  check (unit in ('un', 'kg', 'g'));

alter table public.shopping_list_items
  add column if not exists unit text not null default 'un'
  check (unit in ('un', 'kg', 'g'));

alter table public.list_template_items
  add column if not exists unit text not null default 'un'
  check (unit in ('un', 'kg', 'g'));

-- itens que já eram "por peso" viram kg
update public.purchase_items     set unit = 'kg' where is_weight and unit = 'un';
update public.shopping_list_items set unit = 'kg' where is_weight and unit = 'un';
update public.list_template_items set unit = 'kg' where is_weight and unit = 'un';

-- mantém is_weight coerente com unit
create or replace function public.sync_is_weight()
returns trigger
language plpgsql
as $$
begin
  new.is_weight := (new.unit is distinct from 'un');
  return new;
end;
$$;

drop trigger if exists trg_sync_weight_purchase_items on public.purchase_items;
create trigger trg_sync_weight_purchase_items
  before insert or update of unit on public.purchase_items
  for each row execute function public.sync_is_weight();

drop trigger if exists trg_sync_weight_list_items on public.shopping_list_items;
create trigger trg_sync_weight_list_items
  before insert or update of unit on public.shopping_list_items
  for each row execute function public.sync_is_weight();

drop trigger if exists trg_sync_weight_template_items on public.list_template_items;
create trigger trg_sync_weight_template_items
  before insert or update of unit on public.list_template_items
  for each row execute function public.sync_is_weight();

-- ----------------------------------------------------------------------------
--  RPCs passam a carregar `unit`
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

  insert into public.shopping_list_items
    (list_id, name, category_id, quantity, is_weight, unit, sort_order)
  select v_list_id, ti.name, ti.category_id, ti.quantity, ti.is_weight,
         coalesce(ti.unit, 'un'), ti.sort_order
  from public.list_template_items ti
  where ti.template_id = p_template_id;

  return v_list_id;
end;
$$;

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
  v_purchase_id   uuid;
  v_market_id     uuid;
  v_ref_month     date;
  v_has_checked   boolean;
  v_missing_price boolean;
  v_date          date;
begin
  select market_id, reference_month
    into v_market_id, v_ref_month
  from public.shopping_lists
  where id = p_list_id;

  select exists(
    select 1 from public.shopping_list_items
    where list_id = p_list_id and checked
  ) into v_has_checked;

  v_date := coalesce(p_purchase_date, current_date);
  if v_ref_month is not null
     and date_trunc('month', v_date) <> date_trunc('month', v_ref_month) then
    v_date := (date_trunc('month', v_ref_month) + interval '1 month - 1 day')::date;
  end if;

  select exists(
    select 1 from public.shopping_list_items i
    where i.list_id = p_list_id
      and (i.checked or not v_has_checked)
      and coalesce(i.unit_price, 0) <= 0
  ) into v_missing_price;

  insert into public.purchases (market_id, purchase_date, status, note)
  values (
    v_market_id, v_date,
    case when v_missing_price then 'aberta' else 'concluida' end,
    'Gerada a partir de uma lista de compras'
  )
  returning id into v_purchase_id;

  insert into public.purchase_items
    (purchase_id, name, category_id, is_weight, unit, quantity, unit_price)
  select v_purchase_id, i.name, i.category_id, i.is_weight,
         coalesce(i.unit, 'un'), coalesce(i.quantity, 1), coalesce(i.unit_price, 0)
  from public.shopping_list_items i
  where i.list_id = p_list_id
    and (i.checked or not v_has_checked);

  update public.shopping_lists
  set status = 'concluida', purchase_id = v_purchase_id
  where id = p_list_id;

  return v_purchase_id;
end;
$$;
