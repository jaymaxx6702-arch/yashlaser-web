import Link from "next/link";
import {
  categories,
  categoryHref,
  products,
  type Category,
} from "@/data/catalog";
import { ProductCard } from "./ProductCard";
export type CatalogueParams = {
  category?: string;
  q?: string;
  subcategory?: string;
  page?: string;
  legacyCategory?: string;
};
export function Catalogue({
  category,
  params,
}: {
  category?: Category;
  params: CatalogueParams;
}) {
  const base = category ? categoryHref(category.id) : "/products";
  const inCategory = products.filter(
    (p) => !category || p.categoryId === category.id,
  );
  const subcategories = [
    ...new Map(inCategory.map((p) => [p.subcategoryId, p.label])).entries(),
  ];
  const query =
    typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const filtered = inCategory.filter(
    (p) =>
      (!params.subcategory || p.subcategoryId === params.subcategory) &&
      (!params.legacyCategory ||
        p.source.categoryId === params.legacyCategory) &&
      (!query ||
        (p.name + " " + p.label + " " + p.description)
          .toLowerCase()
          .includes(query.toLowerCase())),
  );
  const pages = Math.max(1, Math.ceil(filtered.length / 24));
  const page = Math.max(
    1,
    Math.min(pages, Number.parseInt(params.page ?? "1", 10) || 1),
  );
  const href = (number: number) => {
    const search = new URLSearchParams();
    if (query) search.set("q", query);
    if (params.subcategory) search.set("subcategory", params.subcategory);
    if (params.legacyCategory)
      search.set("legacyCategory", params.legacyCategory);
    search.set("page", String(number));
    return base + "?" + search;
  };
  return (
    <main id="main-content" className="container catalogue-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/products">Collection</Link>
        {category && (
          <>
            <span>/</span>
            <span>{category.shortName}</span>
          </>
        )}
      </nav>
      <header className="catalogue-heading">
        <p className="eyebrow">Made personal. Since 1997.</p>
        <h1>{category?.name ?? "Our collection"}</h1>
        <p>
          {category?.description ??
            "Discover a starting point for your memories, milestones and identity."}
        </p>
      </header>
      <nav className="category-filters" aria-label="Product categories">
        <Link href="/products" className={!category ? "selected" : ""}>
          All products
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={categoryHref(c.id)}
            className={category?.id === c.id ? "selected" : ""}
          >
            {c.shortName}
          </Link>
        ))}
      </nav>
      <form action={base} className="catalogue-search">
        <label>
          Search products
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Name, code or occasion"
            maxLength={100}
          />
        </label>
        <label>
          Product type
          <select name="subcategory" defaultValue={params.subcategory ?? ""}>
            <option value="">All types</option>
            {subcategories.map(([id, label]) => (
              <option key={id} value={id}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {params.legacyCategory && (
          <input
            type="hidden"
            name="legacyCategory"
            value={params.legacyCategory}
          />
        )}
        <button className="button" type="submit">
          Find products
        </button>
      </form>
      <div className="results-heading">
        <h2>
          {filtered.length} {filtered.length === 1 ? "product" : "products"}
        </h2>
        <span>
          Page {page} of {pages}
        </span>
      </div>
      {filtered.length ? (
        <div className="product-grid catalogue-grid">
          {filtered.slice((page - 1) * 24, page * 24).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <p>No matching products. Try another search or product type.</p>
      )}
      <nav className="pagination" aria-label="Catalogue pages">
        {page > 1 && (
          <Link className="button button-secondary" href={href(page - 1)}>
            ← Previous
          </Link>
        )}
        {page < pages && (
          <Link className="button" href={href(page + 1)}>
            Next →
          </Link>
        )}
      </nav>
    </main>
  );
}
