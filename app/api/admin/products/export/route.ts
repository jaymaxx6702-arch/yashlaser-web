import { requireAdmin } from "@/lib/admin";
import { products } from "@/data/catalog";
import type { ProductAdminDraft } from "@/lib/product-admin";
import { catalogueDraftsToCsv } from "@/lib/catalogue-csv";

function pricingMode(value: string): ProductAdminDraft["pricingMode"] {
  if (value === "fixed" || value === "from" || value === "quote_required")
    return value;
  return "quote_required";
}

export async function GET() {
  await requireAdmin();

  const drafts: ProductAdminDraft[] = products.map((product) => ({
    productKey: product.id,
    baseProductId: product.id,
    name: product.name,
    slug: product.slug,
    categoryId: product.categoryId,
    subcategoryId: product.subcategoryId,
    pricingMode: pricingMode(product.pricingMode),
    currency: "INR",
    priceMinor: product.priceMinor,
    effectivePriceMinor: product.effectivePriceMinor,
    description: product.description,
    details: product.details,
    variants: product.variants.map((variant) => ({
      id: variant.id,
      name: variant.name,
      priceMinor: variant.priceMinor,
      effectivePriceMinor: variant.effectivePriceMinor,
      available: variant.available,
    })),
  }));

  const csv = catalogueDraftsToCsv(drafts);
  return new Response(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition":
        'attachment; filename="yashlaser-catalogue-template.csv"',
      "cache-control": "no-store",
    },
  });
}
