import type { Metadata } from "next";
import { languageAlternates } from "@/lib/seo";
import { notFound } from "next/navigation";
import { Catalogue, type CatalogueParams } from "@/components/Catalogue";
import { isUiLanguage, uiCopy } from "@/lib/i18n";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ lang: string }>;
}): Promise<Metadata> {
  const { lang } = await params;
  if (!isUiLanguage(lang)) return { title: "Page not found" };
  return {
    title: uiCopy[lang].collection,
    description:
      lang === "gu"
        ? "Yash Laserની વ્યક્તિગત પ્રોડક્ટ્સનું કલેક્શન જુઓ."
        : lang === "hi"
          ? "Yash Laser के व्यक्तिगत प्रोडक्ट का कलेक्शन देखें."
          : lang === "mr"
            ? "Yash Laserचे वैयक्तिक प्रॉडक्ट कलेक्शन पहा."
            : "Explore Yash Laser personalised products.",
    alternates: {
      canonical: "/" + lang + "/products",
      languages: languageAlternates("/products"),
    },
  };
}

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
