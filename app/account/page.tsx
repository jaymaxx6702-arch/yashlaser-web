import Link from "next/link";
export const metadata = { title: "Your account" };
export default function AccountPage() {
  return (
    <main id="main-content" className="container section">
      <p className="eyebrow">Your Yash Laser orders</p>
      <h1>Customer account.</h1>
      <p>
        Secure guest order tracking is available now. Passwordless customer accounts
        will be enabled after Supabase customer-auth settings are verified.
      </p>
      <div className="hero-actions">
        <Link className="button" href="/track-order">Track an order ↗</Link>
        <Link className="text-link" href="/products">Continue shopping ↗</Link>
      </div>
    </main>
  );
}
