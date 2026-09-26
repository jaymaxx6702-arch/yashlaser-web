import Link from "next/link";
import { products } from "@/data/catalog";
import { requireAdmin } from "@/lib/admin";
import { getCustomizationDefinition } from "@/lib/customization/contract";
import { getCustomizationRuleState } from "@/lib/customization/rules-server";
import { CustomizationRuleBuilder } from "@/components/CustomizationRuleBuilder";

export default async function AdminCustomizationRulesPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const read = (key: string) =>
    typeof params[key] === "string" ? String(params[key]) : "";
  const q = read("q").trim().slice(0, 100).toLowerCase();
  const selectedId = read("product");

  const matches = products
    .filter((product) => {
      if (!q) return true;
      return [product.id, product.slug, product.name]
        .join(" ")
        .toLowerCase()
        .includes(q);
    })
    .slice(0, 30);

  const selected = products.find((product) => product.id === selectedId) ?? null;
  let state:
    | Awaited<ReturnType<typeof getCustomizationRuleState>>
    | null = null;
  let storageError = "";

  if (selected) {
    try {
      state = await getCustomizationRuleState(selected.id);
    } catch (error) {
      storageError =
        error instanceof Error
          ? error.message
          : "Customization rule storage is unavailable.";
    }
  }

  const initialDefinition = selected
    ? state?.latestDraft?.definition ??
      state?.published?.definition ??
      getCustomizationDefinition(selected)
    : null;

  return (
    <>
      <h1>Customization Rules</h1>
      <p>
        Configure product-specific customer fields using the shared validated
        customization contract. Drafts do not change the storefront.
      </p>

      <form className="admin-card admin-filters">
        <label>
          Find product
          <input
            name="q"
            defaultValue={q}
            placeholder="Product name, slug or yl- ID"
            maxLength={100}
          />
        </label>
        <button>Search</button>
        <Link href="/admin/customization-rules">Clear</Link>
      </form>

      <div className="admin-rule-products">
        {matches.map((product) => (
          <Link
            className="admin-card"
            key={product.id}
            href={
              "/admin/customization-rules?" +
              new URLSearchParams({
                ...(q ? { q } : {}),
                product: product.id,
              })
            }
          >
            <strong>{product.name}</strong>
            <span>{product.id}</span>
            <small>
              {product.categoryId} · {product.pricingMode}
            </small>
          </Link>
        ))}
      </div>
      {!matches.length && <p>No matching products.</p>}

      {selected && initialDefinition && (
        <>
          <div className="admin-card">
            <strong>{selected.name}</strong>
            <p>
              {selected.id} · {selected.categoryId} · {selected.slug}
            </p>
            {storageError && (
              <p role="alert">
                Rule storage is not available yet. The builder below is showing
                category defaults; saving requires migration
                202609260016_customization_rules.sql.
              </p>
            )}
          </div>
          <CustomizationRuleBuilder
            productId={selected.id}
            initialDefinition={initialDefinition}
            latestDraftRevision={state?.latestDraft?.revision}
            publishedRevision={state?.published?.revision}
          />
        </>
      )}
    </>
  );
}
