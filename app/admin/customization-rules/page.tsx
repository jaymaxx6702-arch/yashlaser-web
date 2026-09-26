import { requireAdmin } from "@/lib/admin";
import { products } from "@/data/catalog";
import { getSupabase } from "@/lib/supabase";
import {
  categoryCustomizationDefinitions,
  validateCustomizationDefinition,
} from "@/lib/customization/contract";
import { CustomizationRuleBuilder } from "@/components/admin/CustomizationRuleBuilder";
import { publishCustomizationRule } from "./actions";

export default async function CustomizationRulesAdmin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const read = (key: string) =>
    typeof params[key] === "string" ? String(params[key]) : "";
  const selected = read("product_id").slice(0, 160);
  const selectedProduct = products.find((product) => product.id === selected);
  const db = getSupabase();

  const { data, error } = await db
    .from("shop_customization_rules")
    .select("id,product_id,revision,status,definition,updated_at,published_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const selectedRows = (data ?? []).filter(
    (row) => !selected || row.product_id === selected,
  );

  let initialDefinition = selectedProduct
    ? categoryCustomizationDefinitions[selectedProduct.categoryId]
    : categoryCustomizationDefinitions.standees;

  if (selectedProduct && selectedRows.length) {
    try {
      const candidate = validateCustomizationDefinition(
        selectedRows[0].definition,
      );
      if (candidate.categoryId === selectedProduct.categoryId)
        initialDefinition = candidate;
    } catch {
      // Keep the known-safe category definition if a stored row is invalid.
    }
  }

  return (
    <>
      <header className="admin-top">
        <div>
          <h1>Customisation Rules</h1>
          <p className="muted">
            Build and save a draft first. Publishing is a separate action and
            replaces the previous live revision atomically.
          </p>
        </div>
      </header>

      {read("saved") === "1" && <p role="status">Draft saved.</p>}
      {read("published") === "1" && <p role="status">Rule published.</p>}

      <section className="admin-card">
        <h2>Select product</h2>
        <form method="get">
          <label>
            Product ID
            <input
              name="product_id"
              required
              maxLength={160}
              defaultValue={selected}
              placeholder="yl-..."
              list="customization-products"
            />
            <datalist id="customization-products">
              {products.map((product) => (
                <option key={product.id} value={product.id}>
                  {product.name}
                </option>
              ))}
            </datalist>
          </label>
          <button type="submit">Load product</button>
        </form>
      </section>

      {selected && !selectedProduct && (
        <p role="alert">That product ID is not in the current catalogue.</p>
      )}

      {selectedProduct && (
        <section className="admin-card">
          <h2>Build rule draft</h2>
          {error && (
            <p role="alert">
              Rule storage is not available yet. The builder can be reviewed,
              but apply the matching database migration before saving.
            </p>
          )}
          <CustomizationRuleBuilder
            key={selectedProduct.id}
            productId={selectedProduct.id}
            productName={selectedProduct.name}
            initialDefinition={initialDefinition}
          />
        </section>
      )}

      <section>
        <h2>{selected ? "Product revisions" : "Recent revisions"}</h2>
        {error ? (
          <p role="alert">
            Rule revisions are unavailable until the database migration is
            applied.
          </p>
        ) : (
          <div className="admin-list">
            {selectedRows.map((row) => (
              <article className="admin-card" key={row.id}>
                <strong>
                  {row.product_id} · revision {row.revision}
                </strong>
                <span>Status: {row.status}</span>
                <small>
                  Updated{" "}
                  {new Date(row.updated_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </small>
                <details>
                  <summary>Definition JSON</summary>
                  <pre>{JSON.stringify(row.definition, null, 2)}</pre>
                </details>
                {row.status === "draft" && (
                  <form action={publishCustomizationRule}>
                    <input type="hidden" name="id" value={row.id} />
                    <button type="submit">Publish this revision</button>
                  </form>
                )}
              </article>
            ))}
            {!selectedRows.length && <p>No rule revisions found.</p>}
          </div>
        )}
      </section>
    </>
  );
}
