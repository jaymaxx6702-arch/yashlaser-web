import type { Metadata } from "next";
import { Suspense } from "react";
import { TrackOrderClient } from "@/components/TrackOrderClient";

export const metadata: Metadata = {
  title: "Track order",
  robots: { index: false, follow: false },
};

export default function TrackOrderPage() {
  return (
    <main id="main-content" className="container section">
      <Suspense fallback={<p>Loading tracking…</p>}>
        <TrackOrderClient />
      </Suspense>
    </main>
  );
}
