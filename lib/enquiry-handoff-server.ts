import "server-only";

import { getSupabase } from "@/lib/supabase";
import {
  signDesignHandoff,
  verifyDesignHandoff,
  type DesignHandoffTicket,
} from "@/lib/design-handoff";

const HANDOFF_TTL_MS = 90 * 24 * 60 * 60 * 1000;

function handoffSecret() {
  const secret =
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!secret) throw new Error("Design handoff secret is unavailable.");
  return secret;
}

export async function createDesignHandoffForRequest(input: {
  requestId: string;
  designId: string;
  productId: string;
}) {
  const db = getSupabase();
  const { data: enquiry, error: enquiryError } = await db
    .from("enquiries")
    .select("id")
    .eq("request_id", input.requestId)
    .maybeSingle();

  if (enquiryError || !enquiry) return null;

  const { data: item, error: itemError } = await db
    .from("enquiry_items")
    .select("id,design_id,product_id")
    .eq("enquiry_id", enquiry.id)
    .eq("design_id", input.designId)
    .eq("product_id", input.productId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (itemError || !item) return null;

  return signDesignHandoff(
    {
      version: 1,
      enquiryItemId: item.id,
      designId: item.design_id,
      productId: item.product_id,
      expiresAt: Date.now() + HANDOFF_TTL_MS,
    },
    handoffSecret(),
  );
}

export type ResolvedDesignHandoff = {
  ticket: DesignHandoffTicket;
  enquiryItemId: string;
  artworkPath: string | null;
  previewPath: string;
};

export async function resolveDesignHandoff(
  token: string,
  expected: { designId: string; productId: string },
): Promise<ResolvedDesignHandoff> {
  const ticket = verifyDesignHandoff(token, handoffSecret());

  if (
    ticket.designId !== expected.designId ||
    ticket.productId !== expected.productId
  )
    throw new Error("Saved design does not match this cart item.");

  const db = getSupabase();
  const { data: item, error } = await db
    .from("enquiry_items")
    .select("id,design_id,product_id,artwork_path,preview_path")
    .eq("id", ticket.enquiryItemId)
    .maybeSingle();

  if (
    error ||
    !item ||
    item.design_id !== expected.designId ||
    item.product_id !== expected.productId ||
    typeof item.preview_path !== "string" ||
    !item.preview_path
  )
    throw new Error("Saved design assets are unavailable.");

  return {
    ticket,
    enquiryItemId: item.id,
    artworkPath:
      typeof item.artwork_path === "string" && item.artwork_path
        ? item.artwork_path
        : null,
    previewPath: item.preview_path,
  };
}
