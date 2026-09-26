import { requireAdmin } from "@/lib/admin";
import { products } from "@/data/catalog";
import { getSupabase } from "@/lib/supabase";
import { categoryCustomizationDefinitions } from "@/lib/customization/contract";
import { publishCustomizationRule, saveCustomizationRuleDraft } from "./actions";

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
  const db = getSupabase();

  const { data, error } = await db
    .from("shop_customization_rules")
    .select("id,product_id,revision,status,definition,updated_at,published_at")
    .order("updated_at", { ascending: false })
    .limit(100);

  const selectedRows = (data ?? []).filter(
    (row) => !selected || row.product_id === selected,
  );
  const selectedProduct = products.find((product) => product.id === selected);
  const defaultDefinition =
    categoryCustomizationDefinitions[selectedProduct?.categoryId ?? "standees"];

  return (
    <>
      <header className="admin-top">
        <div>
          <h1>Customisation Rules</h1>
          <p className="muted">
            Save validated drafts first. Publishing archives the previous live
            revision for the same product.
          </p>
        </div>
      </header>

      {read("saved") === "1" && <p role="status">Draft saved.</p>}
      {read("published") === "1" && <p role="status">Rule published.</p>}

      <section className="admin-card">
        <h2>New rule draft</h2>
        <form action={saveCustomizationRuleDraft}>
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
          <label>
            Rule definition JSON
            <textarea
              name="definition"
              required
              rows={24}
              defaultValue={JSON.stringify(defaultDefinition, null, 2)}
            />
          </label>
          <p className="muted">
            The server validates this JSON against the same contract used by
            the customer customiser before it can be stored.
          </p>
          <button type="submit">Save draft revision</button>
        </form>
      </section>

      <section>
        <h2>Recent revisions</h2>
        {error ? (
          <p role="alert">
            Rule storage is not available yet. Apply the matching database
            migration before using this admin screen.
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
                  <summary>Definition</summary>
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
