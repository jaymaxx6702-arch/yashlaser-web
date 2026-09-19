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
          <p className="eyebrow">Your Yash Laser orders</p>
          <h1>Customer account.</h1>
          <p>{user.email}</p>
        </div>
        <form action={customerLogout}>
          <button className="button button-secondary">Sign out</button>
        </form>
      </div>

      {error ? (
        <p role="alert">
          Orders could not be loaded. Please try again later.
        </p>
      ) : (
        <section>
          <h2>Your orders</h2>
          <div className="admin-list">
            {(orders || []).map((order) => (
              <article className="admin-card" key={order.id}>
                <strong>{order.order_no}</strong>
                <span>
                  {order.status} · Payment {order.payment_status}
                </span>
                <small>
                  {new Date(order.created_at).toLocaleString("en-IN", {
                    timeZone: "Asia/Kolkata",
                  })}
                </small>
              </article>
            ))}
            {!orders?.length && <p>No linked orders yet.</p>}
          </div>
        </section>
      )}

      <ClaimOrderForm />
    </main>
  );
}
