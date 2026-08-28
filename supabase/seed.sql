-- ============================================================================
--  Dados iniciais (opcional) — categorias, mercados, o modelo de lista
--  "Compra do mês" (baseado numa lista real de caderno) e a lista do mês atual.
--
--  Ordem recomendada:
--    1) supabase/migrations/0001_init.sql
--    2) supabase/migrations/0002_categorias_automaticas.sql
--    3) este arquivo
--
--  É seguro rodar de novo: só insere o que ainda não existe.
-- ============================================================================

do $$
declare
  v_tpl uuid;
begin
  ---------------------------------------------------------------------------
  -- Categorias
  ---------------------------------------------------------------------------
  insert into public.categories (name, color) values
    ('Hortifrúti', '#22c55e'),
    ('Carnes',     '#ef4444'),
    ('Laticínios', '#f59e0b'),
    ('Padaria',    '#d97706'),
    ('Mercearia',  '#3b82f6'),
    ('Bebidas',    '#06b6d4'),
    ('Doces',      '#ec4899'),
    ('Limpeza',    '#a855f7'),
    ('Higiene',    '#8b5cf6'),
    ('Congelados', '#14b8a6'),
    ('Pet',        '#84cc16'),
    ('Outros',     '#71717a')
  on conflict (name) do nothing;

  ---------------------------------------------------------------------------
  -- Mercados de exemplo (só se não houver nenhum)
  ---------------------------------------------------------------------------
  if not exists (select 1 from public.markets) then
    insert into public.markets (name, color) values
      ('Assaí',        '#dc2626'),
      ('Atacadão',     '#2563eb'),
      ('Supermercado', '#16a34a'),
      ('Feira',        '#f59e0b'),
      ('Farmácia',     '#db2777');
  end if;

  ---------------------------------------------------------------------------
  -- Modelo padrão "Compra do mês" (só se não houver nenhum modelo)
  --   Baseado numa lista de caderno: seções Limpeza, Carnes e Geral.
  ---------------------------------------------------------------------------
  if not exists (select 1 from public.list_templates) then
    insert into public.list_templates (name, is_default)
    values ('Compra do mês', true)
    returning id into v_tpl;

    insert into public.list_template_items
      (template_id, name, quantity, unit, sort_order, category_id)
    select v_tpl, x.name, x.qty,
           case when x.weight then 'kg' else 'un' end, x.ord,
           (select id from public.categories where name = x.cat)
    from (values
      -- Limpeza / Higiene
      ('Papel higiênico (pct 12)', 1, false,  1, 'Higiene'),
      ('Sabonete líquido',         3, false,  2, 'Higiene'),
      ('Sabonete em barra',        2, false,  3, 'Higiene'),
      ('Veja Verde',               1, false,  4, 'Limpeza'),
      ('Álcool',                   2, false,  5, 'Limpeza'),
      ('Sabão em pó',              1, false,  6, 'Limpeza'),
      ('Amaciante',                1, false,  7, 'Limpeza'),
      ('Detergente',               1, false,  8, 'Limpeza'),
      ('Lava-roupas em gel',       1, false,  9, 'Limpeza'),
      ('Papel toalha',             1, false, 10, 'Limpeza'),
      -- Carnes
      ('Carne moída',              2, true,  11, 'Carnes'),
      ('Bife',                     2, true,  12, 'Carnes'),
      ('Linguiça toscana',         1, false, 13, 'Carnes'),
      ('Peito de frango',          2, false, 14, 'Carnes'),
      ('Carne para panela',        1, false, 15, 'Carnes'),
      ('Calabresa',                2, false, 16, 'Carnes'),
      ('Presunto (300g)',          1, false, 17, 'Carnes'),
      -- Geral / Mercearia
      ('Arroz',                    1, false, 18, 'Mercearia'),
      ('Feijão',                   2, false, 19, 'Mercearia'),
      ('Óleo',                     2, false, 20, 'Mercearia'),
      ('Macarrão',                 2, false, 21, 'Mercearia'),
      ('Molho de tomate',          4, false, 22, 'Mercearia'),
      ('Farinha de rosca',         1, false, 23, 'Mercearia'),
      ('Farofa (Yoki)',            1, false, 24, 'Mercearia'),
      ('Sazón carne',              1, false, 25, 'Mercearia'),
      ('Sazón frango',             1, false, 26, 'Mercearia'),
      ('Milho',                    6, false, 27, 'Mercearia'),
      ('Batata palha',             2, false, 28, 'Mercearia'),
      -- Laticínios
      ('Leite',                    8, false, 29, 'Laticínios'),
      ('Creme de leite',           6, false, 30, 'Laticínios'),
      ('Leite condensado',         2, false, 31, 'Laticínios'),
      ('Manteiga',                 1, false, 32, 'Laticínios'),
      ('Requeijão',                3, false, 33, 'Laticínios'),
      ('Danone',                   1, false, 34, 'Laticínios'),
      -- Doces
      ('Caixa de bombom',          1, false, 35, 'Doces')
    ) as x(name, qty, weight, ord, cat);
  end if;

  ---------------------------------------------------------------------------
  -- Lista de compras do mês atual, gerada do modelo padrão
  ---------------------------------------------------------------------------
  if v_tpl is not null
     and not exists (select 1 from public.shopping_lists) then
    perform public.generate_list_from_template(
      v_tpl,
      date_trunc('month', current_date)::date,
      'Compra do mês (exemplo)',
      (select id from public.markets where name = 'Assaí' limit 1)
    );
  end if;
end $$;
