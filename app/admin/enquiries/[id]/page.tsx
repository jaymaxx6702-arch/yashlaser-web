import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin, statuses } from "@/lib/admin";
import { getSupabase } from "@/lib/supabase";
import { updateEnquiry } from "../../actions";
export default async function Detail({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ saved?: string; error?: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  if (!/^[a-f0-9-]{36}$/i.test(id)) notFound();
  const db = getSupabase();
  const { data: e, error } = await db
    .from("enquiries")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Unable to load enquiry.");
  if (!e) notFound();
  const { data: items, error: itemError } = await db
    .from("enquiry_items")
    .select("*")
    .eq("enquiry_id", id);
  if (itemError) throw new Error("Unable to load enquiry items.");
  const feedback = await searchParams;
  const phone = e.phone.replace(/\D/g, "");
  const contact = phone.length === 10 ? "91" + phone : phone;
  return (
    <>
      <Link href="/admin">← Enquiries</Link>
      <h1>{e.reference}</h1>
      {feedback.saved && <p role="status">Changes saved.</p>}
      {feedback.error && (
        <p role="alert">Could not save. Apply the admin migration and retry.</p>
      )}
      <section className="admin-card">
        <h2>Customer</h2>
        <p>{e.customer_name}</p>
        <p>
          <a href={`tel:+${contact}`}>{e.phone}</a> ·{" "}
          {e.email && <a href={`mailto:${e.email}`}>{e.email}</a>}
        </p>
        <p>{e.city}</p>
        <p>
          {new Date(e.created_at).toLocaleString("en-IN", {
            timeZone: "Asia/Kolkata",
          })}{" "}
          IST
        </p>
        <a
          href={`https://wa.me/${contact}?text=${encodeURIComponent(`Hello ${e.customer_name}, regarding your Yash Laser enquiry ${e.reference}.`)}`}
          target="_blank"
          rel="noreferrer"
        >
          Contact on WhatsApp ↗
        </a>
      </section>
      {items?.map((item) => (
        <section className="admin-card" key={item.id}>
          <h2>{item.product_name}</h2>
          <p>
            Size / variant: {item.variant_name || "To confirm"} · Quantity:{" "}
            {item.quantity}
          </p>
          <p>
            {item.unit_price_minor === null
              ? "Price to confirm"
              : `Unit estimate: ₹${(item.unit_price_minor / 100).toFixed(2)} · Total estimate: ₹${((item.unit_price_minor * item.quantity) / 100).toFixed(2)}`}
          </p>
          <p>
            Final quotation, customisation and delivery confirmed separately.
          </p>
          <p>
            {item.line1}
            <br />
            {item.line2}
          </p>
          <p>Customer instructions: {item.notes || "None"}</p>
          <p>Design: {item.design_id || "Not available"}</p>
          <div className="admin-media">
            {item.preview_path && (
              <a
                href={`/admin/artwork/${item.id}?kind=preview`}
                target="_blank"
                rel="noreferrer"
              >
                Open private preview ↗
              </a>
            )}
            {item.artwork_path && (
              <a
                href={`/admin/artwork/${item.id}?kind=artwork`}
                target="_blank"
                rel="noreferrer"
              >
                Open uploaded artwork ↗
              </a>
            )}
          </div>
          {item.preview_path && (
            <div className="admin-preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`/admin/artwork/${item.id}?kind=preview`}
                alt="Customer customization preview"
              />
            </div>
          )}
          <details>
            <summary>Customization data</summary>
            <pre>{JSON.stringify(item.customization, null, 2)}</pre>
          </details>
        </section>
      ))}
      <form action={updateEnquiry} className="admin-card">
        <h2>Workflow & internal notes</h2>
        <input type="hidden" name="id" value={id} />
        <label>
          Status
          <select name="status" defaultValue={e.status}>
            {Object.entries(statuses).map(([v, l]) => (
              <option key={v} value={v}>
                {l}
              </option>
            ))}
          </select>
        </label>
        <label>
          Internal notes (staff only)
          <textarea
            name="internal_notes"
            defaultValue={e.internal_notes || ""}
            rows={6}
            maxLength={10000}
          />
        </label>
        <button>Save changes</button>
      </form>
    </>
  );
}
