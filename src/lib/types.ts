export type UUID = string;

export interface Profile {
  id: UUID;
  display_name: string | null;
  created_at: string;
}

export interface Market {
  id: UUID;
  name: string;
  color: string | null;
  archived: boolean;
  created_by: UUID | null;
  created_at: string;
}

export interface Category {
  id: UUID;
  name: string;
  color: string | null;
  created_at: string;
}

export type PurchaseStatus = "aberta" | "concluida";

export interface Purchase {
  id: UUID;
  market_id: UUID | null;
  purchase_date: string;
  status: PurchaseStatus;
  note: string | null;
  created_by: UUID | null;
  created_at: string;
}

export interface PurchaseItem {
  id: UUID;
  purchase_id: UUID;
  name: string;
  category_id: UUID | null;
  is_weight: boolean;
  quantity: number;
  unit_price: number;
  total: number;
  created_at: string;
}

export interface ListTemplate {
  id: UUID;
  name: string;
  is_default: boolean;
  created_by: UUID | null;
  created_at: string;
}

export interface ListTemplateItem {
  id: UUID;
  template_id: UUID;
  name: string;
  category_id: UUID | null;
  quantity: number;
  is_weight: boolean;
  sort_order: number;
  created_at: string;
}

export type ShoppingListStatus = "ativa" | "concluida" | "arquivada";

export interface ShoppingList {
  id: UUID;
  title: string;
  reference_month: string;
  template_id: UUID | null;
  market_id: UUID | null;
  status: ShoppingListStatus;
  purchase_id: UUID | null;
  created_by: UUID | null;
  created_at: string;
}

export interface ShoppingListItem {
  id: UUID;
  list_id: UUID;
  name: string;
  category_id: UUID | null;
  quantity: number;
  is_weight: boolean;
  unit_price: number | null;
  checked: boolean;
  note: string | null;
  sort_order: number;
  created_at: string;
}

/** Linha achatada usada nos gráficos. */
export interface FlatItem {
  id: UUID;
  name: string;
  total: number;
  quantity: number;
  unit_price: number;
  is_weight: boolean;
  category: string | null;
  category_color: string | null;
  month: string; // "YYYY-MM"
  date: string; // ISO
  market: string | null;
}

export interface MonthlyTotal {
  month: string; // "YYYY-MM"
  total: number;
  purchases: number;
  items: number;
}
