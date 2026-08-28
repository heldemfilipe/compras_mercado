-- ============================================================================
--  Sugestões de produto (autocomplete + comparação de preço)
-- ----------------------------------------------------------------------------
--  Rode DEPOIS de 0001 e 0002.
--
--  product_suggestions(p_before) devolve, para cada produto já comprado:
--    - nome de exibição e categoria mais recentes
--    - última quantidade comprada
--    - preço de referência = preço da última compra ANTERIOR a p_before
--      (e a data dele), para comparar "vs da última vez"
--    - menor / maior / média de preço no histórico anterior a p_before
--
--  Usada na tela de adicionar item da compra.
-- ============================================================================

create or replace function public.product_suggestions(
  p_before date default current_date
)
returns table (
  name          text,
  category_id   uuid,
  category_name text,
  category_color text,
  last_qty      numeric,
  ref_price     numeric,
  ref_date      date,
  min_price     numeric,
  max_price     numeric,
  avg_price     numeric,
  n_before      int,
  times_total   int
)
language sql
stable
as $$
  with base as (
    select
      lower(btrim(pi.name))                         as key,
      pi.name,
      pi.quantity,
      pi.unit_price,
      pi.category_id,
      pi.created_at,
      p.purchase_date,
      row_number() over (
        partition by lower(btrim(pi.name))
        order by p.purchase_date desc, pi.created_at desc
      ) as rn_all,
      row_number() over (
        partition by lower(btrim(pi.name))
        order by (p.purchase_date < p_before) desc,
                 p.purchase_date desc, pi.created_at desc
      ) as rn_ref
    from public.purchase_items pi
    join public.purchases p on p.id = pi.purchase_id
    where pi.unit_price > 0
      and pi.name not ilike 'outros itens%'
  ),
  agg as (
    select
      key,
      (array_agg(name       order by rn_all))[1]     as disp_name,
      (array_agg(quantity   order by rn_all))[1]     as last_qty,
      count(*)::int                                  as times_total,
      count(*) filter (where purchase_date < p_before)::int as n_before,
      min(unit_price) filter (where purchase_date < p_before) as min_price,
      max(unit_price) filter (where purchase_date < p_before) as max_price,
      round(avg(unit_price) filter (where purchase_date < p_before), 2) as avg_price
    from base
    group by key
  ),
  refrow as (
    select key, unit_price as ref_price, purchase_date as ref_date, category_id as ref_cat
    from base
    where rn_ref = 1 and purchase_date < p_before
  ),
  catrow as (
    select distinct on (key) key, category_id as any_cat
    from base
    where category_id is not null
    order by key, purchase_date desc, created_at desc
  )
  select
    a.disp_name,
    coalesce(r.ref_cat, c.any_cat),
    cat.name,
    cat.color,
    a.last_qty,
    r.ref_price,
    r.ref_date,
    a.min_price,
    a.max_price,
    a.avg_price,
    a.n_before,
    a.times_total
  from agg a
  left join refrow r  using (key)
  left join catrow c  using (key)
  left join public.categories cat
         on cat.id = coalesce(r.ref_cat, c.any_cat)
  order by a.times_total desc, a.disp_name;
$$;
