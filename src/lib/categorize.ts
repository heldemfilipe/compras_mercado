/**
 * Adivinha a categoria de um produto a partir do nome (offline, sem IA).
 * Retorna o nome canônico da categoria (igual ao usado em supabase/seed.sql)
 * ou null quando não há palpite confiável.
 *
 * A ordem importa: regras mais específicas primeiro
 * (ex.: "molho de tomate" antes de "tomate").
 */
export type CanonicalCategory =
  | "Hortifrúti"
  | "Carnes"
  | "Laticínios"
  | "Padaria"
  | "Mercearia"
  | "Bebidas"
  | "Doces"
  | "Limpeza"
  | "Higiene"
  | "Congelados"
  | "Pet"
  | "Outros";

export const CANONICAL_CATEGORIES: CanonicalCategory[] = [
  "Hortifrúti",
  "Carnes",
  "Laticínios",
  "Padaria",
  "Mercearia",
  "Bebidas",
  "Doces",
  "Limpeza",
  "Higiene",
  "Congelados",
  "Pet",
  "Outros",
];

function normalize(s: string): string {
  return s
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** [palavras-chave, categoria] — primeira que casar vence. */
const RULES: [string[], CanonicalCategory][] = [
  // --- desambiguações específicas (vêm antes das genéricas) ---
  [["molho de tomate", "extrato de tomate", "polpa de tomate"], "Mercearia"],
  [["farinha de rosca", "farofa"], "Mercearia"],
  [["batata palha", "batata chips"], "Mercearia"],
  [["creme de leite", "leite condensado", "leite de coco", "leite em po"], "Laticínios"],
  [["papel higienico", "papel higenico"], "Higiene"],
  [["sabonete"], "Higiene"],
  [["lava roupas", "lava loucas", "sabao em po", "sabao liquido", "sabao de coco", "sabao"], "Limpeza"],
  [["atum", "sardinha em lata", "sardinha lata"], "Mercearia"],
  [["cheiro verde", "cheiro de coentro"], "Hortifrúti"],
  [["leite fermentado", "leite de rosca"], "Laticínios"],

  // --- Doces / guloseimas ---
  [
    [
      "chocolate", "bombom", "bala", "bala de goma", "goma de mascar",
      "pirulito", "chiclete", "pacoca", "doce de leite", "brigadeiro",
      "nutella", "torrone", "torrene", "trakinas", "traquinas", "wafer",
      "bolacha recheada", "biscoito recheado", "jujuba", "marshmallow",
      "cocada", "pe de moleque", "halls", "mentos", "kitkat", "chocotone",
      "ovo de pascoa", "barra de cereal", "barra cereal", "paçoquita",
      "confeito", "cobertura", "granulado colorido",
      "massa choco", "massa de chocolate", "massa bolo", "bolo massa",
    ],
    "Doces",
  ],

  // --- Higiene ---
  [
    [
      "shampoo", "xampu", "condicionador", "creme dental", "pasta de dente",
      "escova de dente", "fio dental", "absorvente", "fralda", "lenco umedecido",
      "desodorante", "antitranspirante", "cotonete", "haste flexivel",
      "protetor solar", "barbeador", "lamina de barbear", "gilette",
      "enxaguante bucal", "listerine", "talco", "hidratante", "algodao",
      "papel toalha rosto",
    ],
    "Higiene",
  ],

  // --- Limpeza ---
  [
    [
      "detergente", "amaciante", "agua sanitaria", "candida", "cloro",
      "desinfetante", "veja", "multiuso", "limpa vidro", "limpador", "alcool",
      "esponja", "bombril", "palha de aco", "saco de lixo", "saco para lixo",
      "papel toalha", "lustra moveis", "cera liquida", "odorizador", "pinho",
      "cif", "vanish", "tira manchas", "alvejante", "guardanapo", "pano de chao",
      "rodo", "vassoura", "agua sanitaria",
    ],
    "Limpeza",
  ],

  // --- Carnes ---
  [
    [
      "carne", "bife", "file mignon", "filezinho", "frango", "peito", "coxa",
      "sobrecoxa", "asa de frango", "linguica", "calabresa", "salsicha",
      "presunto", "bacon", "costela", "alcatra", "patinho", "acem", "coxao",
      "picanha", "moida", "pernil", "tilapia", "salmao", "camarao", "peixe",
      "hamburguer", "almondega", "mortadela", "salame", "cupim", "maminha",
      "fraldinha", "panela",
    ],
    "Carnes",
  ],

  // --- Laticínios ---
  [
    [
      "leite", "iogurte", "danone", "requeijao", "queijo", "mussarela",
      "mucarela", "muarela", "parmesao", "manteiga", "margarina", "nata",
      "ricota", "coalhada", "cream cheese", "polenguinho", "catupiry",
    ],
    "Laticínios",
  ],

  // --- Padaria ---
  [
    ["pao", "baguete", "bisnaga", "bisnaguinha", "croissant", "bolo", "torrada", "sonho", "rosca doce", "panetone"],
    "Padaria",
  ],

  // --- Bebidas ---
  [
    [
      "refrigerante", "refri", "coca cola", "guarana", "fanta", "sprite",
      "sukita", "suco", "agua mineral", "agua com gas", "agua sem gas",
      "cerveja", "vinho", "energetico", "cha ", "nescau", "nescal",
      "achocolatado", "choco em po", "chocolate quente", "toddy",
      "isotonico", "gatorade", "agua de coco", "cafe soluvel", "capuccino",
    ],
    "Bebidas",
  ],

  // --- Congelados ---
  [
    ["congelad", "nuggets", "empanado", "sorvete", "acai", "polpa de fruta", "pizza congelada", "lasanha congelada", "hamburguer congelado"],
    "Congelados",
  ],

  // --- Pet ---
  [
    ["racao", "sache pet", "petisco para cachorro", "petisco para gato", "areia para gato", "granulado higienico", "tapete higienico", "osso para cachorro"],
    "Pet",
  ],

  // --- Mercearia (grãos, enlatados, temperos, massas, doces de despensa) ---
  [
    [
      "arroz", "feijao", "lentilha", "grao de bico", "ervilha", "milho",
      "seleta", "oleo", "azeite", "acucar", "adocante", "sal ", "cafe",
      "macarrao", "massa", "espaguete", "nhoque", "farinha", "fuba", "amido",
      "fermento", "sazon", "caldo knorr", "caldo de", "tempero", "colorau",
      "oregano", "canela", "vinagre", "maionese", "ketchup", "catchup",
      "mostarda", "shoyu", "molho ingles", "molho shoyu", "biscoito",
      "bolacha", "salgadinho", "amendoim", "castanha", "granola", "aveia",
      "cereal", "sucrilhos", "mel", "geleia", "doce de leite", "gelatina",
      "pudim", "pipoca", "azeitona", "palmito", "coco ralado", "leite de coco",
      "goiabada", "achocolatado em po", "cacau", "chocolate em po", "trigo",
      "poha", "quinoa", "chia", "linhaca", "pao de forma",
    ],
    "Mercearia",
  ],

  // --- Hortifrúti ---
  [
    [
      "banana", "maca", "maça", "laranja", "mamao", "melancia", "melao",
      "abacaxi", "uva", "manga", "morango", "abacate", "kiwi", "pera",
      "limao", "tomate", "cebola", "alho", "batata", "batata doce",
      "cenoura", "alface", "couve", "brocolis", "couve flor", "abobrinha",
      "pimentao", "pepino", "mandioca", "aipim", "abobora", "chuchu",
      "quiabo", "vagem", "beterraba", "rucula", "espinafre", "salsinha",
      "cheiro verde", "coentro", "gengibre", "milho verde", "verdura",
      "legume", "fruta",
    ],
    "Hortifrúti",
  ],

  // --- Outros ---
  [
    ["bombom", "pilha", "bateria", "lampada", "vela", "fosforo", "isqueiro", "papel aluminio", "papel filme", "plastico filme", "saco plastico", "filtro de cafe", "copo descartavel", "prato descartavel", "guardanapo de papel", "palito de dente", "carvao"],
    "Outros",
  ],
];

export function guessCategoryName(raw: string): CanonicalCategory | null {
  const text = ` ${normalize(raw)} `;
  if (text.trim().length < 2) return null;
  for (const [keywords, category] of RULES) {
    for (const k of keywords) {
      const needle = k.endsWith(" ") ? k : ` ${k}`;
      if (text.includes(needle) || text.includes(` ${k} `) || text.includes(k)) {
        return category;
      }
    }
  }
  return null;
}
