import Link from "next/link";
import { redirect } from "next/navigation";
import {
  customerAccountsEnabled,
  customerUser,
} from "@/lib/customer-auth";
import { getSupabase } from "@/lib/supabase";
import { ClaimOrderForm } from "@/components/ClaimOrderForm";
import { customerLogout } from "./actions";

export const metadata = {
  title: "Your account",
  robots: { index: false, follow: false },
};

function money(value: number | null, currency = "INR") {
  if (value == null) return "Price on request";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
  }).format(Number(value) / 100);
}

function readable(value: string) {
  return value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export default async function AccountPage() {
  if (!customerAccountsEnabled())
    return (
      <main id="main-content" className="container section">
        <p className="eyebrow">Your Yash Laser orders</p>
        <h1>Customer account.</h1>
        <p>
          Customer accounts are prepared but not enabled yet. Secure guest
          order tracking remains available.
        </p>
        <div className="hero-actions">
          <Link className="button" href="/track-order">
            Track an order ↗
          </Link>
          <Link className="text-link" href="/products">
            Continue shopping ↗
          </Link>
        </div>
      </main>
    );

  const user = await customerUser();
  if (!user) redirect("/account/login");

  const db = getSupabase();
  const { data: orders, error } = await db
    .from("shop_orders")
    .select(
      "id,order_no,status,payment_status,total_minor,currency,created_at",
    )
    .eq("customer_user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(100);

  return (
    <main id="main-content" className="container section">
      <div className="account-heading">
        <div>
          <p className="eyebrow">Your Yash Laser account</p>
          <h1>Orders, proofs and delivery in one place.</h1>
          <p>{user.email}</p>
        </div>
        <form action={customerLogout}>
          <button className="button button-secondary">Sign out</button>
        </form>
      </div>

      <div className="hero-actions">
        <Link className="button" href="/products">
          Continue shopping ↗
        </Link>
        <Link className="text-link" href="/track-order">
          Track a guest order ↗
        </Link>
        <Link className="text-link" href="/support">
          Need help? ↗
        </Link>
      </div>

      {error ? (
        <p role="alert">
          Orders could not be loaded. Please try again later.
        </p>
      ) : (
        <section className="section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">My orders</p>
              <h2>Your order history</h2>
            </div>
            <p>
              Open an order to view items, payment, proof, shipping and status
              history.
            </p>
          </div>
          <div className="admin-list">
            {(orders || []).map((order) => (
              <article className="admin-card" key={order.id}>
                <div className="account-heading">
                  <div>
                    <strong>{order.order_no}</strong>
                    <p>
                      {readable(order.status)} · Payment{" "}
                      {readable(order.payment_status)}
                    </p>
                    <small>
                      {new Date(order.created_at).toLocaleString("en-IN", {
                        timeZone: "Asia/Kolkata",
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </small>
                  </div>
                  <div>
                    <strong>{money(order.total_minor, order.currency)}</strong>
                    <br />
                    <Link
                      className="text-link"
                      href={"/account/orders/" + order.id}
                    >
                      View order ↗
                    </Link>
                  </div>
                </div>
              </article>
            ))}
            {!orders?.length && (
              <div className="admin-card">
                <h3>No linked orders yet.</h3>
                <p>
                  New orders placed while signed in will appear here
                  automatically. You can also add an older guest order below.
                </p>
              </div>
            )}
          </div>
        </section>
      )}

      <ClaimOrderForm />
    </main>
  );
}
