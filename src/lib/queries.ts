import type { SupabaseClient } from "@supabase/supabase-js";
import { toMonthKey } from "@/lib/format";
import type {
  Category,
  FlatItem,
  Market,
  MonthlyTotal,
} from "@/lib/types";

type DB = SupabaseClient;

function firstDayNMonthsAgo(n: number): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - n);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-01`;
}

export async function getMarkets(
  supabase: DB,
  opts: { includeArchived?: boolean } = {},
): Promise<Market[]> {
  let query = supabase.from("markets").select("*").order("name");
  if (!opts.includeArchived) query = query.eq("archived", false);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as Market[];
}

export async function getCategories(supabase: DB): Promise<Category[]> {
  const { data, error } = await supabase
    .from("categories")
    .select("*")
    .order("name");
  if (error) throw error;
  return (data ?? []) as Category[];
}

export interface PurchaseListRow {
  id: string;
  purchase_date: string;
  status: "aberta" | "concluida";
  note: string | null;
  market: { id: string; name: string; color: string | null } | null;
  total: number;
  itemCount: number;
}

export async function getPurchasesWithTotals(
  supabase: DB,
  limit?: number,
): Promise<PurchaseListRow[]> {
  let query = supabase
    .from("purchases")
    .select(
      "id, purchase_date, status, note, markets ( id, name, color ), purchase_items ( total )",
    )
    .order("purchase_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (limit) query = query.limit(limit);

  const { data, error } = await query;
  if (error) throw error;

  return (data ?? []).map((p: Record<string, unknown>) => {
    const items = (p.purchase_items ?? []) as { total: number }[];
    const market = (p.markets ?? null) as PurchaseListRow["market"];
    return {
      id: p.id as string,
      purchase_date: p.purchase_date as string,
      status: p.status as "aberta" | "concluida",
      note: (p.note ?? null) as string | null,
      market,
      total: items.reduce((s, it) => s + Number(it.total ?? 0), 0),
      itemCount: items.length,
    };
  });
}

export interface PurchaseDetail {
  id: string;
  purchase_date: string;
  status: "aberta" | "concluida";
  note: string | null;
  market: { id: string; name: string } | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    unit_price: number;
    total: number;
    is_weight: boolean;
    category: { id: string; name: string; color: string | null } | null;
  }[];
  total: number;
}

export async function getPurchase(
  supabase: DB,
  id: string,
): Promise<PurchaseDetail | null> {
  const { data, error } = await supabase
    .from("purchases")
    .select(
      `id, purchase_date, status, note,
       markets ( id, name ),
       purchase_items (
         id, name, quantity, unit_price, total, is_weight, created_at,
         categories ( id, name, color )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as Record<string, unknown>;
  const items = ((raw.purchase_items ?? []) as Record<string, unknown>[])
    .map((it) => ({
      id: it.id as string,
      name: it.name as string,
      quantity: Number(it.quantity ?? 0),
      unit_price: Number(it.unit_price ?? 0),
      total: Number(it.total ?? 0),
      is_weight: Boolean(it.is_weight),
      created_at: it.created_at as string,
      category: (it.categories ?? null) as PurchaseDetail["items"][number]["category"],
    }))
    .sort((a, b) => a.created_at.localeCompare(b.created_at))
    .map(({ created_at: _omit, ...rest }) => rest);

  return {
    id: raw.id as string,
    purchase_date: raw.purchase_date as string,
    status: raw.status as "aberta" | "concluida",
    note: (raw.note ?? null) as string | null,
    market: (raw.markets ?? null) as PurchaseDetail["market"],
    items,
    total: items.reduce((s, it) => s + it.total, 0),
  };
}

export async function getFlatItems(
  supabase: DB,
  months = 24,
): Promise<FlatItem[]> {
  const since = firstDayNMonthsAgo(months);
  const { data, error } = await supabase
    .from("purchase_items")
    .select(
      `id, name, total, quantity, unit_price, is_weight,
       categories ( name, color ),
       purchases!inner ( purchase_date, markets ( name ) )`,
    )
    .gte("purchases.purchase_date", since)
    .order("purchase_date", { referencedTable: "purchases", ascending: true });

  if (error) throw error;

  return (data ?? []).map((row: Record<string, unknown>) => {
    const purchase = (row.purchases ?? {}) as Record<string, unknown>;
    const category = (row.categories ?? null) as {
      name: string;
      color: string | null;
    } | null;
    const market = (purchase.markets ?? null) as { name: string } | null;
    const date = (purchase.purchase_date as string) ?? "";
    return {
      id: row.id as string,
      name: row.name as string,
      total: Number(row.total ?? 0),
      quantity: Number(row.quantity ?? 0),
      unit_price: Number(row.unit_price ?? 0),
      is_weight: Boolean(row.is_weight),
      category: category?.name ?? null,
      category_color: category?.color ?? null,
      month: date ? toMonthKey(date) : "",
      date,
      market: market?.name ?? null,
    };
  });
}

export async function getMonthlyTotals(
  supabase: DB,
  months = 12,
): Promise<MonthlyTotal[]> {
  const since = firstDayNMonthsAgo(months);
  const { data, error } = await supabase
    .from("purchases")
    .select("id, purchase_date, purchase_items ( total )")
    .gte("purchase_date", since)
    .order("purchase_date", { ascending: true });

  if (error) throw error;

  const byMonth = new Map<string, MonthlyTotal>();
  for (const p of (data ?? []) as Record<string, unknown>[]) {
    const key = toMonthKey(p.purchase_date as string);
    const items = (p.purchase_items ?? []) as { total: number }[];
    const entry =
      byMonth.get(key) ?? { month: key, total: 0, purchases: 0, items: 0 };
    entry.total += items.reduce((s, it) => s + Number(it.total ?? 0), 0);
    entry.purchases += 1;
    entry.items += items.length;
    byMonth.set(key, entry);
  }

  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export interface ShoppingListRow {
  id: string;
  title: string;
  reference_month: string;
  status: "ativa" | "concluida" | "arquivada";
  market: { name: string } | null;
  purchase_id: string | null;
  total: number;
  checked: number;
  estimated: number;
}

export async function getShoppingLists(
  supabase: DB,
): Promise<ShoppingListRow[]> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select(
      `id, title, reference_month, status, purchase_id,
       markets ( name ),
       shopping_list_items ( checked, quantity, unit_price )`,
    )
    .order("reference_month", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((l: Record<string, unknown>) => {
    const items = (l.shopping_list_items ?? []) as {
      checked: boolean;
      quantity: number;
      unit_price: number | null;
    }[];
    return {
      id: l.id as string,
      title: l.title as string,
      reference_month: l.reference_month as string,
      status: l.status as ShoppingListRow["status"],
      market: (l.markets ?? null) as { name: string } | null,
      purchase_id: (l.purchase_id ?? null) as string | null,
      total: items.length,
      checked: items.filter((it) => it.checked).length,
      estimated: items.reduce(
        (s, it) => s + Number(it.unit_price ?? 0) * Number(it.quantity ?? 0),
        0,
      ),
    };
  });
}

export interface ShoppingListDetail {
  id: string;
  title: string;
  reference_month: string;
  status: "ativa" | "concluida" | "arquivada";
  market_id: string | null;
  purchase_id: string | null;
  items: {
    id: string;
    name: string;
    quantity: number;
    is_weight: boolean;
    unit_price: number | null;
    checked: boolean;
    note: string | null;
    sort_order: number;
    category: { id: string; name: string; color: string | null } | null;
  }[];
}

export async function getShoppingList(
  supabase: DB,
  id: string,
): Promise<ShoppingListDetail | null> {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select(
      `id, title, reference_month, status, market_id, purchase_id,
       shopping_list_items (
         id, name, quantity, is_weight, unit_price, checked, note, sort_order,
         categories ( id, name, color )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as Record<string, unknown>;
  const items = ((raw.shopping_list_items ?? []) as Record<string, unknown>[])
    .map((it) => ({
      id: it.id as string,
      name: it.name as string,
      quantity: Number(it.quantity ?? 0),
      is_weight: Boolean(it.is_weight),
      unit_price: it.unit_price == null ? null : Number(it.unit_price),
      checked: Boolean(it.checked),
      note: (it.note ?? null) as string | null,
      sort_order: Number(it.sort_order ?? 0),
      category: (it.categories ?? null) as ShoppingListDetail["items"][number]["category"],
    }))
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt-BR"),
    );

  return {
    id: raw.id as string,
    title: raw.title as string,
    reference_month: raw.reference_month as string,
    status: raw.status as ShoppingListDetail["status"],
    market_id: (raw.market_id ?? null) as string | null,
    purchase_id: (raw.purchase_id ?? null) as string | null,
    items,
  };
}

export interface TemplateRow {
  id: string;
  name: string;
  is_default: boolean;
  itemCount: number;
}

export async function getTemplates(supabase: DB): Promise<TemplateRow[]> {
  const { data, error } = await supabase
    .from("list_templates")
    .select("id, name, is_default, list_template_items ( id )")
    .order("is_default", { ascending: false })
    .order("name");

  if (error) throw error;

  return (data ?? []).map((t: Record<string, unknown>) => ({
    id: t.id as string,
    name: t.name as string,
    is_default: Boolean(t.is_default),
    itemCount: ((t.list_template_items ?? []) as unknown[]).length,
  }));
}

export interface TemplateDetail {
  id: string;
  name: string;
  is_default: boolean;
  items: {
    id: string;
    name: string;
    quantity: number;
    is_weight: boolean;
    sort_order: number;
    category: { id: string; name: string; color: string | null } | null;
  }[];
}

export async function getTemplate(
  supabase: DB,
  id: string,
): Promise<TemplateDetail | null> {
  const { data, error } = await supabase
    .from("list_templates")
    .select(
      `id, name, is_default,
       list_template_items (
         id, name, quantity, is_weight, sort_order,
         categories ( id, name, color )
       )`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const raw = data as Record<string, unknown>;
  const items = ((raw.list_template_items ?? []) as Record<string, unknown>[])
    .map((it) => ({
      id: it.id as string,
      name: it.name as string,
      quantity: Number(it.quantity ?? 0),
      is_weight: Boolean(it.is_weight),
      sort_order: Number(it.sort_order ?? 0),
      category: (it.categories ?? null) as TemplateDetail["items"][number]["category"],
    }))
    .sort(
      (a, b) =>
        a.sort_order - b.sort_order || a.name.localeCompare(b.name, "pt-BR"),
    );

  return {
    id: raw.id as string,
    name: raw.name as string,
    is_default: Boolean(raw.is_default),
    items,
  };
}

export async function getProfileName(supabase: DB): Promise<string | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .maybeSingle();
  return (
    (data?.display_name as string | undefined) ??
    user.email?.split("@")[0] ??
    null
  );
}
