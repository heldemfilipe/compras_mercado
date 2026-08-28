"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { firstDayOfCurrentMonth } from "@/lib/format";

async function db() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const s = String(v ?? "").trim();
  if (s === "") return fallback;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

/** Aceita "YYYY-MM" (input type=month) ou "YYYY-MM-DD" e devolve o 1º dia do mês. */
function monthValue(v: FormDataEntryValue | null): string {
  const s = String(v ?? "").trim();
  if (!s) return firstDayOfCurrentMonth();
  return s.length === 7 ? `${s}-01` : s;
}

/* ------------------------------ Listas ------------------------------ */

export async function generateListFromTemplate(formData: FormData) {
  const template_id = String(formData.get("template_id") ?? "");
  if (!template_id) return;
  const month = monthValue(formData.get("month"));
  const title = String(formData.get("title") ?? "").trim() || null;
  const market_id = String(formData.get("market_id") ?? "") || null;

  const { supabase } = await db();
  const { data, error } = await supabase.rpc("generate_list_from_template", {
    p_template_id: template_id,
    p_month: month,
    p_title: title,
    p_market_id: market_id,
  });
  if (error) throw error;

  revalidatePath("/listas");
  redirect(`/listas/${data}`);
}

export async function createBlankList(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim() || "Lista de compras";
  const month = monthValue(formData.get("month"));
  const market_id = String(formData.get("market_id") ?? "") || null;

  const { supabase } = await db();
  const { data, error } = await supabase
    .from("shopping_lists")
    .insert({ title, reference_month: month, market_id })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/listas");
  redirect(`/listas/${data.id}`);
}

export async function updateListMeta(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const patch: Record<string, unknown> = {};
  if (formData.has("title"))
    patch.title = String(formData.get("title") ?? "").trim() || "Lista";
  if (formData.has("market_id"))
    patch.market_id = String(formData.get("market_id") ?? "") || null;
  if (formData.has("reference_month"))
    patch.reference_month = String(formData.get("reference_month") ?? "");
  if (formData.has("status"))
    patch.status = String(formData.get("status") ?? "ativa");

  const { supabase } = await db();
  await supabase.from("shopping_lists").update(patch).eq("id", id);
  revalidatePath(`/listas/${id}`);
  revalidatePath("/listas");
}

export async function deleteList(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("shopping_lists").delete().eq("id", id);
  revalidatePath("/listas");
  redirect("/listas");
}

export async function addListItem(formData: FormData) {
  const list_id = String(formData.get("list_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!list_id || !name) return;
  const category_id = String(formData.get("category_id") ?? "") || null;
  const quantity = num(formData.get("quantity"), 1) || 1;
  const priceRaw = String(formData.get("unit_price") ?? "").trim();
  const unit_price = priceRaw === "" ? null : num(formData.get("unit_price"), 0);

  const { supabase } = await db();
  const { data: last } = await supabase
    .from("shopping_list_items")
    .select("sort_order")
    .eq("list_id", list_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("shopping_list_items").insert({
    list_id,
    name,
    category_id,
    quantity,
    unit_price,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  revalidatePath(`/listas/${list_id}`);
  revalidatePath("/listas");
}

/** Ajuste rápido de preço e/ou quantidade direto na linha da lista. */
export async function setListItemField(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const list_id = String(formData.get("list_id") ?? "");
  if (!id) return;

  const patch: Record<string, unknown> = {};
  if (formData.has("unit_price")) {
    const raw = String(formData.get("unit_price") ?? "").trim();
    patch.unit_price = raw === "" ? null : num(formData.get("unit_price"), 0);
  }
  if (formData.has("quantity")) {
    patch.quantity = num(formData.get("quantity"), 1) || 1;
  }
  if (Object.keys(patch).length === 0) return;

  const { supabase } = await db();
  await supabase.from("shopping_list_items").update(patch).eq("id", id);
  revalidatePath(`/listas/${list_id}`);
  revalidatePath("/listas");
}

export async function toggleListItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const list_id = String(formData.get("list_id") ?? "");
  const checked = String(formData.get("checked") ?? "") === "true";
  if (!id) return;
  const { supabase } = await db();
  await supabase
    .from("shopping_list_items")
    .update({ checked: !checked })
    .eq("id", id);
  revalidatePath(`/listas/${list_id}`);
  revalidatePath("/listas");
}

export async function updateListItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const list_id = String(formData.get("list_id") ?? "");
  if (!id) return;

  const priceRaw = String(formData.get("unit_price") ?? "").trim();
  const patch: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    quantity: num(formData.get("quantity"), 1) || 1,
    unit_price: priceRaw === "" ? null : num(formData.get("unit_price"), 0),
    is_weight: String(formData.get("is_weight") ?? "") === "on",
    note: String(formData.get("note") ?? "").trim() || null,
    category_id: String(formData.get("category_id") ?? "") || null,
  };
  if (!patch.name) return;

  const { supabase } = await db();
  await supabase.from("shopping_list_items").update(patch).eq("id", id);
  revalidatePath(`/listas/${list_id}`);
  revalidatePath("/listas");
}

export async function deleteListItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const list_id = String(formData.get("list_id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("shopping_list_items").delete().eq("id", id);
  revalidatePath(`/listas/${list_id}`);
  revalidatePath("/listas");
}

export async function convertListToPurchase(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  const { data, error } = await supabase.rpc("convert_list_to_purchase", {
    p_list_id: id,
  });
  if (error) throw error;

  revalidatePath("/listas");
  revalidatePath("/compras");
  revalidatePath("/");
  redirect(`/compras/${data}`);
}
