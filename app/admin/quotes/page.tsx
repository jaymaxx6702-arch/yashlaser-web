import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { AdminQuoteCreator } from "@/components/AdminQuoteCreator";

export default async function AdminQuotesPage() {
  await requireAdmin();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_quotes")
    .select("id,quote_no,customer_name,customer_mobile,status,total_minor,valid_until,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <h1>Quotes</h1>
      <AdminQuoteCreator />
      {error ? (
        <p role="alert">Commerce migration is not applied yet, or quotes could not be loaded.</p>
      ) : (
        <div className="admin-list">
          {(data || []).map((quote) => (
            <article className="admin-card" key={quote.id}>
              <strong>{quote.quote_no} · {quote.status}</strong>
              <span>{quote.customer_name} · {quote.customer_mobile}</span>
              <span>
                {quote.valid_until
                  ? "Valid until " + quote.valid_until
                  : "No expiry set"}
              </span>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
