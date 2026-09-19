import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

type EventRow = {
  event_name: string;
  path: string | null;
  product_id: string | null;
  search_query: string | null;
  result_count: number | null;
  created_at: string;
};

function topCounts(values: Array<string | null>, limit = 12) {
  const counts = new Map<string, number>();
  for (const value of values) {
    if (!value) continue;
    counts.set(value, (counts.get(value) || 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit);
}

export default async function SearchAnalyticsPage() {
  await requireAdmin();
  const db = getSupabase();
  const since = new Date(Date.now() - 30 * 86400000).toISOString();

  const { data, error } = await db
    .from("shop_analytics_events")
    .select(
      "event_name,path,product_id,search_query,result_count,created_at",
    )
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(5000);

  const rows = ((data || []) as EventRow[]);
  const count = (name: string) =>
    rows.filter((row) => row.event_name === name).length;
  const searches = rows.filter((row) => row.event_name === "search");

  const topSearches = topCounts(searches.map((row) => row.search_query));
  const topProducts = topCounts(
    rows
      .filter((row) => row.event_name === "product_view")
      .map((row) => row.product_id),
  );
  const zeroResultSearches = topCounts(
    searches
      .filter((row) => row.result_count === 0)
      .map((row) => row.search_query),
  );

  return (
    <>
      <h1>Search & commerce analytics</h1>
      <p>Last 30 days · first-party, privacy-light events only.</p>

      {error ? (
        <p role="alert">
          Analytics migration is not applied yet, or analytics could not be loaded.
        </p>
      ) : (
        <>
          <div className="admin-metrics">
            <article className="admin-card">
              <strong>{count("page_view")}</strong>
              <span>Page views</span>
            </article>
            <article className="admin-card">
              <strong>{count("product_view")}</strong>
              <span>Product views</span>
            </article>
            <article className="admin-card">
              <strong>{count("add_to_cart")}</strong>
              <span>Add to cart</span>
            </article>
            <article className="admin-card">
              <strong>{count("begin_checkout")}</strong>
              <span>Checkout starts</span>
            </article>
            <article className="admin-card">
              <strong>{count("search")}</strong>
              <span>Searches</span>
            </article>
          </div>

          <section className="admin-card">
            <h2>Top searches</h2>
            {topSearches.length ? (
              <ol>
                {topSearches.map(([query, hits]) => (
                  <li key={query}>
                    {query} · {hits}
                  </li>
                ))}
              </ol>
            ) : (
              <p>No search data yet.</p>
            )}
          </section>

          <section className="admin-card">
            <h2>Zero-result searches</h2>
            {zeroResultSearches.length ? (
              <ol>
                {zeroResultSearches.map(([query, hits]) => (
                  <li key={query}>
                    {query} · {hits}
                  </li>
                ))}
              </ol>
            ) : (
              <p>No zero-result searches yet.</p>
            )}
          </section>

          <section className="admin-card">
            <h2>Most viewed product IDs</h2>
            {topProducts.length ? (
              <ol>
                {topProducts.map(([productId, views]) => (
                  <li key={productId}>
                    {productId} · {views}
                  </li>
                ))}
              </ol>
            ) : (
              <p>No product-view data yet.</p>
            )}
          </section>
        </>
      )}
    </>
  );
}
