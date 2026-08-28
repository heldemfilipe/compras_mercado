"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function db() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

/* -------------------------------- Mercados -------------------------------- */

export async function addMarket(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim() || null;
  if (!name) return;
  const { supabase } = await db();
  await supabase.from("markets").insert({ name, color });
  revalidatePath("/ajustes");
}

export async function renameMarket(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const { supabase } = await db();
  await supabase.from("markets").update({ name }).eq("id", id);
  revalidatePath("/ajustes");
}

export async function toggleMarketArchived(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const archived = String(formData.get("archived") ?? "") === "true";
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("markets").update({ archived: !archived }).eq("id", id);
  revalidatePath("/ajustes");
}

export async function deleteMarket(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("markets").delete().eq("id", id);
  revalidatePath("/ajustes");
}

/* ------------------------------- Categorias ------------------------------ */

export async function addCategory(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "").trim() || null;
  if (!name) return;
  const { supabase } = await db();
  await supabase.from("categories").insert({ name, color });
  revalidatePath("/ajustes");
}

export async function deleteCategory(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/ajustes");
}

/* --------------------------------- Conta -------------------------------- */

export async function updateDisplayName(formData: FormData) {
  const name = String(formData.get("display_name") ?? "").trim();
  if (!name) return;
  const { supabase, user } = await db();
  await supabase
    .from("profiles")
    .upsert({ id: user.id, display_name: name }, { onConflict: "id" });
  revalidatePath("/ajustes");
  revalidatePath("/");
}
