import { notFound } from "next/navigation";
import { ReviewsClient } from "@/components/ReviewsClient";
import { isUiLanguage } from "@/lib/i18n";

export default async function LocalizedReviewsPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  return (
    <main id="main-content" className="container section text-page" lang={lang}>
      <ReviewsClient lang={lang} />
    </main>
  );
}
