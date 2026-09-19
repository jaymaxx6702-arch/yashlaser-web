import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

const names = new Set([
  "page_view",
  "search",
  "product_view",
  "add_to_cart",
  "begin_checkout",
]);

function cleanPath(value: unknown) {
  if (typeof value !== "string") return null;
  const path = value.split("?")[0].trim().slice(0, 300);
  return path.startsWith("/") ? path : null;
}

function cleanSearch(value: unknown) {
  if (typeof value !== "string") return null;
  const query = value.trim().replace(/\s+/g, " ").slice(0, 100);
  if (!query) return null;

  const looksSensitive =
    /@/.test(query) ||
    /\b\+?\d[\d\s()-]{7,}\d\b/.test(query);

  return looksSensitive ? null : query;
}

export async function POST(request: Request) {
  if (process.env.ANALYTICS_ENABLED !== "true")
    return new NextResponse(null, { status: 204 });

  const body = await request.json().catch(() => null);
  const eventName =
    typeof body?.eventName === "string" ? body.eventName : "";

  if (!names.has(eventName))
    return NextResponse.json(
      { error: "Invalid analytics event." },
      { status: 400 },
    );

  const productId =
    typeof body?.productId === "string"
      ? body.productId.slice(0, 120)
      : null;
  const resultCount = Number(body?.resultCount);

  const metadata =
    body?.metadata &&
    typeof body.metadata === "object" &&
    JSON.stringify(body.metadata).length <= 2000
      ? body.metadata
      : {};

  const db = getSupabase();
  const { error } = await db.from("shop_analytics_events").insert({
    event_name: eventName,
    path: cleanPath(body?.path),
    product_id: productId,
    search_query: cleanSearch(body?.searchQuery),
    result_count:
      Number.isInteger(resultCount) && resultCount >= 0
        ? resultCount
        : null,
    metadata,
  });

  if (error)
    return NextResponse.json(
      { error: "Unable to record analytics event." },
      { status: 500 },
    );

  return new NextResponse(null, { status: 204 });
}
