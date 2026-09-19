import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export default async function AdminSupportPage() {
  await requireAdmin();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_support_tickets")
    .select("id,ticket_no,customer_name,customer_mobile,category,subject,message,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <h1>Support tickets</h1>
      {error ? (
        <p role="alert">Commerce migration is not applied yet, or tickets could not be loaded.</p>
      ) : (
        <div className="admin-list">
          {(data || []).map((ticket) => (
            <article className="admin-card" key={ticket.id}>
              <strong>{ticket.ticket_no} · {ticket.status}</strong>
              <span>{ticket.customer_name} · {ticket.customer_mobile}</span>
              <span>{ticket.category} · {ticket.subject}</span>
              <p>{ticket.message}</p>
            </article>
          ))}
          {!data?.length && <p>No support tickets yet.</p>}
        </div>
      )}
    </>
  );
}
