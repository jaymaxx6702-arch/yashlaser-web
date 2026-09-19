import { notFound } from "next/navigation";
import { trackCommerceOrder } from "@/lib/commerce-server";

export const metadata = {
  title: "Order summary",
  robots: { index: false, follow: false },
};

export default async function Summary({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const parts = token.split("~");
  const orderNo = parts[0];
  const rawToken = parts[1];

  if (!orderNo || !rawToken) notFound();

  const result = await trackCommerceOrder(
    decodeURIComponent(orderNo),
    rawToken,
  );
  if (!result) notFound();

  return (
    <main
      id="main-content"
      className="container section text-page print-summary"
    >
      <p className="eyebrow">Yash Laser · Established 1997</p>
      <h1>Order summary</h1>
      <p>
        <strong>{result.order.order_no}</strong> · {result.order.status}
      </p>
      <div className="admin-card">
        <pre>{JSON.stringify(result.items, null, 2)}</pre>
      </div>
      <p className="muted">This summary is not a tax invoice.</p>
    </main>
  );
}
