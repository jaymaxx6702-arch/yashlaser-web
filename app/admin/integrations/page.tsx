import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { YashFlowSyncButton } from "@/components/YashFlowSyncButton";
import { YashFlowMappingManager } from "@/components/admin/YashFlowMappingManager";
import { products } from "@/data/catalog";
import { getYashFlowMappings } from "@/lib/yashflow-mappings";

export const dynamic = "force-dynamic";

export default async function AdminIntegrationsPage() {
  await requireAdmin();
  const db = getSupabase();

  const [
    { data: failedOrders, error: failedError },
    { data: events, error: eventError },
    mappingResult,
  ] = await Promise.all([
      db
        .from("shop_orders")
        .select(
          "id,order_no,customer_name,status,yashflow_sync_status,yashflow_last_error,yashflow_last_synced_at,created_at",
        )
        .eq("yashflow_sync_status", "failed")
        .order("created_at", { ascending: false })
        .limit(100),
      db
        .from("shop_integration_events")
        .select("id,entity_id,status,error,attempts,created_at,updated_at")
        .eq("kind", "yashflow_order_sync")
        .order("created_at", { ascending: false })
        .limit(200),
      getYashFlowMappings()
        .then((snapshot) => ({ snapshot, error: null }))
        .catch((error: unknown) => ({
          snapshot: null,
          error:
            error instanceof Error
              ? error.message
              : "Unable to load YashFlow product mappings.",
        })),
    ]);

  const successCount = (events || []).filter(
    (event) => event.status === "success",
  ).length;
  const failedCount = (events || []).filter(
    (event) => event.status === "failed",
  ).length;

  return (
    <>
      <section className="admin-card">
        <div className="admin-top">
          <div>
            <p className="eyebrow">Operations</p>
            <h1>YashFlow integration</h1>
            <p className="muted">
              Manual/retry sync remains the safety gate. Failed mapping,
              downtime and validation errors stay visible here instead of
              silently routing an order.
            </p>
          </div>
          <Link href="/admin/shop-orders">Shop orders →</Link>
        </div>

        <div className="admin-metrics">
          <article className="admin-card">
            <small>Failed queue</small>
            <strong>{failedOrders?.length || 0}</strong>
          </article>
          <article className="admin-card">
            <small>Recent success events</small>
            <strong>{successCount}</strong>
          </article>
          <article className="admin-card">
            <small>Recent failed events</small>
            <strong>{failedCount}</strong>
          </article>
        </div>
      </section>

      {mappingResult.snapshot ? (
        <YashFlowMappingManager
          shopProducts={products.map((product) => ({
            id: product.id,
            name: product.name,
            categoryId: product.categoryId,
          }))}
          snapshot={mappingResult.snapshot}
        />
      ) : (
        <section className="admin-card">
          <h2>Product mapping maintenance</h2>
          <p role="alert">
            Mapping service unavailable: {mappingResult.error}
          </p>
        </section>
      )}

      <section className="admin-card">
        <h2>Failed sync queue</h2>
        <p className="muted">
          Retry only after the mapping/configuration or YashFlow availability
          issue is corrected. The same Shop order id is reused as the
          idempotency key on every retry.
        </p>
      </section>

      {failedError && <p role="alert">Unable to load failed Shop orders.</p>}
      <div className="admin-list">
        {(failedOrders || []).map((order) => (
          <article className="admin-card" key={order.id}>
            <div className="admin-top">
              <div>
                <strong>{order.order_no}</strong>
                <span>
                  {order.customer_name} · Shop status: {order.status}
                </span>
              </div>
              <YashFlowSyncButton orderId={order.id} />
            </div>
            {order.yashflow_last_error && (
              <p role="alert">{order.yashflow_last_error}</p>
            )}
            <small>
              Last successful sync:{" "}
              {order.yashflow_last_synced_at
                ? new Date(order.yashflow_last_synced_at).toLocaleString(
                    "en-IN",
                    { timeZone: "Asia/Kolkata" },
                  )
                : "Never"}
            </small>
          </article>
        ))}
        {!failedError && !(failedOrders || []).length && (
          <article className="admin-card">No failed YashFlow syncs.</article>
        )}
      </div>

      <section className="admin-card">
        <h2>Recent sync attempts</h2>
      </section>
      {eventError && <p role="alert">Unable to load integration events.</p>}
      <div className="admin-list">
        {(events || []).map((event) => (
          <article className="admin-card" key={event.id}>
            <div className="admin-top">
              <strong>{event.status}</strong>
              <span>Attempt {event.attempts}</span>
            </div>
            <span>Order ID: {event.entity_id || "unknown"}</span>
            {event.error && <small>{event.error}</small>}
            <time dateTime={event.created_at}>
              {new Date(event.created_at).toLocaleString("en-IN", {
                timeZone: "Asia/Kolkata",
              })}{" "}
              IST
            </time>
          </article>
        ))}
      </div>
    </>
  );
}
