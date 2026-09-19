import { notFound } from "next/navigation";
import { getQuoteByToken } from "@/lib/quote-server";
import { QuoteActions } from "@/components/QuoteActions";

export const metadata = {
  title: "Quote",
  robots: { index: false, follow: false },
};

export default async function QuotePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const quote = await getQuoteByToken(token);
  if (!quote) notFound();

  const money = (minor: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(minor / 100);

  return (
    <main id="main-content" className="container section text-page">
      <p className="eyebrow">{quote.quote_no}</p>
      <h1>Your quotation.</h1>
      <p>
        Status: <strong>{quote.status}</strong>
        {quote.valid_until ? " · Valid until " + quote.valid_until : ""}
      </p>
      <div className="admin-card">
        <pre>{JSON.stringify(quote.items, null, 2)}</pre>
      </div>
      {quote.total_minor != null && (
        <h2>Total: {money(quote.total_minor)}</h2>
      )}
      {quote.notes && <p>{quote.notes}</p>}
      <QuoteActions token={token} canAccept={quote.status === "sent"} />
    </main>
  );
}
