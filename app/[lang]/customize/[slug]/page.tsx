import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findProduct } from "@/data/catalog";
import { CustomizationForm } from "@/components/CustomizationForm";
import { submissionEnabled } from "@/lib/supabase";
import { resolveSelection } from "@/lib/customization";
import { getPublishedCustomizationDefinition } from "@/lib/customization/server-rules";
import { isUiLanguage } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Personalise & enquire",
  robots: { index: false, follow: false },
};

const copy = {
  en: { personalise: "Personalise", eyebrow: "Your idea, made personal", title: "Make it yours." },
  gu: { personalise: "કસ્ટમાઇઝ", eyebrow: "તમારો વિચાર, તમારી રીતે", title: "તેને તમારું બનાવો." },
  hi: { personalise: "कस्टमाइज़", eyebrow: "आपका आइडिया, आपके लिए", title: "इसे अपना बनाएँ." },
  mr: { personalise: "कस्टमाइझ", eyebrow: "तुमची कल्पना, तुमच्यासाठी", title: "ते तुमचे बनवा." },
} as const;

export default async function LocalizedCustomizePage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<{
    variant?: string | string[];
    quantity?: string | string[];
  }>;
}) {
  const { lang, slug: productSlug } = await params;
  if (!isUiLanguage(lang)) notFound();
  const p = findProduct(productSlug);
  if (!p) notFound();

  const query = await searchParams;
  const customizationDefinition =
    await getPublishedCustomizationDefinition(p);
  const customizationProduct = {
    id: p.id,
    slug: p.slug,
    name: p.name,
    categoryId: p.categoryId,
    variants: p.variants,
    pricingMode: p.pricingMode,
    effectivePriceMinor: p.effectivePriceMinor,
    priceMinor: p.priceMinor,
    ...(customizationDefinition ? { customizationDefinition } : {}),
  };
  const selection = resolveSelection(
    customizationProduct,
    query.variant,
    query.quantity,
  );
  const t = copy[lang];
  const prefix = "/" + lang;
  const {
    id,
    slug,
    name,
    categoryId,
    variants,
    pricingMode,
    effectivePriceMinor,
    priceMinor,
  } = p;

  return (
    <main id="main-content" className="container customize-page" lang={lang}>
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={prefix + "/products/" + p.slug}>{p.name}</Link>
        <span>/</span>
        <span>{t.personalise}</span>
      </nav>
      <header className="catalogue-heading">
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.title}</h1>
        <p>{p.name}</p>
      </header>
      <CustomizationForm
        lang={lang}
        selectionOverrides={{
          ...(typeof query.variant === "string"
            ? { variantId: selection.variantId }
            : {}),
          ...(typeof query.quantity === "string"
            ? { quantity: selection.quantity }
            : {}),
        }}
        key={`${p.id}-${selection.variantId}-${selection.quantity}`}
        initialSelection={selection}
        product={customizationProduct}
        onlineSubmission={submissionEnabled()}
      />
    </main>
  );
}
