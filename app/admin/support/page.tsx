import { AdminSupportActions } from "@/components/AdminSupportActions";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export default async function AdminSupportPage() {
  await requireAdmin();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_support_tickets")
    .select(
      "id,ticket_no,customer_name,customer_mobile,customer_email,category,subject,message,status,order_id,admin_response,responded_at,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <h1>Support tickets</h1>
      {error ? (
        <p role="alert">
          Commerce/support migration is not applied yet, or tickets could not be loaded.
        </p>
      ) : (
        <div className="admin-list">
          {(data || []).map((ticket) => (
            <article className="admin-card" key={ticket.id}>
              <strong>
                {ticket.ticket_no} · {ticket.status}
              </strong>
              <span>
                {ticket.customer_name} · {ticket.customer_mobile}
                {ticket.customer_email ? " · " + ticket.customer_email : ""}
              </span>
              <span>
                {ticket.category} · {ticket.subject}
              </span>
              <span>
                {ticket.order_id ? "Linked to verified order" : "No linked order"}
              </span>
              <p>{ticket.message}</p>
              {ticket.admin_response && (
                <p>
                  <strong>Current response:</strong> {ticket.admin_response}
                </p>
              )}
              <AdminSupportActions
                id={ticket.id}
                status={ticket.status}
                response={ticket.admin_response}
              />
            </article>
          ))}
          {!data?.length && <p>No support tickets yet.</p>}
        </div>
      )}
    </>
  );
}
