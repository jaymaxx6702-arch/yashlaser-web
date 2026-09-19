import "server-only";

export const paymentsEnabled = () =>
  process.env.PAYMENTS_ENABLED === "true" &&
  Boolean(process.env.PAYMENT_PROVIDER);

export type PaymentCreateResult =
  | { enabled: false; reason: string }
  | {
      enabled: true;
      provider: string;
      publicPayload: Record<string, unknown>;
    };

export async function createPaymentIntent(): Promise<PaymentCreateResult> {
  if (!paymentsEnabled())
    return {
      enabled: false,
      reason: "Online payments are not enabled yet.",
    };

  // Provider adapter intentionally remains closed until a merchant provider is selected
  // and its credentials/webhook contract are verified.
  return {
    enabled: false,
    reason: "Configured payment provider adapter is not installed yet.",
  };
}
