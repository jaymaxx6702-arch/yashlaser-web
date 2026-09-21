import { notFound } from "next/navigation";
import { Suspense } from "react";
import { TrackOrderClient } from "@/components/TrackOrderClient";
import { isUiLanguage } from "@/lib/i18n";

export const metadata = {
  title: "Track order",
  robots: { index: false, follow: false },
};

export default async function LocalizedTrackOrderPage({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  return (
    <main id="main-content" className="container section" lang={lang}>
      <Suspense fallback={<p>Loading…</p>}>
        <TrackOrderClient lang={lang} />
      </Suspense>
    </main>
  );
}
