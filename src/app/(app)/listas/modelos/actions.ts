"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function db() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Não autenticado");
  return { supabase, user };
}

function num(v: FormDataEntryValue | null, fallback = 1): number {
  const s = String(v ?? "").trim();
  if (s === "") return fallback;
  const n = Number(s.replace(",", "."));
  return Number.isFinite(n) ? n : fallback;
}

export async function createTemplate(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) return;
  const makeDefault = String(formData.get("is_default") ?? "") === "on";

  const { supabase } = await db();
  if (makeDefault) {
    await supabase
      .from("list_templates")
      .update({ is_default: false })
      .eq("is_default", true);
  }
  const { data, error } = await supabase
    .from("list_templates")
    .insert({ name, is_default: makeDefault })
    .select("id")
    .single();
  if (error) throw error;

  revalidatePath("/listas/modelos");
  redirect(`/listas/modelos/${data.id}`);
}

export async function renameTemplate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!id || !name) return;
  const { supabase } = await db();
  await supabase.from("list_templates").update({ name }).eq("id", id);
  revalidatePath("/listas/modelos");
  revalidatePath(`/listas/modelos/${id}`);
}

export async function setDefaultTemplate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase
    .from("list_templates")
    .update({ is_default: false })
    .eq("is_default", true);
  await supabase
    .from("list_templates")
    .update({ is_default: true })
    .eq("id", id);
  revalidatePath("/listas/modelos");
  revalidatePath("/listas");
}

export async function deleteTemplate(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("list_templates").delete().eq("id", id);
  revalidatePath("/listas/modelos");
  redirect("/listas/modelos");
}

export async function addTemplateItem(formData: FormData) {
  const template_id = String(formData.get("template_id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  if (!template_id || !name) return;
  const category_id = String(formData.get("category_id") ?? "") || null;
  const quantity = num(formData.get("quantity"), 1);

  const { supabase } = await db();
  const { data: last } = await supabase
    .from("list_template_items")
    .select("sort_order")
    .eq("template_id", template_id)
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();

  await supabase.from("list_template_items").insert({
    template_id,
    name,
    category_id,
    quantity,
    sort_order: (last?.sort_order ?? 0) + 1,
  });
  revalidatePath(`/listas/modelos/${template_id}`);
}

export async function updateTemplateItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const template_id = String(formData.get("template_id") ?? "");
  if (!id) return;
  const patch: Record<string, unknown> = {
    name: String(formData.get("name") ?? "").trim(),
    quantity: num(formData.get("quantity"), 1),
    is_weight: String(formData.get("is_weight") ?? "") === "on",
    category_id: String(formData.get("category_id") ?? "") || null,
  };
  if (!patch.name) return;
  const { supabase } = await db();
  await supabase.from("list_template_items").update(patch).eq("id", id);
  revalidatePath(`/listas/modelos/${template_id}`);
}

export async function deleteTemplateItem(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const template_id = String(formData.get("template_id") ?? "");
  if (!id) return;
  const { supabase } = await db();
  await supabase.from("list_template_items").delete().eq("id", id);
  revalidatePath(`/listas/modelos/${template_id}`);
}
