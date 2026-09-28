import type { Metadata } from "next";
import { languageAlternates } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Catalogue, type CatalogueParams } from "@/components/Catalogue";
import { categories } from "@/data/catalog";
import { categoryCopy, isUiLanguage, uiCopy } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string; slug: string }>;
}): Promise<Metadata> {
  const { lang, slug } = await params;
  if (!isUiLanguage(lang)) return { title: "Category not found" };
  const category = categories.find((item) => item.id === slug);
  if (!category) return { title: "Category not found" };
  const path = "/categories/" + category.id;
  const localized = categoryCopy[lang][category.id];
  return {
    title: localized.name,
    description: localized.description,
    alternates: {
      canonical: "/" + lang + path,
      languages: languageAlternates(path),
    },
  };
}

export default async function LocalizedCategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string; slug: string }>;
  searchParams: Promise<CatalogueParams>;
}) {
  const { lang, slug } = await params;
  if (!isUiLanguage(lang)) notFound();
  const category = categories.find((c) => c.id === slug);
  if (!category) notFound();
  return (
    <Catalogue
      category={category}
      params={await searchParams}
      prefix={"/" + lang}
      copy={uiCopy[lang]}
      lang={lang}
    />
  );
}
