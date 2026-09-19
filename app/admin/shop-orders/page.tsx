import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { YashFlowSyncButton } from "@/components/YashFlowSyncButton";

export default async function ShopOrdersAdminPage() {
  await requireAdmin();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_orders")
    .select("id,order_no,customer_name,customer_mobile,status,payment_status,total_minor,yashflow_sync_status,yashflow_last_error,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <div className="admin-top">
        <div>
          <p><Link href="/admin">← Enquiries</Link></p>
          <h1>Shop orders</h1>
        </div>
        <Link href="/admin/proofs">Proofs →</Link>
      </div>
      {error ? (
        <p role="alert">Commerce migration is not applied yet, or orders could not be loaded.</p>
      ) : (
        <div className="admin-list">
          {(data || []).map((order) => (
            <article className="admin-card" key={order.id}>
              <strong>{order.order_no}</strong>
              <span>{order.customer_name} · {order.customer_mobile}</span>
              <span>Shop: {order.status} · Payment: {order.payment_status}</span>
              <span>YashFlow: {order.yashflow_sync_status}</span>
              {order.yashflow_last_error && <small>{order.yashflow_last_error}</small>}
              <YashFlowSyncButton orderId={order.id} />
            </article>
          ))}
          {!data?.length && <p>No Shop orders yet.</p>}
        </div>
      )}
    </>
  );
}
