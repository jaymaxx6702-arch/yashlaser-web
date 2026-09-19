import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      ok: true,
      service: "yashlaser-shop",
      commerce: process.env.COMMERCE_ORDERS_ENABLED === "true",
      payments: process.env.PAYMENTS_ENABLED === "true",
      yashflow: process.env.YASHFLOW_SYNC_ENABLED === "true",
      analytics: process.env.ANALYTICS_ENABLED === "true",
      time: new Date().toISOString(),
    },
    {
      headers: { "cache-control": "no-store" },
    },
  );
}
