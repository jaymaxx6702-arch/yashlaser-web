import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
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
