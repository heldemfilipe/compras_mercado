# 🛒 Compras de Mercado

App pessoal e **privado** para controlar as compras de mercado do mês: você
cadastra os mercados, registra cada compra (produto + valor), monta listas a
partir de modelos reaproveitáveis e acompanha a evolução dos gastos em gráficos.

Inspirado no app _SOMA_, com login na frente, listas de compras e comparação de
gastos entre meses e entre produtos.

- **Stack:** Next.js 15 (App Router) + Supabase (Postgres + Auth) + Tailwind CSS v4 + Recharts
- **Deploy:** Vercel (grátis) + Supabase (grátis)
- **Feito para celular** (mobile-first, tema escuro, instalável como PWA)

> Sem cadastro aberto: as contas são criadas por você. Ideal para uso doméstico
> (ex.: você e seu/sua parceiro(a) compartilhando os mesmos dados).

---

## ✨ Recursos

| Área | O que dá pra fazer |
| --- | --- |
| **Login** | Tela de entrada com e-mail e senha. Sem cadastro público. |
| **Compras** | Escolhe o mercado, a data e vai lançando `produto → valor → quantidade` (ou por peso). Agrupadas por mês, com total por compra e por mês. |
| **Listas** | Lista do mês com itens marcáveis, estimativa de gasto e botão **"Registrar compra"** que transforma a lista numa compra. |
| **Modelos** | Modelos de lista reaproveitáveis (ex.: _"Compra do mês"_). Marque um como padrão e gere a lista do mês em 1 toque. |
| **Gráficos** | Gasto por mês, comparação entre dois meses (inclusive por categoria), histórico de preço de um produto e gasto por categoria no período. |
| **Ajustes** | Cadastro de mercados e categorias, nome de exibição e logout. |

---

## 🚀 Instalação (passo a passo)

Você vai precisar de contas **grátis** em: [GitHub](https://github.com),
[Supabase](https://supabase.com) e [Vercel](https://vercel.com). E
[Node.js 20+](https://nodejs.org) se quiser rodar na sua máquina.

### 1. Pegue o código

Clique em **"Use this template"** no GitHub (ou faça um _fork_), depois clone:

```bash
git clone https://github.com/SEU-USUARIO/compras_mercado.git
cd compras_mercado
npm install
```

### 2. Crie o projeto no Supabase

1. Acesse <https://supabase.com/dashboard> → **New project**.
2. Dê um nome, escolha uma senha para o banco e a região mais próxima.
3. Espere ~2 minutos até o projeto ficar pronto.

### 3. Crie as tabelas

No painel do Supabase: **SQL Editor → New query**.

1. Cole todo o conteúdo de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) e clique em **Run**.
2. (Opcional, recomendado) Cole [`supabase/seed.sql`](supabase/seed.sql) e **Run** — cria categorias, alguns mercados de exemplo e o modelo padrão _"Compra do mês"_.

### 4. Copie as chaves de API

No painel: **Project Settings → API**. Você vai usar:

| Valor no Supabase | Variável de ambiente |
| --- | --- |
| Project URL | `NEXT_PUBLIC_SUPABASE_URL` |
| `anon` `public` | `NEXT_PUBLIC_SUPABASE_ANON_KEY` |
| `service_role` `secret` | `SUPABASE_SERVICE_ROLE_KEY` (só local, para criar usuários) |

### 5. Configure o ambiente local

```bash
cp .env.example .env.local
```

Abra `.env.local` e preencha os três valores do passo anterior.

### 6. Rode na sua máquina

```bash
npm run dev
```

Abra <http://localhost:3000>. Você vai cair na tela de login (ainda sem usuário).

### 7. Crie os usuários

Sem cadastro aberto — crie as contas de um jeito:

**Opção A — script (recomendado):**

```bash
npm run create-user -- voce@exemplo.com "suaSenhaForte" "Seu Nome"
npm run create-user -- parceiro@exemplo.com "outraSenha" "Nome do Parceiro"
```

> O script usa a `SUPABASE_SERVICE_ROLE_KEY` do `.env.local`. Essa chave é
> secreta — **nunca** faça deploy dela nem a coloque na Vercel.

**Opção B — painel do Supabase:** **Authentication → Users → Add user** →
preencha e-mail/senha e marque **Auto Confirm User**.

Agora entre no app com o e-mail e a senha criados.

### 8. Deploy na Vercel

1. <https://vercel.com/new> → importe o repositório.
2. Em **Environment Variables**, adicione **apenas**:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Deploy**.

### 9. Ajustes finais no Supabase (Auth)

Em **Authentication → Sign In / Providers → Email**:

- **Confirm email:** pode deixar desligado (as contas são criadas já confirmadas).
- **Allow new users to sign up:** **desligue** depois de criar suas contas — reforça a privacidade.

Em **Authentication → URL Configuration**:

- **Site URL:** a URL da Vercel (ex.: `https://compras-mercado.vercel.app`).
- **Redirect URLs:** adicione `http://localhost:3000/**` e `https://SEU-APP.vercel.app/**`.

Pronto. ✅

---

## 📱 Instalar no celular (PWA)

Abra a URL da Vercel no navegador do celular → menu → **Adicionar à tela inicial**.

---

## 🧭 Como usar

1. **Ajustes** → cadastre seus mercados (Atacado, Feira, etc.) e, se quiser, categorias.
2. **Compras → +** → escolha o mercado e a data, depois lance os itens
   (`produto`, `valor unitário`, `quantidade` ou marque **"Por peso"** para
   preço por kg).
3. **Listas** → **"Gerar lista do mês"** a partir de um modelo. Marque os itens
   enquanto compra e, no fim, **"Registrar compra"** cria a compra
   automaticamente.
4. **Modelos** → monte a lista fixa que você sempre compra e marque como padrão.
5. **Gráficos** → compare meses, veja o preço de um produto ao longo do tempo e
   o gasto por categoria.

---

## 🗂️ Estrutura

```
src/
├─ app/
│  ├─ login/                 # tela de entrada (pública)
│  ├─ auth/signout/          # rota de logout
│  └─ (app)/                 # área logada (protegida pelo middleware)
│     ├─ page.tsx            # Início / dashboard
│     ├─ compras/            # lista, nova, detalhe + itens
│     ├─ listas/             # listas do mês, detalhe, modelos
│     ├─ graficos/           # análises e comparações
│     └─ ajustes/            # mercados, categorias, conta
├─ components/               # UI compartilhada + gráficos
└─ lib/
   ├─ supabase/              # clients (browser / server / middleware)
   ├─ queries.ts             # leituras do banco
   ├─ format.ts              # moeda BRL, datas, meses
   └─ colors.ts              # paleta dos gráficos
supabase/
├─ migrations/0001_init.sql  # esquema + RLS + funções
└─ seed.sql                  # dados iniciais opcionais
scripts/create-user.mjs      # cria usuários via service_role
```

## 🧱 Modelo de dados

`profiles`, `markets`, `categories`, `purchases`, `purchase_items`,
`list_templates`, `list_template_items`, `shopping_lists`, `shopping_list_items`.

**Compartilhamento:** todo usuário autenticado enxerga e edita os mesmos dados
(uso doméstico). As _policies_ de RLS bloqueiam qualquer acesso sem login. Para
isolar dados por usuário, adicione `user_id` + policies por `auth.uid()`.

Duas funções no banco fazem o trabalho pesado:

- `generate_list_from_template(template, mês, título, mercado)` → cria a lista do mês.
- `convert_list_to_purchase(lista, data)` → cria a compra a partir dos itens marcados.

---

## 🔧 Personalização rápida

- **Cores / tema:** `src/app/globals.css` (bloco `@theme`).
- **Itens do modelo padrão:** `supabase/seed.sql`.
- **Moeda / idioma:** `src/lib/format.ts` (hoje `pt-BR` / `BRL`).

## 🛣️ Próximos passos (ideias)

- Reordenar itens da lista (arrastar).
- Autocompletar produtos a partir do histórico.
- Metas de gasto por mês / categoria.
- Exportar CSV.
- Isolamento de dados por usuário (multi-família).

## 📄 Licença

[MIT](LICENSE) — use, modifique e compartilhe à vontade.
