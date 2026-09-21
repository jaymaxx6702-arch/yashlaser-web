import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectRequestStatusClient } from "@/components/ProjectRequestStatusClient";
import { isUiLanguage } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Track project request",
  robots: { index: false, follow: false },
};

export default async function LocalizedProjectRequestStatusPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const query = await searchParams;
  const requestNo = typeof query.request === "string" ? query.request : "";
  const token = typeof query.token === "string" ? query.token : "";

  return (
    <main id="main-content" className="container section" lang={lang}>
      <ProjectRequestStatusClient
        lang={lang}
        initialRequestNo={requestNo}
        initialToken={token}
      />
    </main>
  );
}
