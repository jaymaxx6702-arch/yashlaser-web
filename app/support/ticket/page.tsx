import type { Metadata } from "next";
import { SupportTicketClient } from "@/components/SupportTicketClient";

export const metadata: Metadata = {
  title: "Track support ticket",
  robots: { index: false, follow: false },
};

export default async function SupportTicketPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const ticket = typeof query.ticket === "string" ? query.ticket : "";
  const token = typeof query.token === "string" ? query.token : "";

  return (
    <main id="main-content" className="container section">
      <SupportTicketClient initialTicketNo={ticket} initialToken={token} />
    </main>
  );
}
