import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET() {
  const db = getSupabase();
  const { data } = await db
    .from("shop_reviews")
    .select(
      "id,product_id,customer_name,rating,review_text,verified_purchase,created_at",
    )
    .eq("status", "published")
    .order("created_at", { ascending: false })
    .limit(100);

  return NextResponse.json({ reviews: data || [] });
}

export async function POST(request: Request) {
  if (process.env.REVIEWS_ENABLED !== "true")
    return NextResponse.json(
      { error: "Reviews are not enabled yet." },
      { status: 503 },
    );

  const body = await request.json().catch(() => null);
  const productId =
    typeof body?.productId === "string" ? body.productId.slice(0, 100) : "";
  const name =
    typeof body?.name === "string" ? body.name.trim().slice(0, 80) : "";
  const reviewText =
    typeof body?.review === "string"
      ? body.review.trim().slice(0, 2000)
      : "";
  const rating = Number(body?.rating);

  if (
    !productId ||
    name.length < 2 ||
    !reviewText ||
    !Number.isInteger(rating) ||
    rating < 1 ||
    rating > 5
  )
    return NextResponse.json({ error: "Invalid review." }, { status: 400 });

  const db = getSupabase();
  const { error } = await db.from("shop_reviews").insert({
    product_id: productId,
    customer_name: name,
    rating,
    review_text: reviewText,
    status: "pending",
    verified_purchase: false,
  });

  if (error)
    return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
