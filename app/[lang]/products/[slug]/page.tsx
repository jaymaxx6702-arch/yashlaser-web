import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, findProduct } from "@/data/catalog";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductOptions } from "@/components/ProductOptions";
import { isUiLanguage, uiCopy } from "@/lib/i18n";

export default async function LocalizedProductPage({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}) {
  const { lang, slug } = await params;
  if (!isUiLanguage(lang)) notFound();
  const product = findProduct(slug);
  if (!product) notFound();
  const category = categories.find((c) => c.id === product.categoryId)!;
  const copy = uiCopy[lang];
  const prefix = "/" + lang;

  return (
    <main id="main-content" className="container detail-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={prefix + "/products"}>{copy.collection}</Link>
        <span>/</span>
        <Link href={prefix + "/categories/" + category.id}>
          {category.shortName}
        </Link>
        <span>/</span>
        <span>{product.name}</span>
      </nav>

      <div className="detail-grid">
        <ProductGallery images={product.images} name={product.name} />
        <section className="detail-copy">
          <p className="eyebrow">{product.label}</p>
          <h1>{product.name}</h1>
          <p>{product.description}</p>
          <ProductOptions
            product={{
              id: product.id,
              slug: product.slug,
              name: product.name,
              categoryId: product.categoryId,
              variants: product.variants,
              pricingMode: product.pricingMode,
              effectivePriceMinor: product.effectivePriceMinor,
              priceMinor: product.priceMinor,
            }}
          />
          <h2>{copy.sizesOptions}</h2>
          <p>{product.variants.map((v) => v.name).join(" · ") || "Please confirm size."}</p>
          <h2>{copy.customisation}</h2>
          <p>
            Photo, name, message, logo and design options are confirmed before production.
          </p>
          <h2>{copy.productInfo}</h2>
          <p className="preserve-lines">{product.details || product.description}</p>
        </section>
      </div>
    </main>
  );
}
