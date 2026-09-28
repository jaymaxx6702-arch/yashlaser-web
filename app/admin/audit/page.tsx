import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{
  action?: string;
  entity?: string;
}>;

export default async function AdminAuditPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  await requireAdmin();
  const params = await searchParams;
  const action = (params.action || "").trim().slice(0, 120);
  const entity = (params.entity || "").trim().slice(0, 80);

  let query = getSupabase()
    .from("shop_admin_audit_events")
    .select(
      "id,admin_user_id,action,entity_type,entity_id,payload,created_at",
    )
    .order("created_at", { ascending: false })
    .limit(250);

  if (action) query = query.ilike("action", "%" + action + "%");
  if (entity) query = query.eq("entity_type", entity);

  const { data, error } = await query;

  return (
    <>
      <section className="admin-card">
        <p className="eyebrow">Security</p>
        <h1>Admin Audit Log</h1>
        <p className="muted">
          Recent privileged admin mutations. Audit failures never roll back a
          successful business action, so this is an operational/security ledger,
          not the source of truth.
        </p>
        <form className="admin-top" method="get">
          <label>
            Action contains
            <input name="action" defaultValue={action} maxLength={120} />
          </label>
          <label>
            Entity type
            <input name="entity" defaultValue={entity} maxLength={80} />
          </label>
          <button type="submit">Filter</button>
        </form>
      </section>

      {error && (
        <section className="admin-card" role="alert">
          Unable to read audit events.
        </section>
      )}

      <section className="admin-list">
        {(data || []).map((item) => (
          <article className="admin-card" key={item.id}>
            <div className="admin-top">
              <strong>{item.action}</strong>
              <time dateTime={item.created_at}>
                {new Date(item.created_at).toLocaleString("en-IN", {
                  timeZone: "Asia/Kolkata",
                })}
              </time>
            </div>
            <p>
              {item.entity_type}
              {item.entity_id ? " · " + item.entity_id : ""}
            </p>
            <p className="muted">
              Admin: {item.admin_user_id || "system/unknown"}
            </p>
            {item.payload &&
              typeof item.payload === "object" &&
              Object.keys(item.payload).length > 0 && (
                <pre>{JSON.stringify(item.payload, null, 2)}</pre>
              )}
          </article>
        ))}
        {!error && (data || []).length === 0 && (
          <article className="admin-card">No matching audit events.</article>
        )}
      </section>
    </>
  );
}
