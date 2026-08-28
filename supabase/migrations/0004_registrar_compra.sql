-- ============================================================================
--  Melhoria em convert_list_to_purchase (lista -> compra do mês)
-- ----------------------------------------------------------------------------
--  Rode DEPOIS de 0001..0003.
--
--  Mudanças:
--   - A compra nasce como 'aberta' quando algum item vai sem preço
--     (aí ela aparece em "Em andamento" no Início para você completar os
--     valores). Se todos os itens já têm preço, nasce 'concluida'.
--   - Se a lista for de um mês diferente do atual, a data da compra usa
--     o último dia do mês de referência da lista.
-- ============================================================================

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
    v_market_id,
    v_date,
    case when v_missing_price then 'aberta' else 'concluida' end,
    'Gerada a partir de uma lista de compras'
  )
  returning id into v_purchase_id;

  insert into public.purchase_items
    (purchase_id, name, category_id, is_weight, quantity, unit_price)
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
