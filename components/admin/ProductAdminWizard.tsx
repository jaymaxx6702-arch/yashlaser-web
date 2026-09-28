"use client";

import { useMemo, useState } from "react";
import { saveProductAdminDraft } from "@/app/admin/products/actions";
import type { CategoryId } from "@/data/catalog";
import {
  slugifyAdminProduct,
  type ProductAdminDraft,
  type ProductAdminVariant,
} from "@/lib/product-admin";

function rupeesToMinor(value: string) {
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? Math.round(n * 100) : 0;
}

function minorToRupees(value: number) {
  return (value / 100).toFixed(2);
}

function emptyVariant(index: number): ProductAdminVariant {
  return {
    id: "variant-" + (index + 1),
    name: "Option " + (index + 1),
    priceMinor: 0,
    effectivePriceMinor: 0,
    available: true,
  };
}

export function ProductAdminWizard({
  initial,
  categories,
}: {
  initial: ProductAdminDraft;
  categories: readonly { id: CategoryId; name: string }[];
}) {
  const [draft, setDraft] = useState<ProductAdminDraft>(initial);
  const [step, setStep] = useState(1);
  const validation = useMemo(() => {
    const issues: string[] = [];
    if (!draft.productKey) issues.push("Product key is required.");
    if (!draft.name) issues.push("Product name is required.");
    if (!draft.slug) issues.push("Slug is required.");
    if (
      draft.pricingMode !== "quote_required" &&
      !draft.variants.length &&
      draft.effectivePriceMinor < 1
    )
      issues.push("Add a price or at least one variant.");
    if (draft.variants.some((v) => !v.id || !v.name))
      issues.push("Every variant needs an ID and name.");
    return issues;
  }, [draft]);

  function updateVariant(index: number, patch: Partial<ProductAdminVariant>) {
    setDraft({
      ...draft,
      variants: draft.variants.map((variant, i) =>
        i === index ? { ...variant, ...patch } : variant,
      ),
    });
  }

  return (
    <form action={saveProductAdminDraft}>
      <input type="hidden" name="product" value={JSON.stringify(draft)} />

      <div className="editor-toolbar">
        {[1, 2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            aria-current={step === n ? "step" : undefined}
            onClick={() => setStep(n)}
          >
            {n}. {["Basics", "Pricing", "Content", "Review"][n - 1]}
          </button>
        ))}
      </div>

      {step === 1 && (
        <section className="admin-card">
          <h2>1. Product basics</h2>
          <div className="option-fields">
            <label>
              Product key
              <input
                value={draft.productKey}
                maxLength={120}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    productKey: slugifyAdminProduct(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Product name
              <input
                value={draft.name}
                maxLength={180}
                onChange={(e) => {
                  const name = e.target.value;
                  setDraft({
                    ...draft,
                    name,
                    slug:
                      draft.slug === slugifyAdminProduct(draft.name)
                        ? slugifyAdminProduct(name)
                        : draft.slug,
                  });
                }}
              />
            </label>
            <label>
              URL slug
              <input
                value={draft.slug}
                maxLength={120}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    slug: slugifyAdminProduct(e.target.value),
                  })
                }
              />
            </label>
            <label>
              Category
              <select
                value={draft.categoryId}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    categoryId: e.target.value as CategoryId,
                  })
                }
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Subcategory ID
              <input
                value={draft.subcategoryId ?? ""}
                maxLength={120}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    subcategoryId: slugifyAdminProduct(e.target.value) || undefined,
                  })
                }
              />
            </label>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="admin-card">
          <h2>2. Pricing and variants</h2>
          <div className="option-fields">
            <label>
              Pricing mode
              <select
                value={draft.pricingMode}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    pricingMode: e.target.value as ProductAdminDraft["pricingMode"],
                  })
                }
              >
                <option value="fixed">Fixed price</option>
                <option value="from">From price</option>
                <option value="quote_required">Quote required</option>
              </select>
            </label>
            <label>
              Regular price (₹)
              <input
                type="number"
                min={0}
                step="0.01"
                value={minorToRupees(draft.priceMinor)}
                onChange={(e) =>
                  setDraft({ ...draft, priceMinor: rupeesToMinor(e.target.value) })
                }
              />
            </label>
            <label>
              Selling price (₹)
              <input
                type="number"
                min={0}
                step="0.01"
                value={minorToRupees(draft.effectivePriceMinor)}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    effectivePriceMinor: rupeesToMinor(e.target.value),
                  })
                }
              />
            </label>
          </div>

          <h3>Variants</h3>
          <div className="admin-list">
            {draft.variants.map((variant, index) => (
              <article className="admin-card" key={variant.id + "-" + index}>
                <div className="option-fields">
                  <label>
                    Variant ID
                    <input
                      value={variant.id}
                      maxLength={80}
                      onChange={(e) =>
                        updateVariant(index, {
                          id: e.target.value.replace(/[^a-zA-Z0-9-]/g, "").slice(0, 80),
                        })
                      }
                    />
                  </label>
                  <label>
                    Variant name
                    <input
                      value={variant.name}
                      maxLength={100}
                      onChange={(e) =>
                        updateVariant(index, { name: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Regular price (₹)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={minorToRupees(variant.priceMinor)}
                      onChange={(e) =>
                        updateVariant(index, {
                          priceMinor: rupeesToMinor(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label>
                    Selling price (₹)
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={minorToRupees(variant.effectivePriceMinor)}
                      onChange={(e) =>
                        updateVariant(index, {
                          effectivePriceMinor: rupeesToMinor(e.target.value),
                        })
                      }
                    />
                  </label>
                  <label className="consent">
                    <input
                      type="checkbox"
                      checked={variant.available}
                      onChange={(e) =>
                        updateVariant(index, { available: e.target.checked })
                      }
                    />
                    <span>Available</span>
                  </label>
                </div>
                <button
                  type="button"
                  className="text-link"
                  onClick={() =>
                    setDraft({
                      ...draft,
                      variants: draft.variants.filter((_, i) => i !== index),
                    })
                  }
                >
                  Remove variant
                </button>
              </article>
            ))}
          </div>
          <button
            type="button"
            onClick={() =>
              setDraft({
                ...draft,
                variants: [...draft.variants, emptyVariant(draft.variants.length)],
              })
            }
          >
            Add variant
          </button>
        </section>
      )}

      {step === 3 && (
        <section className="admin-card">
          <h2>3. Customer-facing content</h2>
          <label>
            Short description
            <textarea
              rows={5}
              value={draft.description}
              maxLength={4000}
              onChange={(e) =>
                setDraft({ ...draft, description: e.target.value })
              }
            />
          </label>
          <label>
            Product details
            <textarea
              rows={9}
              value={draft.details}
              maxLength={12000}
              onChange={(e) => setDraft({ ...draft, details: e.target.value })}
            />
          </label>
          <p className="muted">
            Images, weights, shipping class and production lead time stay outside
            this first wizard foundation until YL-013 to YL-018 business data is
            verified.
          </p>
        </section>
      )}

      {step === 4 && (
        <section className="admin-card">
          <h2>4. Validate and save</h2>
          {validation.length ? (
            <div role="alert">
              <strong>Fix before saving:</strong>
              <ul>
                {validation.map((issue) => (
                  <li key={issue}>{issue}</li>
                ))}
              </ul>
            </div>
          ) : (
            <p role="status">Draft passes the basic wizard checks.</p>
          )}
          <dl>
            <dt>Name</dt><dd>{draft.name}</dd>
            <dt>Slug</dt><dd>{draft.slug}</dd>
            <dt>Category</dt><dd>{draft.categoryId}</dd>
            <dt>Pricing</dt><dd>{draft.pricingMode}</dd>
            <dt>Variants</dt><dd>{draft.variants.length}</dd>
          </dl>
          <p className="muted">
            Saving creates a private versioned draft. Publishing does not yet
            override the generated storefront catalogue.
          </p>
          <button type="submit" disabled={validation.length > 0}>
            Save draft revision
          </button>
        </section>
      )}
    </form>
  );
}
