import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { findProduct } from "@/data/catalog";
import { CustomizationForm } from "@/components/CustomizationForm";
import { submissionEnabled } from "@/lib/supabase";
import { resolveSelection } from "@/lib/customization";
export const dynamic = "force-dynamic";
export const metadata: Metadata = {
  title: "Personalise & enquire",
  robots: { index: false, follow: false },
};
export default async function CustomizePage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{
    variant?: string | string[];
    quantity?: string | string[];
  }>;
}) {
  const p = findProduct((await params).slug);
  if (!p) notFound();
  const query = await searchParams;
  const selection = resolveSelection(p, query.variant, query.quantity);
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
    <main id="main-content" className="container customize-page">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href={"/products/" + p.slug}>{p.name}</Link>
        <span>/</span>
        <span>Personalise</span>
      </nav>
      <header className="catalogue-heading">
        <p className="eyebrow">Your idea, made personal</p>
        <h1>Make it yours.</h1>
        <p>{p.name}</p>
      </header>
      <CustomizationForm
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
        product={{
          id,
          slug,
          name,
          categoryId,
          variants,
          pricingMode,
          effectivePriceMinor,
          priceMinor,
        }}
        onlineSubmission={submissionEnabled()}
      />
    </main>
  );
}
