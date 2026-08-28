-- ============================================================================
--  Categorização automática de produtos
-- ----------------------------------------------------------------------------
--  Rode este arquivo DEPOIS de 0001_init.sql.
--
--  A partir daqui, qualquer item inserido sem categoria (category_id nulo)
--  recebe uma categoria automaticamente, a partir de palavras no nome.
--  Isso vale para itens de compras, de listas e de modelos — inclusive os
--  criados pelo app e os importados por SQL.
--
--  O usuário sempre pode escolher a categoria na mão (aí a automática não
--  mexe) ou deixar em "Automático" (aí ela é recalculada a cada gravação).
-- ============================================================================

-- ----------------------------------------------------------------------------
--  Garante as categorias padrão (idempotente)
-- ----------------------------------------------------------------------------
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

-- ----------------------------------------------------------------------------
--  guess_category(nome) -> nome da categoria (ou NULL)
--  Regras em ordem: a primeira que casar vence.
-- ----------------------------------------------------------------------------
create or replace function public.guess_category(p_name text)
returns text
language sql
immutable
as $$
  with s as (
    select translate(lower(coalesce(p_name, '')),
                      'áàâãéêíóôõúüç', 'aaaaeeiooouuc') as n
  )
  select case
    -- desambiguações específicas
    when n ~ '(cafe filtro|cafe pano|cafe de pano|cafe coador|filtro de cafe|coador de cafe)' then 'Outros'
    when n ~ '(molho de tomate|molho tomate|extrato de tomate|polpa de tomate|farinha de rosca|farofa|batata palha|batata chips|batata frita)' then 'Mercearia'
    when n ~ '(creme de leite|leite condensado|leite em po|leite de coco|leite fermentado)' then 'Laticínios'
    when n ~ '(cheiro verde)' then 'Hortifrúti'
    when n ~ '(papel higienico|papel higenico)' then 'Higiene'
    -- Doces
    when n ~ '(chocolate|\ybombom\y|caixa bombom|\ybala\y|bala de goma|pirulito|chiclete|pacoca|paçoquita|doce de leite|brigadeiro|nutella|torrone|torrene|trakinas|traquinas|\ywafer\y|jujuba|marshmallow|cocada|\yhalls\y|mentos|kitkat|chocotone|barra de cereal|barra cereal|massa choco|massa de chocolate|massa bolo|bolo massa|\ycobertura\y|confeito|\yfrutab\y|goiabada)' then 'Doces'
    -- Higiene
    when n ~ '(shampoo|xampu|condicionador|creme dental|pasta de dente|escova de dente|fio dental|absorvente|\yabs\y|\yob\y|fralda|lenco umedecido|desodorante|antitranspirante|cotonete|haste flexivel|protetor solar|barbeador|lamina de barbear|gilette|congate|colgate|enxaguante bucal|listerine|\ytalco\y|hidratante|hidrante|\yalgodao\y|sabonete|\ybucha\y)' then 'Higiene'
    -- Limpeza
    when n ~ '(detergente|amaciante|agua sanitaria|\ycandida\y|\ycloro\y|desinfetante|\yveja\y|veja verde|multiuso|multi uso|limpa vidro|limpador|\ylimp\y|\yalcool\y|esponja|bombril|palha de aco|saco de lixo|saco para lixo|saco lixo|papel toalha|lustra moveis|cera liquida|removedor|odorizador|\ypinho\y|\ycif\y|vanish|tira manchas|alvejante|pano de chao|pano de prato|panos de prato|pano multiuso|\yrodo\y|vassoura|lava roupa|lava louca|lava auto|lava carro|\ysabao\y|cheirinho|cheiro banheiro|essencia|aromatizante|desengordurante|\ygel\y|azulim|\ysanol\y|\ycoala\y|\ykoala\y|prendedor|\yype\y)' then 'Limpeza'
    -- Carnes
    when n ~ '(\ycarne\y|carne moida|\ybife\y|\ysteak\y|file mignon|\yfrango\y|peito de frango|peito frango|file de peito|filé de peito|\ycoxa\y|sobrecoxa|\yasa\y|linguica|calabresa|salsicha|presunto|\ybacon\y|costela|alcatra|patinho|\yacem\y|coxao|picanha|\ymoida\y|pernil|tilapia|salmao|camarao|\ypeixe\y|hamburguer|almondega|mortadela|\ysalame\y|\ycupim\y|maminha|fraldinha|\ylombo\y|\ysassami\y|espeto carne|carne para panela)' then 'Carnes'
    -- Laticínios
    when n ~ '(\yleite\y|iogurte|\ydanone\y|requeijao|requeijo|\yqueijo\y|queijo ralado|queijo coalh|mussarela|mucarela|muarela|parmesao|\ymanteiga\y|margarina|\yquata\y|\ynata\y|ricota|coalhada|cream cheese|polenguinho|catupiry|tetatop|tetra top)' then 'Laticínios'
    -- Padaria
    when n ~ '(\ypao\y|pao de forma|pao frances|pao de queijo|baguete|bisnaga|bisnaguinha|croissant|\ybolo\y|torrada|panetone|rosca doce)' then 'Padaria'
    -- Bebidas
    when n ~ '(refrigerante|\yrefri\y|coca cola|guarana|\yfanta\y|sprite|\ysukita\y|\ysuco\y|agua mineral|agua com gas|agua sem gas|cerveja|\yvinho\y|energetico|\ycha\y|nescau|\ynescal\y|achocolatado|choco em po|chocolate quente|\ytoddy\y|isotonico|gatorade|agua de coco)' then 'Bebidas'
    -- Congelados
    when n ~ '(congelad|nuggets|empanado|\ysorvete\y|\yacai\y|polpa de fruta|pizza congelada|lasanha congelada)' then 'Congelados'
    -- Pet
    when n ~ '(\yracao\y|sache pet|petisco.*(cachorro|gato)|areia.*gato|granulado higienico|tapete higienico)' then 'Pet'
    -- Mercearia
    when n ~ '(\yarroz\y|feijao|lentilha|grao de bico|\yervilha\y|\ymilho\y|seleta|\yoleo\y|azeite|acucar|adocante|\ysal\y|sal carne|\ycafe\y|macarrao|miojo|\ymassa\y|espaguete|nhoque|farinha|\yfuba\y|amido|fermento|\ysazon\y|\yknor\y|knorr|\ycaldo\y|\ytempero\y|colorau|oregano|\ycanela\y|vinagre|maionese|ketchup|catchup|mostarda|shoyu|molho ingles|molho barbecue|barbecue|\ymolho\y|\ybiscoito\y|\ybolacha\y|salgadinho|doritos|amendoim|castanha|granola|aveia|\ycereal\y|sucrilhos|\ymel\y|geleia|gelatina|\ypudim\y|\ypipoca\y|azeitona|palmito|coco ralado|\ycoco\y|\ytrigo\y|quinoa|\ychia\y|linhaca|\ytapioca\y|curry|churry|bicarbonato)' then 'Mercearia'
    -- Hortifrúti
    when n ~ '(\ybanana\y|\ymaca\y|laranja|mamao|melancia|\ymelao\y|abacaxi|\yuva\y|\ymanga\y|morango|abacate|\ykiwi\y|\ypera\y|\ylimao\y|\ytomate\y|\ycebola\y|\yalho\y|\ybatata\y|batata doce|cenoura|alface|\ycouve\y|brocolis|couve flor|abobrinha|pimentao|pepino|mandioca|\yaipim\y|abobora|chuchu|quiabo|\yvagem\y|beterraba|rucula|espinafre|salsinha|coentro|gengibre|verdura|legume|\yfruta\y|repolho|inhame)' then 'Hortifrúti'
    -- Outros
    when n ~ '(pilha|bateria|lampada|\yvela\y|fosforo|isqueiro|papel aluminio|\yaluminio\y|papel filme|plastico filme|saco plastico|\ysaco\y|copo descartavel|prato descartavel|guardanapo|\ypalito\y|carvao|\yvasilha\y|\ypote\y|\ypotes\y|tupperware|peneira|\yluva\y)' then 'Outros'
    else null
  end
  from s;
$$;

-- ----------------------------------------------------------------------------
--  Trigger: preenche category_id quando vier nulo
-- ----------------------------------------------------------------------------
create or replace function public.apply_auto_category()
returns trigger
language plpgsql
as $$
declare
  v_name text;
begin
  if new.category_id is null then
    v_name := public.guess_category(new.name);
    if v_name is not null then
      select id into new.category_id
      from public.categories where name = v_name limit 1;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_auto_cat_purchase_items on public.purchase_items;
create trigger trg_auto_cat_purchase_items
  before insert or update of name, category_id on public.purchase_items
  for each row execute function public.apply_auto_category();

drop trigger if exists trg_auto_cat_list_items on public.shopping_list_items;
create trigger trg_auto_cat_list_items
  before insert or update of name, category_id on public.shopping_list_items
  for each row execute function public.apply_auto_category();

drop trigger if exists trg_auto_cat_template_items on public.list_template_items;
create trigger trg_auto_cat_template_items
  before insert or update of name, category_id on public.list_template_items
  for each row execute function public.apply_auto_category();

-- ----------------------------------------------------------------------------
--  (Opcional) Recategoriza itens já existentes que estão sem categoria
-- ----------------------------------------------------------------------------
update public.purchase_items pi
set category_id = c.id
from public.categories c
where pi.category_id is null
  and c.name = public.guess_category(pi.name);

update public.shopping_list_items si
set category_id = c.id
from public.categories c
where si.category_id is null
  and c.name = public.guess_category(si.name);

update public.list_template_items ti
set category_id = c.id
from public.categories c
where ti.category_id is null
  and c.name = public.guess_category(ti.name);
