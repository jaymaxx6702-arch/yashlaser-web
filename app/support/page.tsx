import Link from "next/link";
import { SupportForm } from "@/components/SupportForm";

export const metadata = { title: "Support" };

export default function Support() {
  return (
    <main id="main-content" className="container section text-page">
      <p className="eyebrow">Customer support</p>
      <h1>How can we help?</h1>
      <p>
        Already opened a ticket?{" "}
        <Link className="text-link" href="/support/ticket">
          Track support ticket ↗
        </Link>
      </p>
      <SupportForm />
    </main>
  );
}
