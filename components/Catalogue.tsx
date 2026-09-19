import Link from "next/link";
import {
  categories,
  categoryHref,
  products,
  type Category,
} from "@/data/catalog";
import { ProductCard } from "./ProductCard";
import { uiCopy, type UiCopy } from "@/lib/i18n";
import { SearchAnalytics } from "@/components/Analytics";

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
  prefix = "",
  copy = uiCopy.en,
}: {
  category?: Category;
  params: CatalogueParams;
  prefix?: string;
  copy?: UiCopy;
}) {
  const base = prefix + (category ? categoryHref(category.id) : "/products");
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
    <>
      {query && (
        <SearchAnalytics
          query={query}
          resultCount={filtered.length}
          path={base}
        />
      )}
      <main id="main-content" className="container catalogue-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={prefix + "/"}>{copy.home}</Link>
        <span>/</span>
        <Link href={prefix + "/products"}>{copy.collection}</Link>
        {category && (
          <>
            <span>/</span>
            <span>{category.shortName}</span>
          </>
        )}
      </nav>

      <header className="catalogue-heading">
        <p className="eyebrow">{copy.madePersonal}</p>
        <h1>{category?.name ?? copy.collection}</h1>
        <p>
          {category?.description ??
            "Discover a starting point for your memories, milestones and identity."}
        </p>
      </header>

      <nav className="category-filters" aria-label="Product categories">
        <Link href={prefix + "/products"} className={!category ? "selected" : ""}>
          {copy.allProducts}
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={prefix + categoryHref(c.id)}
            className={category?.id === c.id ? "selected" : ""}
          >
            {c.shortName}
          </Link>
        ))}
      </nav>

      <form action={base} className="catalogue-search">
        <label>
          {copy.searchProducts}
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder={copy.searchProducts}
            maxLength={100}
          />
        </label>
        <label>
          {copy.productType}
          <select name="subcategory" defaultValue={params.subcategory ?? ""}>
            <option value="">{copy.allTypes}</option>
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
          {copy.findProducts}
        </button>
      </form>

      <div className="results-heading">
        <h2>
          {filtered.length}{" "}
          {filtered.length === 1 ? copy.productSingular : copy.productPlural}
        </h2>
        <span>
          {copy.page} {page} {copy.of} {pages}
        </span>
      </div>

      {filtered.length ? (
        <div className="product-grid catalogue-grid">
          {filtered.slice((page - 1) * 24, page * 24).map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              prefix={prefix}
              actionLabel={copy.personalise}
            />
          ))}
        </div>
      ) : (
        <p>{copy.noMatching}</p>
      )}

      <nav className="pagination" aria-label="Catalogue pages">
        {page > 1 && (
          <Link className="button button-secondary" href={href(page - 1)}>
            ← {copy.previous}
          </Link>
        )}
        {page < pages && (
          <Link className="button" href={href(page + 1)}>
            {copy.next} →
          </Link>
        )}
      </nav>
      </main>
    </>
  );
}
