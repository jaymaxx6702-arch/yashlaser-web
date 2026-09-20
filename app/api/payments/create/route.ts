import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/payments";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";

export async function POST(request: Request) {
  if (!(await consumeRequestRateLimit(request, "payment_create_ip", 20, 600)))
    return rateLimitResponse(600);

  const result = await createPaymentIntent();
  if (!result.enabled)
    return NextResponse.json(
      { error: result.reason, code: "PAYMENT_NOT_CONFIGURED" },
      { status: 503 },
    );
  return NextResponse.json(result);
}
