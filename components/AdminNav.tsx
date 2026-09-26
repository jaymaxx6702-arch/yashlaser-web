import Link from "next/link";

export function AdminNav() {
  return (
    <nav className="admin-nav" aria-label="Admin navigation">
      <Link href="/admin">Enquiries</Link>
      <Link href="/admin/shop-orders">Shop Orders</Link>
      <Link href="/admin/proofs">Proofs</Link>
      <Link href="/admin/projects">Projects</Link>
      <Link href="/admin/quotes">Quotes</Link>
      <Link href="/admin/support">Support</Link>
      <Link href="/admin/reviews">Reviews</Link>
      <Link href="/admin/search-analytics">Analytics</Link>
      <Link href="/admin/customization-rules">Customisation Rules</Link>
    </nav>
  );
}
