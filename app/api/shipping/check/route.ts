import { NextResponse } from "next/server";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

export async function POST(request: Request) {
  if (!(await consumeRequestRateLimit(request, "shipping_check_ip", 60, 600)))
    return rateLimitResponse(600);

  let body: { pincode?: unknown } | null;
  try {
    body = await readJsonBody<{ pincode?: unknown }>(request, 2 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }
  const pincode =
    typeof body?.pincode === "string" ? body.pincode.trim() : "";

  if (!/^\d{6}$/.test(pincode))
    return NextResponse.json(
      { error: "Enter a valid 6-digit pincode." },
      { status: 400 },
    );

  return NextResponse.json({
    pincode,
    serviceability: "manual_confirmation",
    shippingMinor: null,
    message:
      "Delivery availability and final courier charge are confirmed before payment.",
  });
}
