"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseImportText } from "@/lib/import-parse";

async function db() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

function num(v: FormDataEntryValue | null, fallback = 0): number {
  const n = Number(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function createPurchase(formData: FormData) {
  const market_id = String(formData.get("market_id") ?? "") || null;
  const purchase_date =
    String(formData.get("purchase_date") ?? "") ||
    new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || null;

  const { supabase } = await db();
  const { data, error } = await supabase
    .from("purchases")
    .insert({ market_id, purchase_date, note, status: "aberta" })
    .select("id")
    .single();

  if (error) throw error;
  revalidatePath("/compras");
  redirect(`/compras/${data.id}`);
}

export async function updatePurchaseMeta(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const patch: Record<string, unknown> = {};
  if (formData.has("market_id"))
    patch.market_id = String(formData.get("market_id") ?? "") || null;
  if (formData.has("purchase_date"))
    patch.purchase_date = String(formData.get("purchase_date") ?? "");
  if (formData.has("note"))
    patch.note = String(formData.get("note") ?? "").trim() || null;

  const { supabase } = await db();
  await supabase.from("purchases").update(patch).eq("id", id);
  revalidatePath(`/compras/${id}`);
  revalidatePath("/compras");
}

export async function setPurchaseStatus(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!id || !["aberta", "concluida"].includes(status)) return;
  const { supabase } = await db();
  await supabase.from("purchases").update({ status }).eq("id", id);
  revalidatePath(`/compras/${id}`);
  revalidatePath("/compras");
  revalidatePath("/");
}

export async function deletePurchase(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("purchases").delete().eq("id", id);
  revalidatePath("/compras");
  revalidatePath("/");
  redirect("/compras");
}

export async function addItem(formData: FormData) {
  const purchase_id = String(formData.get("purchase_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!purchase_id || !name) return;

  const is_weight = String(formData.get("is_weight") ?? "") === "on";
  const quantity = num(formData.get("quantity"), 1);
  const unit_price = num(formData.get("unit_price"), 0);
  const category_id = String(formData.get("category_id") ?? "") || null;

  const { supabase } = await db();
  await supabase.from("purchase_items").insert({
    purchase_id,
    name,
    is_weight,
    quantity: quantity || (is_weight ? 0 : 1),
    unit_price,
    category_id,
  });
  revalidatePath(`/compras/${purchase_id}`);
  revalidatePath("/compras");
  revalidatePath("/");
}

export async function updateItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const purchase_id = String(formData.get("purchase_id") ?? "");
  if (!id) return;

  const patch: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    quantity: num(formData.get("quantity"), 1),
    unit_price: num(formData.get("unit_price"), 0),
    is_weight: String(formData.get("is_weight") ?? "") === "on",
    category_id: String(formData.get("category_id") ?? "") || null,
  };
  if (!patch.name) return;

  const { supabase } = await db();
  await supabase.from("purchase_items").update(patch).eq("id", id);
  revalidatePath(`/compras/${purchase_id}`);
  revalidatePath("/compras");
  revalidatePath("/");
}

export async function deleteItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const purchase_id = String(formData.get("purchase_id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("purchase_items").delete().eq("id", id);
  revalidatePath(`/compras/${purchase_id}`);
  revalidatePath("/compras");
  revalidatePath("/");
}

export async function importPurchase(formData: FormData) {
  const market_id = String(formData.get("market_id") ?? "") || null;
  const purchase_date =
    String(formData.get("purchase_date") ?? "") ||
    new Date().toISOString().slice(0, 10);
  const note = String(formData.get("note") ?? "").trim() || "Importada (colada)";
  const items = parseImportText(String(formData.get("text") ?? ""));
  if (items.length === 0) return;

  const { supabase } = await db();
  const { data, error } = await supabase
    .from("purchases")
    .insert({ market_id, purchase_date, note, status: "concluida" })
    .select("id")
    .single();
  if (error) throw error;

  const { error: itemsError } = await supabase.from("purchase_items").insert(
    items.map((it) => ({
      purchase_id: data.id,
      name: it.name.slice(0, 120),
      quantity: it.qty || 1,
      unit_price: it.price || 0,
    })),
  );
  if (itemsError) throw itemsError;

  revalidatePath("/compras");
  revalidatePath("/");
  redirect(`/compras/${data.id}`);
}
