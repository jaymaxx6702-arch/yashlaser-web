import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export default async function AdminProjectsPage() {
  await requireAdmin();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_project_requests")
    .select("id,request_no,request_type,customer_name,customer_mobile,status,payload,created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <>
      <h1>Project requests</h1>
      {error ? (
        <p role="alert">Commerce migration is not applied yet, or requests could not be loaded.</p>
      ) : (
        <div className="admin-list">
          {(data || []).map((item) => (
            <article className="admin-card" key={item.id}>
              <strong>{item.request_no}</strong>
              <span>{item.request_type} · {item.status}</span>
              <span>{item.customer_name} · {item.customer_mobile}</span>
              <pre>{JSON.stringify(item.payload, null, 2)}</pre>
            </article>
          ))}
          {!data?.length && <p>No project requests yet.</p>}
        </div>
      )}
    </>
  );
}
