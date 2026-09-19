import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  categories,
  categoryHref,
  findProduct,
  money,
  productHref,
  products,
} from "@/data/catalog";
import { business } from "@/data/business";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductOptions } from "@/components/ProductOptions";
import { ProductViewAnalytics } from "@/components/Analytics";
import { languageAlternates } from "@/lib/seo";
export const dynamicParams = false;
export function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const p = findProduct((await params).slug);
  if (!p) return { title: "Product not found" };
  return {
    title: p.name,
    description: p.description.slice(0, 160),
    alternates: {
      canonical: productHref(p),
      languages: languageAlternates(productHref(p)),
    },
    openGraph: {
      title: p.name,
      description: p.description.slice(0, 160),
      images: p.images[0]?.src ? [p.images[0].src] : [],
    },
  };
}
export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const p = findProduct((await params).slug);
  if (!p) notFound();
  const category = categories.find((c) => c.id === p.categoryId)!;
  const structured = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: p.description,
    image: p.images.filter((i) => i.src).map((i) => business.url + i.src),
    brand: { "@type": "Brand", name: business.name },
    url: business.url + productHref(p),
  };
  return (
    <main id="main-content" className="container detail-page">
      <ProductViewAnalytics productId={p.id} path={productHref(p)} />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(structured).replace(/</g, "\\u003c"),
        }}
      />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/products">Collection</Link>
        <span>/</span>
        <Link href={categoryHref(category.id)}>{category.shortName}</Link>
        <span>/</span>
        <span>{p.name}</span>
      </nav>
      <div className="detail-grid">
        <ProductGallery images={p.images} name={p.name} />
        <section className="detail-copy">
          <p className="eyebrow">{p.label}</p>
          <h1>{p.name}</h1>
          <p>{p.description}</p>
          <ProductOptions
            product={{
              id: p.id,
              slug: p.slug,
              name: p.name,
              categoryId: p.categoryId,
              variants: p.variants,
              pricingMode: p.pricingMode,
              effectivePriceMinor: p.effectivePriceMinor,
              priceMinor: p.priceMinor,
            }}
          />
          <div className="process-note">
            Enquiry → WhatsApp communication → digital mockup approval →
            production / delivery
          </div>
          <h2>Sizes & options</h2>
          {p.variants.length ? (
            <div className="variant-list">
              {p.variants.map((v) => (
                <div key={v.id}>
                  <span>
                    {v.name}
                    {!v.available && " · Confirm availability"}
                  </span>
                  <span>
                    {p.pricingMode === "quote_required" ||
                    !v.effectivePriceMinor ? (
                      "Enquire"
                    ) : (
                      <>
                        {v.priceMinor > v.effectivePriceMinor && (
                          <del>{money(v.priceMinor)}</del>
                        )}{" "}
                        {money(v.effectivePriceMinor)}
                      </>
                    )}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p>Size and configuration will be confirmed with your enquiry.</p>
          )}
          {p.reviewFlags.includes("size-unit-unconfirmed") && (
            <p className="muted">
              Please confirm dimensions and units with our team before
              production.
            </p>
          )}
          <h2>Customisation</h2>
          <p>
            {p.categoryId === "standees"
              ? "Add your photograph and an optional message."
              : "Share your name, message, logo or design request."}{" "}
            A digital mockup is shared for approval before production.
          </p>
          <h2>Product information</h2>
          <p className="preserve-lines">{p.details || p.description}</p>
          {p.contentReview && (
            <p className="muted">
              Please confirm material, dimensions and design details with our
              team.
            </p>
          )}
        </section>
      </div>
    </main>
  );
}
