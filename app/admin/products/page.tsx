import { requireAdmin } from "@/lib/admin";
import { categories, products } from "@/data/catalog";
import { getSupabase } from "@/lib/supabase";
import { ProductAdminWizard } from "@/components/admin/ProductAdminWizard";
import { publishProductAdminVersion } from "./actions";
import type { ProductAdminDraft } from "@/lib/product-admin";

function seedDraft(baseId: string | undefined): ProductAdminDraft {
  const product = products.find((item) => item.id === baseId);
  if (product) {
    return {
      productKey: product.id,
      baseProductId: product.id,
      slug: product.slug,
      name: product.name,
      categoryId: product.categoryId,
      subcategoryId: product.subcategoryId,
      pricingMode: product.pricingMode,
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
    };
  }

  return {
    productKey: "new-product",
    slug: "new-product",
    name: "New Product",
    categoryId: "other",
    pricingMode: "quote_required",
    currency: "INR",
    priceMinor: 0,
    effectivePriceMinor: 0,
    description: "",
    details: "",
    variants: [],
  };
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const read = (key: string) =>
    typeof params[key] === "string" ? String(params[key]) : "";
  const baseProductId = read("base_product_id").slice(0, 160);
  const productKey = read("product_key").slice(0, 120);

  const db = getSupabase();
  let query = db
    .from("shop_product_admin_versions")
    .select(
      "id,product_key,base_product_id,slug,name,category_id,subcategory_id,revision,state,product_payload,validation_report,created_at,updated_at,published_at",
    )
    .order("updated_at", { ascending: false })
    .limit(100);

  if (productKey) query = query.eq("product_key", productKey);
  const { data, error } = await query;

  return (
    <>
      <header className="admin-top">
        <div>
          <h1>Products</h1>
          <p className="muted">
            Create safe versioned product drafts without changing the generated
            storefront catalogue.
          </p>
        </div>
      </header>

      {read("saved") === "1" && <p role="status">Product draft saved.</p>}
      {read("published") === "1" && (
        <p role="status">
          Product revision published to the admin overlay. Storefront merge is
          intentionally deferred.
        </p>
      )}

      <section className="admin-card">
        <h2>Start from an existing product</h2>
        <form method="get">
          <label>
            Existing product
            <input
              name="base_product_id"
              defaultValue={baseProductId}
              list="admin-products"
              placeholder="Leave empty for a new product"
            />
            <datalist id="admin-products">
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </datalist>
          </label>
          <button type="submit">Load into wizard</button>
        </form>
      </section>

      <ProductAdminWizard
        key={baseProductId || "new"}
        initial={seedDraft(baseProductId || undefined)}
        categories={categories}
      />

      <section>
        <h2>{productKey ? "Product revisions" : "Recent product drafts"}</h2>
        {error ? (
          <p role="alert">
            Product admin storage is unavailable until the matching database
            migration is applied.
          </p>
        ) : (
          <div className="admin-list">
            {(data ?? []).map((row) => (
              <article className="admin-card" key={row.id}>
                <strong>
                  {row.name} · revision {row.revision}
                </strong>
                <span>
                  {row.product_key} · {row.state} · {row.category_id}
                </span>
                <span>/products/{row.slug}</span>
                <small>
                  Updated{" "}
                  {new Date(row.updated_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </small>
                {row.state === "draft" && row.validation_report?.ok === true && (
                  <form action={publishProductAdminVersion}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit">Publish overlay revision</button>
                  </form>
                )}
              </article>
            ))}
            {!data?.length && <p>No product admin revisions yet.</p>}
          </div>
        )}
      </section>
    </>
  );
}
