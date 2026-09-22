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
      rateLimits: process.env.RATE_LIMITS_ENABLED === "true",
      aiImageTools:
        process.env.AI_IMAGE_TOOLS_ENABLED === "true" &&
        Boolean(process.env.AI_BACKGROUND_REMOVE_URL),
      time: new Date().toISOString(),
    },
    {
      headers: { "cache-control": "no-store" },
    },
  );
}
