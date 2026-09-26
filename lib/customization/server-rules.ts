import "server-only";

import type { CategoryId } from "@/data/catalog";
import { getSupabase } from "@/lib/supabase";
import {
  validateCustomizationDefinition,
  type CustomizationDefinition,
} from "./contract";

export async function getPublishedCustomizationDefinition(
  product: { id: string; categoryId: CategoryId },
): Promise<CustomizationDefinition | undefined> {
  try {
    const { data, error } = await getSupabase()
      .from("shop_customization_rules")
      .select("definition")
      .eq("product_id", product.id)
      .eq("status", "published")
      .order("revision", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) return undefined;

    const definition = validateCustomizationDefinition(data.definition);
    if (definition.categoryId !== product.categoryId) return undefined;
    return definition;
  } catch {
    return undefined;
  }
}
