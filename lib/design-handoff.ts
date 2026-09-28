import { createHmac, timingSafeEqual } from "node:crypto";

export type DesignHandoffTicket = {
  version: 1;
  enquiryItemId: string;
  designId: string;
  productId: string;
  expiresAt: number;
};

export function signDesignHandoff(ticket: DesignHandoffTicket, key: string) {
  const body = Buffer.from(JSON.stringify(ticket)).toString("base64url");
  const signature = createHmac("sha256", key)
    .update("yl-design-handoff-v1:" + body)
    .digest("base64url");
  return body + "." + signature;
}

export function verifyDesignHandoff(
  token: string,
  key: string,
  now = Date.now(),
): DesignHandoffTicket {
  if (!token || token.length > 2048) throw new Error("Invalid design handoff.");
  const [body, signature, extra] = token.split(".");
  if (!body || !signature || extra) throw new Error("Invalid design handoff.");

  const expected = createHmac("sha256", key)
    .update("yl-design-handoff-v1:" + body)
    .digest();
  const actual = Buffer.from(signature, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected))
    throw new Error("Invalid design handoff.");

  const data = JSON.parse(
    Buffer.from(body, "base64url").toString(),
  ) as DesignHandoffTicket;

  if (
    data.version !== 1 ||
    !/^[0-9a-f-]{36}$/i.test(data.enquiryItemId) ||
    !/^[a-f0-9]{16}$/.test(data.designId) ||
    typeof data.productId !== "string" ||
    !data.productId ||
    data.productId.length > 160 ||
    !Number.isFinite(data.expiresAt) ||
    data.expiresAt <= now
  )
    throw new Error("Design handoff expired or invalid.");

  return data;
}
