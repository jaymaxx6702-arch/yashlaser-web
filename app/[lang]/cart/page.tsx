import { notFound } from "next/navigation";
import { CartPageClient } from "@/components/CartPageClient";
import { isUiLanguage } from "@/lib/i18n";

export const metadata = {
  title: "Cart",
  robots: { index: false, follow: false },
};

export default async function LocalizedCartPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  return (
    <main id="main-content" className="container section" lang={lang}>
      <CartPageClient lang={lang} />
    </main>
  );
}
