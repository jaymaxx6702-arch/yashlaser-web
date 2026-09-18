"use client";
import Link from "next/link";
export default function AdminError({ reset }: { reset: () => void }) {
  return (
    <section className="admin-card">
      <h1>Admin temporarily unavailable</h1>
      <p role="alert">
        Unable to complete this request. If a save was interrupted, reload the
        enquiry to check its current state.
      </p>
      <button onClick={reset}>Retry</button>
      <p>
        <Link href="/admin/login">Sign in again</Link>
      </p>
    </section>
  );
}
