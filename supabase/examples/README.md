# Exemplos (opcional)

Rode no **SQL Editor** do Supabase, depois de `migrations/0001` e `migrations/0002`.

## `historico-assai.sql`

Cria ~1 ano de compras de exemplo (todas no mercado **Assaí**), transcritas dos
prints do app SOMA. Serve para os gráficos já nascerem com dados.

- Cada compra recebe os itens legíveis + uma linha **"Outros itens (não
  detalhados)"** que fecha **exatamente** o total do mês. Ou seja: o gráfico de
  gasto mensal fica 100% correto mesmo que falte item.
- É **idempotente**: rodar de novo não duplica (checa a data).
- Para detalhar um mês depois: abra a compra no app e edite, ou use
  **Compras → Importar** e cole a lista.

Para apagar tudo depois:

```sql
delete from public.purchases where note = 'Importada do histórico (SOMA)';
drop function if exists public.seed_example_purchase(date, text, jsonb, numeric, text);
```
