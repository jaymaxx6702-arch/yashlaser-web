import { notFound } from "next/navigation";
import { InfoPage } from "@/components/InfoPage";
import { isUiLanguage } from "@/lib/i18n";

export default async function LocalizedPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  return <InfoPage page="shipping" lang={lang} />;
}
