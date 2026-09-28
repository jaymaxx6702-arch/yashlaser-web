import { AdminProjectActions } from "@/components/AdminProjectActions";
import { requireAdmin } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";

export default async function AdminProjectsPage() {
  await requireAdmin();
  const db = getSupabase();
  const { data, error } = await db
    .from("shop_project_requests")
    .select(
      "id,request_no,request_type,customer_name,customer_mobile,customer_email,status,payload,quote_id,customer_message,responded_at,created_at,updated_at",
    )
    .order("created_at", { ascending: false })
    .limit(100);

  const { data: files } = await db
    .from("shop_project_files")
    .select("id,request_id,file_name,mime_type,file_size,created_at")
    .order("created_at", { ascending: false })
    .limit(500);

  const filesByRequest = new Map<string, typeof files>();
  for (const file of files || []) {
    const current = filesByRequest.get(file.request_id) || [];
    current.push(file);
    filesByRequest.set(file.request_id, current);
  }

  return (
    <>
      <h1>Project requests</h1>
      {error ? (
        <p role="alert">
          Commerce/project migration is not applied yet, or requests could not be loaded.
        </p>
      ) : (
        <div className="admin-list">
          {(data || []).map((item) => (
            <article className="admin-card" key={item.id}>
              <strong>{item.request_no}</strong>
              <span>
                {item.request_type} · {item.status}
              </span>
              <span>
                {item.customer_name} · {item.customer_mobile}
                {item.customer_email ? " · " + item.customer_email : ""}
              </span>
              <span>
                {item.quote_id ? "Quote linked" : "No quote linked yet"}
              </span>
              <pre>{JSON.stringify(item.payload, null, 2)}</pre>
              {(filesByRequest.get(item.id) || []).length > 0 && (
                <div>
                  <strong>Attachments</strong>
                  <ul>
                    {(filesByRequest.get(item.id) || []).map((file) => (
                      <li key={file.id}>
                        <a
                          className="text-link"
                          href={"/api/admin/project-files/" + file.id}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {file.file_name} ↗
                        </a>
                        {" · "}
                        {Math.max(1, Math.round((file.file_size || 0) / 1024))} KB
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {item.customer_message && (
                <p>
                  <strong>Current customer message:</strong>{" "}
                  {item.customer_message}
                </p>
              )}
              <AdminProjectActions
                id={item.id}
                status={item.status}
                customerMessage={item.customer_message}
              />
            </article>
          ))}
          {!data?.length && <p>No project requests yet.</p>}
        </div>
      )}
    </>
  );
}
