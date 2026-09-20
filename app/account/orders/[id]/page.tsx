import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import {
  customerAccountsEnabled,
  requireCustomer,
} from "@/lib/customer-auth";
import { getSupabase } from "@/lib/supabase";

export const metadata = {
  title: "Order details",
  robots: { index: false, follow: false },
};

function money(value: number | null, currency = "INR") {
  if (value == null) return "Price on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(Number(value) / 100);
}

function readable(value: string | null | undefined) {
  if (!value) return "Not available";
  return value
    .replaceAll("_", " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function dateTime(value: string | null | undefined) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    timeZone: "Asia/Kolkata",
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function safeExternalUrl(value: string | null | undefined) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:"
      ? url.toString()
      : null;
  } catch {
    return null;
  }
}

function addressText(value: unknown) {
  if (!value || typeof value !== "object") return "Not available";
  const address = value as Record<string, unknown>;
  const preferred = [
    "name",
    "line1",
    "address1",
    "line2",
    "address2",
    "landmark",
    "city",
    "district",
    "state",
    "pincode",
    "postalCode",
    "country",
  ];
  const used = new Set<string>();
  const parts: string[] = [];

  for (const key of preferred) {
    const item = address[key];
    if (typeof item === "string" && item.trim()) {
      parts.push(item.trim());
      used.add(key);
    }
  }

  for (const [key, item] of Object.entries(address)) {
    if (
      !used.has(key) &&
      typeof item === "string" &&
      item.trim() &&
      !["phone", "mobile", "email"].includes(key)
    ) {
      parts.push(item.trim());
    }
  }

  return parts.length ? parts.join(", ") : "Not available";
}

export default async function AccountOrderPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  if (!customerAccountsEnabled()) redirect("/account");

  const user = await requireCustomer();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();

  const db = getSupabase();
  const { data: order, error } = await db
    .from("shop_orders")
    .select(
      "id,order_no,status,payment_status,currency,subtotal_minor,shipping_minor,total_minor,shipping_address,created_at,updated_at",
    )
    .eq("id", id)
    .eq("customer_user_id", user.id)
    .maybeSingle();

  if (error || !order) notFound();

  const [
    { data: items },
    { data: shipments },
    { data: proofs },
    { data: payments },
    { data: events },
  ] = await Promise.all([
    db
      .from("shop_order_items")
      .select(
        "id,product_slug,product_name,variant_name,quantity,unit_price_minor,line_total_minor,configuration",
      )
      .eq("order_id", order.id)
      .order("created_at"),
    db
      .from("shop_shipments")
      .select(
        "id,courier,awb,tracking_url,status,package_count,dispatched_at,delivered_at,created_at",
      )
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
    db
      .from("shop_proofs")
      .select(
        "id,version_no,status,file_path,file_name,mime_type,note,approved_at,created_at",
      )
      .eq("order_id", order.id)
      .order("version_no", { ascending: false }),
    db
      .from("shop_payments")
      .select("id,provider,amount_minor,currency,status,created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
    db
      .from("shop_order_events")
      .select("id,event_type,to_status,note,created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: false }),
  ]);

  const latestProof = proofs?.[0] || null;
  let proofUrl: string | null = null;
  if (latestProof?.file_path) {
    const { data } = await db.storage
      .from("shop-proofs")
      .createSignedUrl(latestProof.file_path, 10 * 60);
    proofUrl = data?.signedUrl || null;
  }

  return (
    <main id="main-content" className="container section">
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <Link href="/account">Account</Link>
        <span>/</span>
        <span>{order.order_no}</span>
      </nav>

      <div className="account-heading">
        <div>
          <p className="eyebrow">Order {order.order_no}</p>
          <h1>{readable(order.status)}</h1>
          <p>
            Placed {dateTime(order.created_at)} · Updated{" "}
            {dateTime(order.updated_at)}
          </p>
        </div>
        <div>
          <strong>{money(order.total_minor, order.currency)}</strong>
          <p>Payment {readable(order.payment_status)}</p>
        </div>
      </div>

      <div className="hero-actions">
        <Link className="button button-secondary" href="/account">
          ← Back to account
        </Link>
        <Link className="text-link" href="/support">
          Get support ↗
        </Link>
      </div>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Items</p>
            <h2>What you ordered</h2>
          </div>
        </div>
        <div className="admin-list">
          {(items || []).map((item) => (
            <article className="admin-card" key={item.id}>
              <strong>{item.product_name}</strong>
              <p>
                {item.variant_name || "Standard"} · Qty {item.quantity}
              </p>
              <p>
                {item.line_total_minor == null
                  ? "Price on request"
                  : money(item.line_total_minor, order.currency)}
              </p>
              <Link
                className="text-link"
                href={"/products/" + item.product_slug}
              >
                View product ↗
              </Link>
            </article>
          ))}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Payment</p>
            <h2>{readable(order.payment_status)}</h2>
          </div>
          <p>Total {money(order.total_minor, order.currency)}</p>
        </div>
        <div className="admin-card">
          <p>Subtotal: {money(order.subtotal_minor, order.currency)}</p>
          <p>Shipping: {money(order.shipping_minor, order.currency)}</p>
          {(payments || []).map((payment) => (
            <p key={payment.id}>
              {readable(payment.status)} · {money(payment.amount_minor, payment.currency)}
              {" · "}
              {readable(payment.provider)} · {dateTime(payment.created_at)}
            </p>
          ))}
          {!payments?.length && (
            <p className="muted">No separate payment transaction is recorded yet.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Proof</p>
            <h2>
              {latestProof
                ? "Version " + latestProof.version_no + " · " + readable(latestProof.status)
                : "Not uploaded yet"}
            </h2>
          </div>
        </div>
        <div className="admin-card">
          {latestProof ? (
            <>
              <p>
                Latest proof created {dateTime(latestProof.created_at)}
                {latestProof.approved_at
                  ? " · Approved " + dateTime(latestProof.approved_at)
                  : ""}
              </p>
              {latestProof.note && <p>{latestProof.note}</p>}
              {proofUrl ? (
                <a
                  className="text-link"
                  href={proofUrl}
                  target="_blank"
                  rel="noreferrer"
                >
                  Open latest proof ↗
                </a>
              ) : (
                <p className="muted">Proof file is temporarily unavailable.</p>
              )}
              <p className="muted">
                Proof approval or change requests still use the secure proof
                link sent by Yash Laser.
              </p>
            </>
          ) : (
            <p>Your proof will appear here after the design team uploads it.</p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Delivery</p>
            <h2>Shipping & tracking</h2>
          </div>
        </div>
        <div className="admin-card">
          <p>
            <strong>Ship to:</strong> {addressText(order.shipping_address)}
          </p>
          {(shipments || []).map((shipment) => {
            const trackingUrl = safeExternalUrl(shipment.tracking_url);
            return (
              <div key={shipment.id}>
                <p>
                  {readable(shipment.status)}
                  {shipment.courier ? " · " + shipment.courier : ""}
                  {shipment.awb ? " · AWB " + shipment.awb : ""}
                </p>
                {trackingUrl && (
                  <a
                    className="text-link"
                    href={trackingUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Track with courier ↗
                  </a>
                )}
              </div>
            );
          })}
          {!shipments?.length && (
            <p className="muted">
              Shipment details will appear after dispatch is prepared.
            </p>
          )}
        </div>
      </section>

      <section className="section">
        <div className="section-heading">
          <div>
            <p className="eyebrow">Timeline</p>
            <h2>Order updates</h2>
          </div>
        </div>
        <div className="admin-list">
          {(events || []).map((event) => (
            <article className="admin-card" key={event.id}>
              <strong>{readable(event.to_status || event.event_type)}</strong>
              {event.note && <p>{event.note}</p>}
              <small>{dateTime(event.created_at)}</small>
            </article>
          ))}
          {!events?.length && <p>No timeline entries yet.</p>}
        </div>
      </section>
    </main>
  );
}
