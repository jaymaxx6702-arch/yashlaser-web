import { notFound } from "next/navigation";
import { Catalogue, type CatalogueParams } from "@/components/Catalogue";
import { isUiLanguage, uiCopy } from "@/lib/i18n";

export default async function LocalizedProductsPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<CatalogueParams>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  return (
    <Catalogue
      params={await searchParams}
      prefix={"/" + lang}
      copy={uiCopy[lang]}
      lang={lang}
    />
  );
}
