import { notFound, redirect } from "next/navigation";
import { isUiLanguage } from "@/lib/i18n";

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  redirect("/" + lang + "/products");
}
