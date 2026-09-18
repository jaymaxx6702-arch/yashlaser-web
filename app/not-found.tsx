import Link from "next/link";
export default function NotFound() {
  return (
    <main id="main-content" className="container text-page">
      <p className="eyebrow">Page not found</p>
      <h1>Let’s find something personal.</h1>
      <p>
        This product or page is not available. Browse our collection or contact
        us for help finding a design.
      </p>
      <Link className="button" href="/products">
        Explore products ↗
      </Link>
    </main>
  );
}
