import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/payments";

export async function POST() {
  const result = await createPaymentIntent();
  if (!result.enabled)
    return NextResponse.json(
      { error: result.reason, code: "PAYMENT_NOT_CONFIGURED" },
      { status: 503 },
    );
  return NextResponse.json(result);
}
