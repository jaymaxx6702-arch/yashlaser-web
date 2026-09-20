import { notFound } from "next/navigation";
import { CheckoutClient } from "@/components/CheckoutClient";
import { isUiLanguage } from "@/lib/i18n";

export default async function LocalizedCheckoutPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  return (
    <main id="main-content" className="container section" lang={lang}>
      <CheckoutClient lang={lang} />
    </main>
  );
}
