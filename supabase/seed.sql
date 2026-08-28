-- ============================================================================
--  Dados iniciais (opcional) — categorias, mercados e um modelo de lista.
--  Rode DEPOIS de supabase/migrations/0001_init.sql.
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
    ('Limpeza',    '#a855f7'),
    ('Higiene',    '#ec4899'),
    ('Congelados', '#14b8a6'),
    ('Pet',        '#84cc16'),
    ('Outros',     '#71717a')
  on conflict (name) do nothing;

  ---------------------------------------------------------------------------
  -- Mercados de exemplo (só se não houver nenhum)
  ---------------------------------------------------------------------------
  if not exists (select 1 from public.markets) then
    insert into public.markets (name, color) values
      ('Atacado',      '#3b82f6'),
      ('Supermercado', '#22c55e'),
      ('Feira',        '#f59e0b'),
      ('Farmácia',     '#ec4899');
  end if;

  ---------------------------------------------------------------------------
  -- Modelo padrão "Compra do mês" (só se não houver nenhum modelo)
  ---------------------------------------------------------------------------
  if not exists (select 1 from public.list_templates) then
    insert into public.list_templates (name, is_default)
    values ('Compra do mês', true)
    returning id into v_tpl;

    insert into public.list_template_items (template_id, name, quantity, sort_order, category_id)
    select v_tpl, x.name, x.qty, x.ord,
           (select id from public.categories where name = x.cat)
    from (values
      ('Arroz 5kg',            1, 1,  'Mercearia'),
      ('Feijão',               2, 2,  'Mercearia'),
      ('Óleo de soja',         1, 3,  'Mercearia'),
      ('Açúcar',               1, 4,  'Mercearia'),
      ('Café',                 1, 5,  'Mercearia'),
      ('Sal',                  1, 6,  'Mercearia'),
      ('Macarrão',             3, 7,  'Mercearia'),
      ('Molho de tomate',      3, 8,  'Mercearia'),
      ('Farinha de trigo',     1, 9,  'Mercearia'),
      ('Leite',                6, 10, 'Laticínios'),
      ('Ovos',                 1, 11, 'Laticínios'),
      ('Manteiga',             1, 12, 'Laticínios'),
      ('Queijo',               1, 13, 'Laticínios'),
      ('Presunto',             1, 14, 'Laticínios'),
      ('Iogurte',              4, 15, 'Laticínios'),
      ('Pão de forma',         1, 16, 'Padaria'),
      ('Pão francês',          1, 17, 'Padaria'),
      ('Frango',               1, 18, 'Carnes'),
      ('Carne moída',          1, 19, 'Carnes'),
      ('Linguiça',             1, 20, 'Carnes'),
      ('Banana',               1, 21, 'Hortifrúti'),
      ('Maçã',                 1, 22, 'Hortifrúti'),
      ('Tomate',               1, 23, 'Hortifrúti'),
      ('Cebola',               1, 24, 'Hortifrúti'),
      ('Batata',               1, 25, 'Hortifrúti'),
      ('Alho',                 1, 26, 'Hortifrúti'),
      ('Refrigerante',         2, 27, 'Bebidas'),
      ('Suco',                 3, 28, 'Bebidas'),
      ('Água',                 1, 29, 'Bebidas'),
      ('Detergente',           2, 30, 'Limpeza'),
      ('Sabão em pó',          1, 31, 'Limpeza'),
      ('Amaciante',            1, 32, 'Limpeza'),
      ('Desinfetante',         1, 33, 'Limpeza'),
      ('Papel higiênico',      1, 34, 'Higiene'),
      ('Sabonete',             3, 35, 'Higiene'),
      ('Shampoo',              1, 36, 'Higiene'),
      ('Creme dental',         1, 37, 'Higiene')
    ) as x(name, qty, ord, cat);
  end if;
end $$;
