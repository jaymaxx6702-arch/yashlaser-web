import { NextResponse } from "next/server";
import { findProduct } from "@/data/catalog";

type InputItem = {
  id?: string;
  productId?: string;
  slug?: string;
  variantId?: string;
  quantity?: number;
};

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  if (!body || !Array.isArray(body.items) || body.items.length > 100)
    return NextResponse.json({ error: "Invalid cart." }, { status: 400 });

  const items = body.items.map((raw: InputItem) => {
    const p = typeof raw.slug === "string" ? findProduct(raw.slug) : undefined;
    const quantity = Number(raw.quantity);
    if (
      !p ||
      p.id !== raw.productId ||
      !Number.isInteger(quantity) ||
      quantity < 1 ||
      quantity > 10000
    ) {
      return { id: raw.id, valid: false, reason: "Product configuration is invalid." };
    }
    const variant = p.variants.find((v) => v.id === raw.variantId);
    if (p.variants.length && (!variant || !variant.available)) {
      return { id: raw.id, valid: false, reason: "Selected option is unavailable." };
    }
    const unitPriceMinor =
      p.pricingMode === "quote_required"
        ? null
        : (variant?.effectivePriceMinor ?? p.effectivePriceMinor) || null;
    return {
      id: raw.id,
      valid: true,
      productId: p.id,
      slug: p.slug,
      name: p.name,
      variantId: variant?.id || "",
      variantName: variant?.name || "To confirm",
      quantity,
      unitPriceMinor,
      pricingMode: p.pricingMode,
      quoteRequired: p.pricingMode === "quote_required" || !unitPriceMinor,
      lineTotalMinor: unitPriceMinor ? unitPriceMinor * quantity : null,
    };
  });

  return NextResponse.json({ items });
}
