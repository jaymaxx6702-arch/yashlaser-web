import Link from "next/link";
import { notFound } from "next/navigation";
import { categories, findProduct } from "@/data/catalog";
import { ProductGallery } from "@/components/ProductGallery";
import { ProductOptions } from "@/components/ProductOptions";
import { categoryCopy, isUiLanguage, uiCopy } from "@/lib/i18n";
import { ProductViewAnalytics } from "@/components/Analytics";
import { languageAlternates } from "@/lib/seo";
import type { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isUiLanguage(lang)) return { title: "Product not found" };
  const product = findProduct(slug);
  if (!product) return { title: "Product not found" };
  const path = "/products/" + product.slug;
  return {
    title: product.name,
    description: product.description.slice(0, 160),
    alternates: {
      canonical: path,
      languages: languageAlternates(path),
    },
  };
}

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
      <ProductViewAnalytics productId={product.id} path={prefix + "/products/" + product.slug} />
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={prefix + "/products"}>{copy.collection}</Link>
        <span>/</span>
        <Link href={prefix + "/categories/" + category.id}>
          {categoryCopy[lang][category.id].shortName}
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
          <p>
            {product.variants.map((v) => v.name).join(" · ") ||
              (lang === "gu"
                ? "સાઇઝ કન્ફર્મ કરો."
                : lang === "hi"
                  ? "साइज़ कन्फर्म करें।"
                  : lang === "mr"
                    ? "साइझ निश्चित करा."
                    : "Please confirm size.")}
          </p>
          <h2>{copy.customisation}</h2>
          <p>
            {lang === "gu"
              ? "ફોટો, નામ, મેસેજ, લોગો અને ડિઝાઇનના વિકલ્પો ઉત્પાદન પહેલાં કન્ફર્મ કરવામાં આવશે."
              : lang === "hi"
                ? "फोटो, नाम, संदेश, लोगो और डिज़ाइन विकल्प उत्पादन से पहले कन्फर्म किए जाएंगे।"
                : lang === "mr"
                  ? "फोटो, नाव, संदेश, लोगो आणि डिझाइन पर्याय उत्पादनापूर्वी निश्चित केले जातील."
                  : "Photo, name, message, logo and design options are confirmed before production."}
          </p>
          <h2>{copy.productInfo}</h2>
          <p className="preserve-lines">{product.details || product.description}</p>
        </section>
      </div>
    </main>
  );
}
