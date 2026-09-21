import "server-only";
import { tokenHash } from "@/lib/commerce-server";
import { getSupabase } from "@/lib/supabase";

export const paymentsEnabled = () =>
  process.env.PAYMENTS_ENABLED === "true" &&
  Boolean(process.env.PAYMENT_PROVIDER);

export type PaymentOrderContext = {
  orderId: string;
  orderNo: string;
  customerName: string;
  customerEmail: string | null;
  customerMobile: string;
  currency: string;
  totalMinor: number;
  paidMinor: number;
  outstandingMinor: number;
};

export type PaymentCreateResult =
  | { enabled: false; reason: string; code: string }
  | {
      enabled: true;
      provider: string;
      order: PaymentOrderContext;
      publicPayload: Record<string, unknown>;
    };

export type PaymentProviderAdapter = {
  name: string;
  createPayment(input: {
    order: PaymentOrderContext;
    idempotencyKey: string;
  }): Promise<{
    providerReference: string;
    publicPayload: Record<string, unknown>;
    providerPayload?: Record<string, unknown>;
  }>;
};

function normalizedProvider() {
  return String(process.env.PAYMENT_PROVIDER || "").trim().toLowerCase();
}

function providerAdapter(): PaymentProviderAdapter | null {
  // Provider-specific adapters are intentionally registered only after
  // merchant credentials and webhook contracts are verified.
  return null;
}

export async function resolvePayableOrder(input: {
  orderNo: string;
  token: string;
}): Promise<PaymentOrderContext | null> {
  const orderNo = input.orderNo.trim().slice(0, 40);
  const token = input.token.trim().slice(0, 100);
  if (!orderNo || token.length < 20) return null;

  const db = getSupabase();
  const { data: order, error } = await db
    .from("shop_orders")
    .select(
      "id,order_no,customer_name,customer_email,customer_mobile,status,payment_status,currency,total_minor",
    )
    .eq("order_no", orderNo)
    .eq("access_token_hash", tokenHash(token))
    .maybeSingle();

  if (error || !order) return null;
  if (order.status === "cancelled") return null;
  if (order.payment_status === "refunded") return null;

  const totalMinor = Number(order.total_minor || 0);
  if (!Number.isSafeInteger(totalMinor) || totalMinor <= 0) return null;

  const { data: paidRows, error: paidError } = await db
    .from("shop_payments")
    .select("amount_minor")
    .eq("order_id", order.id)
    .eq("status", "paid");

  if (paidError) throw new Error("Unable to verify previous payments.");

  const paidMinor = (paidRows || []).reduce((sum, row) => {
    const amount = Number(row.amount_minor || 0);
    return Number.isSafeInteger(amount) && amount > 0 ? sum + amount : sum;
  }, 0);
  const outstandingMinor = Math.max(0, totalMinor - paidMinor);

  return {
    orderId: String(order.id),
    orderNo: String(order.order_no),
    customerName: String(order.customer_name),
    customerEmail:
      typeof order.customer_email === "string" ? order.customer_email : null,
    customerMobile: String(order.customer_mobile),
    currency: String(order.currency || "INR"),
    totalMinor,
    paidMinor,
    outstandingMinor,
  };
}

export async function createPaymentIntent(input: {
  orderNo: string;
  token: string;
}): Promise<PaymentCreateResult> {
  if (!paymentsEnabled())
    return {
      enabled: false,
      reason: "Online payments are not enabled yet.",
      code: "PAYMENT_NOT_CONFIGURED",
    };

  const order = await resolvePayableOrder(input);
  if (!order)
    return {
      enabled: false,
      reason: "Order is not payable or the secure order link is invalid.",
      code: "ORDER_NOT_PAYABLE",
    };

  if (order.outstandingMinor <= 0)
    return {
      enabled: false,
      reason: "This order has no outstanding balance.",
      code: "ORDER_ALREADY_PAID",
    };

  const adapter = providerAdapter();
  if (!adapter)
    return {
      enabled: false,
      reason:
        "Configured payment provider adapter is not installed yet.",
      code: "PAYMENT_ADAPTER_MISSING",
    };

  const idempotencyKey = [
    adapter.name,
    order.orderId,
    order.outstandingMinor,
    order.currency,
  ].join(":");

  const created = await adapter.createPayment({ order, idempotencyKey });

  const db = getSupabase();
  const { error } = await db.from("shop_payments").upsert(
    {
      order_id: order.orderId,
      provider: adapter.name,
      provider_reference: created.providerReference,
      amount_minor: order.outstandingMinor,
      currency: order.currency,
      status: "created",
      idempotency_key: idempotencyKey,
      provider_payload: created.providerPayload || {},
      updated_at: new Date().toISOString(),
    },
    { onConflict: "idempotency_key" },
  );

  if (error) throw new Error("Unable to record payment session.");

  return {
    enabled: true,
    provider: adapter.name,
    order,
    publicPayload: created.publicPayload,
  };
}

export function paymentProviderName() {
  return normalizedProvider();
}
