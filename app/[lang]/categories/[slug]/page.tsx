import { notFound } from "next/navigation";
import { Catalogue, type CatalogueParams } from "@/components/Catalogue";
import { categories } from "@/data/catalog";
import { isUiLanguage, uiCopy } from "@/lib/i18n";

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
    />
  );
}
