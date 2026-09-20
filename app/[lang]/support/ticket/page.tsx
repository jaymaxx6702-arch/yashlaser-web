import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SupportTicketClient } from "@/components/SupportTicketClient";
import { isUiLanguage } from "@/lib/i18n";

export const metadata: Metadata = {
  title: "Track support ticket",
  robots: { index: false, follow: false },
};

export default async function LocalizedSupportTicketPage({
  params,
  searchParams,
}: {
  params: Promise<{ lang: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const query = await searchParams;
  const ticket = typeof query.ticket === "string" ? query.ticket : "";
  const token = typeof query.token === "string" ? query.token : "";

  return (
    <main id="main-content" className="container section" lang={lang}>
      <SupportTicketClient
        lang={lang}
        initialTicketNo={ticket}
        initialToken={token}
      />
    </main>
  );
}
