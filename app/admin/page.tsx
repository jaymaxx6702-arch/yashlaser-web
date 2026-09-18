import Link from "next/link";
import { requireAdmin, statuses } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { logout } from "./actions";
export default async function Admin({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await requireAdmin();
  const params = await searchParams;
  const read = (k: string) =>
    typeof params[k] === "string" ? (params[k] as string) : "";
  const q = read("q")
    .slice(0, 100)
    .replace(/[^\p{L}\p{N} +@_-]/gu, "");
  const status = read("status"),
    from = read("from"),
    to = read("to");
  const page = Math.max(1, Math.min(10000, Number.parseInt(read("page")) || 1));
  const db = getSupabase();
  let query = db
    .from("enquiries")
    .select("id,reference,customer_name,phone,status,created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });
  if (q)
    query = query.or(
      `reference.ilike.%${q}%,customer_name.ilike.%${q}%,phone.ilike.%${q}%`,
    );
  if (Object.hasOwn(statuses, status)) query = query.eq("status", status);
  const validDate = (s: string) =>
    /^\d{4}-\d{2}-\d{2}$/.test(s) && Number.isFinite(Date.parse(s));
  if (validDate(from))
    query = query.gte("created_at", `${from}T00:00:00+05:30`);
  if (validDate(to))
    query = query.lte("created_at", `${to}T23:59:59.999+05:30`);
  const { data, error, count } = await query.range(
    (page - 1) * 25,
    page * 25 - 1,
  );
  const pageLink = (p: number) =>
    "/admin?" + new URLSearchParams({ q, status, from, to, page: String(p) });
  return (
    <>
      <header className="admin-top">
        <h1>Enquiries</h1>
        <form action={logout}>
          <button>Sign out</button>
        </form>
      </header>
      <form className="admin-card admin-filters">
        <label>
          Reference, name or phone
          <input name="q" defaultValue={q} maxLength={100} />
        </label>
        <label>
          Status
          <select name="status" defaultValue={status}>
            <option value="">All statuses</option>
            {Object.entries(statuses).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          From (IST)
          <input type="date" name="from" defaultValue={from} />
        </label>
        <label>
          To (IST)
          <input type="date" name="to" defaultValue={to} />
        </label>
        <button>Search</button>
        <Link href="/admin">Clear</Link>
      </form>
      {error ? (
        <p role="alert">
          Unable to load enquiries. Check database setup and try again.
        </p>
      ) : (
        <>
          <p>
            {count ?? 0} matching enquiries · Page {page}
          </p>
          <div className="admin-list">
            {data?.map((e) => (
              <Link
                className="admin-card"
                key={e.id}
                href={`/admin/enquiries/${e.id}`}
              >
                <strong>{e.reference}</strong>
                <span>
                  {e.customer_name} · {e.phone}
                </span>
                <span>
                  {statuses[e.status as keyof typeof statuses] || e.status}
                </span>
                <small>
                  {new Date(e.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}{" "}
                  IST
                </small>
              </Link>
            ))}
          </div>
          {!data?.length && <p>No matching enquiries.</p>}
          <nav className="admin-top">
            {page > 1 && <Link href={pageLink(page - 1)}>← Previous</Link>}
            {page * 25 < (count || 0) && (
              <Link href={pageLink(page + 1)}>Next →</Link>
            )}
          </nav>
        </>
      )}
    </>
  );
}
