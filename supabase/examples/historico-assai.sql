-- ============================================================================
--  Histórico de compras (Assaí) — importado dos prints do app SOMA.
--
--  Rode DEPOIS de 0001_init.sql e 0002_categorias_automaticas.sql.
--  É seguro rodar de novo (não duplica: checa a data).
--
--  Cada compra recebe os itens legíveis no print + uma linha
--  "Outros itens (não detalhados)" que fecha exatamente o total do mês.
--  Assim o gráfico de gasto mensal fica 100% certo mesmo com item faltando.
--  Você pode abrir cada compra no app e detalhar/ajustar quando quiser
--  (ou usar a tela "Importar compra").
-- ============================================================================

create or replace function public.seed_example_purchase(
  p_date          date,
  p_market        text,
  p_items         jsonb,
  p_target_total  numeric default null,
  p_balance_label text default 'Outros itens (não detalhados)'
) returns uuid
language plpgsql
as $fn$
declare
  v_market_id   uuid;
  v_purchase_id uuid;
  v_item        jsonb;
  v_sum         numeric := 0;
  v_qty         numeric;
  v_price       numeric;
  v_diff        numeric;
begin
  if p_market is not null and length(btrim(p_market)) > 0 then
    select id into v_market_id from public.markets where lower(name) = lower(p_market) limit 1;
    if v_market_id is null then
      insert into public.markets (name) values (p_market) returning id into v_market_id;
    end if;
  end if;

  insert into public.purchases (market_id, purchase_date, status, note)
  values (v_market_id, p_date, 'concluida', 'Importada do histórico (SOMA)')
  returning id into v_purchase_id;

  for v_item in select * from jsonb_array_elements(p_items)
  loop
    v_qty   := coalesce((v_item->>'q')::numeric, 1);
    v_price := coalesce((v_item->>'p')::numeric, 0);
    insert into public.purchase_items (purchase_id, name, quantity, unit_price, is_weight)
    values (v_purchase_id, v_item->>'n', v_qty, v_price, coalesce((v_item->>'w')::boolean, false));
    v_sum := v_sum + round(v_qty * v_price, 2);
  end loop;

  if p_target_total is not null then
    v_diff := round(p_target_total - v_sum, 2);
    if v_diff >= 0.01 then
      insert into public.purchase_items (purchase_id, name, quantity, unit_price, category_id)
      values (v_purchase_id, p_balance_label, 1, v_diff,
              (select id from public.categories where name = 'Outros' limit 1));
    end if;
  end if;

  return v_purchase_id;
end;
$fn$;

-- 2026-07-31 — total 627.83 | itens transcritos 627.83 | balanço 0.00
select public.seed_example_purchase(
  date '2026-07-31', 'Assaí',
  $items$[
    {"n":"refri","q":6,"p":3.99},
    {"n":"suco uva","q":1,"p":12.35},
    {"n":"refri","q":2,"p":3.7},
    {"n":"refri","q":1,"p":6},
    {"n":"cenoura","q":1,"p":3.49},
    {"n":"papel alumínio","q":1,"p":4.99},
    {"n":"saco de lixo","q":1,"p":10.9},
    {"n":"vasilha para suco","q":1,"p":13.9},
    {"n":"papel higiênico","q":1,"p":29.9},
    {"n":"lava-autos","q":1,"p":12.49},
    {"n":"panos de prato","q":3,"p":8},
    {"n":"cheiro banheiro","q":2,"p":7.2},
    {"n":"cif milagroso","q":1,"p":14.39},
    {"n":"álcool","q":3,"p":4.99},
    {"n":"abs","q":1,"p":19.9},
    {"n":"lava-roupas em gel","q":1,"p":16.39},
    {"n":"feijão preto","q":1,"p":5.89},
    {"n":"tapioca","q":2,"p":3.99},
    {"n":"milho","q":9,"p":1.99},
    {"n":"molho barbecue","q":1,"p":10.19},
    {"n":"ketchup","q":1,"p":7.49},
    {"n":"tempero baiano","q":2,"p":3.59},
    {"n":"curry em pó","q":1,"p":2.05},
    {"n":"maionese","q":1,"p":14.9},
    {"n":"macarrão","q":4,"p":2.2},
    {"n":"molho de tomate","q":1,"p":18.19},
    {"n":"massa de chocolate","q":3,"p":7.99},
    {"n":"leite em pó","q":1,"p":15.59},
    {"n":"café filtro","q":1,"p":3.59},
    {"n":"coco ralado","q":2,"p":6},
    {"n":"creme de leite","q":8,"p":2.35},
    {"n":"chocolate","q":1,"p":11.99},
    {"n":"caixa de bombom","q":1,"p":11.49},
    {"n":"torrone","q":2,"p":3.29},
    {"n":"trakinas","q":1,"p":1.99},
    {"n":"bala de goma","q":1,"p":21.9},
    {"n":"manteiga","q":1,"p":13.2},
    {"n":"requeijão","q":3,"p":5.99},
    {"n":"hambúrguer","q":6,"p":4.99},
    {"n":"fraldinha","q":1,"p":49.8},
    {"n":"queijo coalho","q":1,"p":19.9},
    {"n":"bacon","q":1,"p":16.01},
    {"n":"linguiça","q":2,"p":11.56}
  ]$items$::jsonb,
  627.83
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2026-07-31' and note = 'Importada do histórico (SOMA)'
);

-- 2026-06-30 — total 946.16 | itens transcritos 946.16 | balanço 0.00
select public.seed_example_purchase(
  date '2026-06-30', 'Assaí',
  $items$[
    {"n":"margarina","q":1,"p":15.1},
    {"n":"quatá","q":3,"p":6.39},
    {"n":"hambúrguer","q":2,"p":7.49},
    {"n":"sassami","q":3,"p":17.49},
    {"n":"coxa de frango","q":2,"p":15},
    {"n":"hambúrguer","q":1,"p":17.5},
    {"n":"linguiça toscana","q":3,"p":10},
    {"n":"linguiça","q":1,"p":15.55},
    {"n":"bacon","q":1,"p":12.95},
    {"n":"mussarela","q":1,"p":21.34},
    {"n":"pão","q":2,"p":4.7},
    {"n":"lombo","q":1,"p":10.5},
    {"n":"coco ralado","q":1,"p":5.09},
    {"n":"leite em pó","q":1,"p":15.6},
    {"n":"nescal","q":1,"p":18.9},
    {"n":"bolo","q":1,"p":9},
    {"n":"chocolate","q":1,"p":12.99},
    {"n":"óleo","q":1,"p":6.45},
    {"n":"macarrão","q":1,"p":4.45},
    {"n":"leite","q":7,"p":5.59},
    {"n":"iogurte","q":1,"p":11.9},
    {"n":"iogurte","q":1,"p":12.25},
    {"n":"pipoca","q":2,"p":3.85},
    {"n":"caldo knorr","q":2,"p":5.65},
    {"n":"ketchup","q":1,"p":6.9},
    {"n":"milho","q":8,"p":2.29},
    {"n":"vinagre","q":1,"p":2.05},
    {"n":"queijo ralado","q":3,"p":5.89},
    {"n":"molho de tomate","q":3,"p":1.89},
    {"n":"molho de tomate","q":2,"p":18.9},
    {"n":"macarrão","q":1,"p":3.7},
    {"n":"azeite","q":1,"p":30},
    {"n":"leite condensado","q":3,"p":5.79},
    {"n":"creme de leite","q":6,"p":2.29},
    {"n":"veja antibac","q":2,"p":3.89},
    {"n":"limpa uau cloro","q":1,"p":12.79},
    {"n":"sanol","q":1,"p":12.9},
    {"n":"abs","q":1,"p":12.29},
    {"n":"lava-roupas em gel","q":1,"p":16.39},
    {"n":"sabão líquido","q":1,"p":7.39},
    {"n":"cotonete","q":2,"p":2.19},
    {"n":"arroz","q":1,"p":18.89},
    {"n":"farinha","q":1,"p":2.89},
    {"n":"tapioca","q":1,"p":5.49},
    {"n":"farinha de rosca","q":1,"p":4.4},
    {"n":"açúcar","q":1,"p":11.9},
    {"n":"refrigerante","q":1,"p":29.94},
    {"n":"batata palha","q":3,"p":4.99},
    {"n":"papel toalha","q":2,"p":2.99},
    {"n":"saco de lixo","q":1,"p":33.9},
    {"n":"saco de lixo","q":1,"p":14.9},
    {"n":"pano multiuso","q":1,"p":84.9},
    {"n":"papel higiênico","q":1,"p":18.9},
    {"n":"álcool","q":4,"p":7.99},
    {"n":"removedor","q":1,"p":5.45},
    {"n":"amaciante","q":1,"p":14.35},
    {"n":"veja","q":1,"p":7.29},
    {"n":"limpa cif","q":1,"p":9.19}
  ]$items$::jsonb,
  946.16
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2026-06-30' and note = 'Importada do histórico (SOMA)'
);

-- 2026-05-29 — total 851.80 | itens transcritos 845.80 | balanço 6.00
select public.seed_example_purchase(
  date '2026-05-29', 'Assaí',
  $items$[
    {"n":"manteiga","q":1,"p":6.39},
    {"n":"quatá","q":3,"p":6.39},
    {"n":"linguiça","q":2,"p":16.3},
    {"n":"coxa","q":2,"p":15.79},
    {"n":"filé de frango","q":2,"p":18},
    {"n":"asa","q":1,"p":15},
    {"n":"bisnaguinha","q":1,"p":4.99},
    {"n":"pão de forma","q":1,"p":5},
    {"n":"linguiça","q":1,"p":14.88},
    {"n":"massa pão de queijo","q":1,"p":9.89},
    {"n":"leite condensado","q":20,"p":5},
    {"n":"coco ralado","q":1,"p":4.4},
    {"n":"leite condensado","q":6,"p":4.95},
    {"n":"café","q":1,"p":25.89},
    {"n":"café de pano","q":1,"p":4.15},
    {"n":"chocolate","q":1,"p":11.9},
    {"n":"chiclete","q":1,"p":6},
    {"n":"trakinas","q":1,"p":6},
    {"n":"leite","q":8,"p":5.45},
    {"n":"danone","q":2,"p":8.75},
    {"n":"leite fermentado","q":2,"p":9.59},
    {"n":"sazón","q":3,"p":5.59},
    {"n":"caldo knor","q":2,"p":5.65},
    {"n":"macarrão","q":1,"p":2.59},
    {"n":"óleo","q":4,"p":6.59},
    {"n":"macarrão","q":1,"p":3.29},
    {"n":"molho de tomate","q":2,"p":12.49},
    {"n":"molho de tomate","q":1,"p":2.99},
    {"n":"molho de tomate","q":2,"p":1.79},
    {"n":"queijo ralado","q":1,"p":3.75},
    {"n":"choco em pó","q":1,"p":11.4},
    {"n":"fermento","q":1,"p":4.19},
    {"n":"fermento","q":1,"p":3.19},
    {"n":"abs","q":1,"p":11.9},
    {"n":"abs","q":1,"p":20},
    {"n":"arroz","q":1,"p":17.49},
    {"n":"trigo","q":2,"p":4.49},
    {"n":"fubá","q":1,"p":3.29},
    {"n":"farinha de rosca","q":1,"p":4.15},
    {"n":"açúcar","q":1,"p":12.89},
    {"n":"azulim","q":1,"p":3.89},
    {"n":"cheirinho","q":1,"p":9.9},
    {"n":"koala","q":1,"p":10.89},
    {"n":"milho","q":6,"p":2.99},
    {"n":"mostarda","q":1,"p":6.9},
    {"n":"suco","q":3,"p":3.99},
    {"n":"batata palha","q":3,"p":4.79},
    {"n":"papel toalha","q":1,"p":2.85},
    {"n":"suco saquinho","q":4,"p":0.8},
    {"n":"papel higiênico","q":1,"p":18.9},
    {"n":"álcool","q":2,"p":6.99},
    {"n":"esponja","q":1,"p":5.29},
    {"n":"cif milagroso","q":1,"p":6.79},
    {"n":"amaciante","q":1,"p":7.99},
    {"n":"desodorante","q":2,"p":24.69},
    {"n":"pasta de dente","q":1,"p":5.45},
    {"n":"shampoo","q":1,"p":19.2}
  ]$items$::jsonb,
  851.8
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2026-05-29' and note = 'Importada do histórico (SOMA)'
);

-- 2026-05-02 — total 646.56 | itens transcritos 646.56 | balanço 0.00
select public.seed_example_purchase(
  date '2026-05-02', 'Assaí',
  $items$[
    {"n":"iogurte","q":1,"p":9.39},
    {"n":"iogurte grego","q":6,"p":2.15},
    {"n":"hambúrguer","q":4,"p":6.79},
    {"n":"peito de frango","q":2,"p":19.5},
    {"n":"asa de frango","q":1,"p":18.9},
    {"n":"coxa de frango","q":1,"p":15.29},
    {"n":"steak","q":1,"p":7},
    {"n":"linguiça","q":1,"p":22.9},
    {"n":"leite fermentado","q":2,"p":9.59},
    {"n":"margarina","q":1,"p":6.59},
    {"n":"requeijão","q":3,"p":5.99},
    {"n":"hambúrguer","q":1,"p":14.99},
    {"n":"creme de leite","q":4,"p":2.19},
    {"n":"leite condensado","q":2,"p":4.99},
    {"n":"chocolate","q":1,"p":5.99},
    {"n":"torrada","q":2,"p":4.49},
    {"n":"caixa de bombom","q":1,"p":13.39},
    {"n":"leite","q":6,"p":5.99},
    {"n":"desodorante","q":1,"p":24.69},
    {"n":"ob","q":1,"p":9.9},
    {"n":"arroz","q":1,"p":16.49},
    {"n":"farofa","q":1,"p":7.6},
    {"n":"sazón","q":3,"p":5.45},
    {"n":"milho","q":6,"p":2.99},
    {"n":"maionese","q":1,"p":7.95},
    {"n":"óleo","q":3,"p":7.39},
    {"n":"molho de tomate","q":2,"p":4.2},
    {"n":"molho de tomate vidro","q":2,"p":12.65},
    {"n":"queijo ralado","q":3,"p":3.8},
    {"n":"café","q":1,"p":24.9},
    {"n":"refri","q":2,"p":3.99},
    {"n":"batata palha","q":2,"p":5.55},
    {"n":"suco uva","q":3,"p":4.29},
    {"n":"saco plástico","q":1,"p":6.19},
    {"n":"cif milagroso","q":1,"p":9.09},
    {"n":"veja antibac","q":1,"p":7.59},
    {"n":"ypê","q":1,"p":27.9},
    {"n":"sabão em pó","q":1,"p":34.89},
    {"n":"amaciante","q":1,"p":7.69},
    {"n":"sabonete","q":3,"p":3.19},
    {"n":"colgate","q":2,"p":9.15},
    {"n":"sabonete líquido","q":1,"p":5.99}
  ]$items$::jsonb,
  646.56
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2026-05-02' and note = 'Importada do histórico (SOMA)'
);

-- 2026-03-31 — total 707.71 | itens transcritos 707.71 | balanço 0.00
select public.seed_example_purchase(
  date '2026-03-31', 'Assaí',
  $items$[
    {"n":"requeijão","q":3,"p":6.7},
    {"n":"linguiça","q":1,"p":16},
    {"n":"hambúrguer","q":3,"p":6.79},
    {"n":"pão","q":1,"p":5},
    {"n":"hambúrguer","q":1,"p":17},
    {"n":"filé de peito","q":3,"p":18.8},
    {"n":"linguiça","q":1,"p":25},
    {"n":"bacon","q":1,"p":10},
    {"n":"refri","q":2,"p":6.3},
    {"n":"alface","q":1,"p":6},
    {"n":"presunto","q":1,"p":6},
    {"n":"mussarela","q":1,"p":11.5},
    {"n":"molho de tomate premium vidro","q":1,"p":18.2},
    {"n":"miojo","q":3,"p":1},
    {"n":"queijo ralado","q":1,"p":9},
    {"n":"chocolate quente","q":1,"p":18.7},
    {"n":"barra de cereal","q":1,"p":15.65},
    {"n":"caixa de bombom","q":3,"p":10},
    {"n":"leite","q":4,"p":6.19},
    {"n":"danone","q":2,"p":11.89},
    {"n":"danone","q":3,"p":2.45},
    {"n":"frutab","q":1,"p":9.9},
    {"n":"manteiga","q":1,"p":14},
    {"n":"abs","q":1,"p":25},
    {"n":"shampoo","q":1,"p":19.2},
    {"n":"pipoca","q":1,"p":7},
    {"n":"arroz","q":1,"p":14.49},
    {"n":"abs","q":1,"p":9.9},
    {"n":"feijão preto","q":1,"p":4.15},
    {"n":"milho","q":8,"p":2.49},
    {"n":"ketchup","q":1,"p":6.9},
    {"n":"caldo knor galinha","q":1,"p":5.15},
    {"n":"azeite","q":1,"p":29.9},
    {"n":"macarrão","q":2,"p":2.9},
    {"n":"molho de tomate","q":2,"p":2.85},
    {"n":"batata palha","q":3,"p":4.89},
    {"n":"suco","q":3,"p":4.09},
    {"n":"amendoim","q":1,"p":25.99},
    {"n":"saco plástico","q":1,"p":5.99},
    {"n":"papel toalha","q":1,"p":3.65},
    {"n":"pote","q":2,"p":3.5},
    {"n":"pano multiuso","q":1,"p":25},
    {"n":"coala","q":3,"p":10.25},
    {"n":"luva","q":1,"p":24.89},
    {"n":"cif","q":1,"p":7},
    {"n":"sabão líquido","q":2,"p":7.39},
    {"n":"sabonete","q":1,"p":2.3}
  ]$items$::jsonb,
  707.71
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2026-03-31' and note = 'Importada do histórico (SOMA)'
);

-- 2026-02-27 — total 717.01 | itens transcritos 717.01 | balanço 0.00
select public.seed_example_purchase(
  date '2026-02-27', 'Assaí',
  $items$[
    {"n":"iogurte","q":1,"p":8.9},
    {"n":"leite fermentado","q":1,"p":6.59},
    {"n":"margarina","q":1,"p":10},
    {"n":"quatá","q":3,"p":6.5},
    {"n":"hambúrguer","q":4,"p":4.49},
    {"n":"linguiça","q":2,"p":15.9},
    {"n":"carne","q":1,"p":15.48},
    {"n":"costela","q":1,"p":75.73},
    {"n":"filé de peito","q":3,"p":18.5},
    {"n":"rap 10","q":1,"p":6.15},
    {"n":"linguiça","q":1,"p":13.83},
    {"n":"bacon","q":1,"p":14.62},
    {"n":"iogurte","q":1,"p":12},
    {"n":"molho de tomate especial","q":2,"p":2.85},
    {"n":"óleo","q":2,"p":6.99},
    {"n":"macarrão","q":1,"p":3.65},
    {"n":"molho de tomate","q":2,"p":5.2},
    {"n":"leite em pó","q":1,"p":14.29},
    {"n":"creme de leite","q":1,"p":14.4},
    {"n":"leite condensado","q":2,"p":5.5},
    {"n":"creme de leite","q":1,"p":7.75},
    {"n":"bicarbonato de sódio","q":1,"p":5.89},
    {"n":"caixa de bombom","q":2,"p":12},
    {"n":"leite","q":8,"p":4.49},
    {"n":"iogurte","q":1,"p":7.79},
    {"n":"bucha","q":1,"p":9.79},
    {"n":"saboroso","q":1,"p":13.99},
    {"n":"feijão","q":3,"p":8.19},
    {"n":"açúcar","q":1,"p":14.39},
    {"n":"feijão","q":1,"p":6.09},
    {"n":"farofa","q":1,"p":7.5},
    {"n":"milho","q":9,"p":1.99},
    {"n":"ketchup","q":1,"p":6.39},
    {"n":"caldo knor","q":1,"p":5.35},
    {"n":"maionese","q":1,"p":12.39},
    {"n":"queijo ralado","q":1,"p":8.29},
    {"n":"molho de tomate","q":4,"p":1.79},
    {"n":"sukita","q":2,"p":5.79},
    {"n":"doritos","q":1,"p":16.4},
    {"n":"suco goiaba","q":2,"p":3.99},
    {"n":"suco uva","q":1,"p":4.35},
    {"n":"batata palha","q":3,"p":2.29},
    {"n":"papel toalha","q":2,"p":3.29},
    {"n":"papel higiênico","q":1,"p":21.9},
    {"n":"lava-carro","q":1,"p":12.9},
    {"n":"cif","q":1,"p":6.4},
    {"n":"cif","q":1,"p":7.55},
    {"n":"sabão em pó","q":1,"p":20.85},
    {"n":"amaciante","q":1,"p":17}
  ]$items$::jsonb,
  717.01
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2026-02-27' and note = 'Importada do histórico (SOMA)'
);

-- 2026-01-31 — total 710.49 | itens transcritos 710.49 | balanço 0.00
select public.seed_example_purchase(
  date '2026-01-31', 'Assaí',
  $items$[
    {"n":"frutab","q":1,"p":9},
    {"n":"manteiga","q":1,"p":6},
    {"n":"requeijão","q":3,"p":6.2},
    {"n":"hambúrguer","q":6,"p":6.79},
    {"n":"linguiça toscana","q":1,"p":15.9},
    {"n":"filé de frango","q":3,"p":18.9},
    {"n":"batata frita","q":1,"p":22},
    {"n":"pão","q":2,"p":7},
    {"n":"linguiça","q":1,"p":14},
    {"n":"bacon","q":1,"p":11},
    {"n":"bacon","q":1,"p":7.74},
    {"n":"leite","q":8,"p":4.55},
    {"n":"macarrão","q":1,"p":3.5},
    {"n":"leite condensado","q":3,"p":5.79},
    {"n":"creme de leite","q":6,"p":2.39},
    {"n":"massa de bolo","q":1,"p":8.25},
    {"n":"massa de bolo","q":1,"p":4.09},
    {"n":"tetatop","q":1,"p":8.99},
    {"n":"caixa de bombom","q":2,"p":11},
    {"n":"bala","q":1,"p":14.35},
    {"n":"danone","q":2,"p":7.99},
    {"n":"danone","q":1,"p":8.99},
    {"n":"danone","q":1,"p":18.9},
    {"n":"urca","q":1,"p":5.5},
    {"n":"coala","q":3,"p":10.9},
    {"n":"essência","q":1,"p":8.9},
    {"n":"abs","q":1,"p":22.69},
    {"n":"pasta de dente","q":1,"p":9.1},
    {"n":"sabonete líquido","q":5,"p":5.99},
    {"n":"hidratante","q":1,"p":10.9},
    {"n":"spray","q":2,"p":11.9},
    {"n":"sabonete","q":3,"p":3.19},
    {"n":"açúcar","q":2,"p":2.99},
    {"n":"milho","q":8,"p":2.99},
    {"n":"sal de carne","q":1,"p":12.4},
    {"n":"suco","q":4,"p":4.55},
    {"n":"batata palha","q":3,"p":3.89},
    {"n":"espeto de carne","q":1,"p":4.15},
    {"n":"peneira","q":1,"p":7.19},
    {"n":"saco de lixo","q":1,"p":10.9},
    {"n":"prendedor","q":1,"p":1.99},
    {"n":"pano multiuso","q":1,"p":21},
    {"n":"papel higiênico","q":1,"p":18.9},
    {"n":"álcool","q":1,"p":6.19},
    {"n":"veja","q":1,"p":7.2},
    {"n":"veja verde","q":2,"p":5.65},
    {"n":"cif","q":1,"p":7.55}
  ]$items$::jsonb,
  710.49
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2026-01-31' and note = 'Importada do histórico (SOMA)'
);

-- 2025-12-30 — total 617.54 | itens transcritos 0.00 | balanço 617.54
select public.seed_example_purchase(
  date '2025-12-30', 'Assaí',
  $items$[
    
  ]$items$::jsonb,
  617.54
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2025-12-30' and note = 'Importada do histórico (SOMA)'
);

-- 2025-11-29 — total 810.50 | itens transcritos 0.00 | balanço 810.50
select public.seed_example_purchase(
  date '2025-11-29', 'Assaí',
  $items$[
    
  ]$items$::jsonb,
  810.5
)
where not exists (
  select 1 from public.purchases
  where purchase_date = date '2025-11-29' and note = 'Importada do histórico (SOMA)'
);

-- Limpa o helper (opcional): descomente se não for rodar de novo.
-- drop function if exists public.seed_example_purchase(date, text, jsonb, numeric, text);
