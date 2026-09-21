import { NextResponse } from "next/server";
import { createPaymentIntent } from "@/lib/payments";
import { consumeRequestRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";

type PaymentBody = {
  orderNo?: unknown;
  token?: unknown;
};

export async function POST(request: Request) {
  if (!(await consumeRequestRateLimit(request, "payment_create_ip", 20, 600)))
    return rateLimitResponse(600);

  let body: PaymentBody | null;
  try {
    body = await readJsonBody<PaymentBody>(request, 8 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }

  const orderNo =
    typeof body?.orderNo === "string" ? body.orderNo.trim().slice(0, 40) : "";
  const token =
    typeof body?.token === "string" ? body.token.trim().slice(0, 100) : "";

  if (!orderNo || token.length < 20)
    return NextResponse.json(
      { error: "Invalid payment details.", code: "INVALID_PAYMENT_DETAILS" },
      { status: 400 },
    );

  try {
    const result = await createPaymentIntent({ orderNo, token });
    if (!result.enabled) {
      const status =
        result.code === "ORDER_NOT_PAYABLE" ? 404 :
        result.code === "ORDER_ALREADY_PAID" ? 409 :
        503;
      return NextResponse.json(
        { error: result.reason, code: result.code },
        { status },
      );
    }
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Unable to create payment session.",
        code: "PAYMENT_CREATE_FAILED",
      },
      { status: 500 },
    );
  }
}
