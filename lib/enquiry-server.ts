import "server-only";
import { createHash } from "node:crypto";
import { products } from "@/data/catalog";
import { requireReadyDocument } from "@/lib/customization/model";
import { CUSTOMIZATION_ARTWORK_POLICY } from "@/lib/customization/file-policy";
import { MAX_ENQUIRY_BYTES } from "./enquiry-limits";
import { getSupabase, submissionEnabled } from "./supabase";
import { consumeRequestRateLimit } from "@/lib/rate-limit";
export class EnquiryError extends Error {
  constructor(
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}
export const serverSecret = () =>
  (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY)!;
export const digest = (text: string | Buffer) =>
  createHash("sha256").update(text).digest("hex");
const attempts = new Map<string, { count: number; until: number }>();
export async function enquiryJson(request: Request) {
  if (!submissionEnabled())
    throw new EnquiryError(
      "Online submission is unavailable. Please contact us on WhatsApp.",
      503,
    );
  if (request.headers.get("origin") !== new URL(request.url).origin)
    throw new EnquiryError("Please submit from this website.", 403);
  if (
    !request.headers
      .get("content-type")
      ?.toLowerCase()
      .startsWith("application/json")
  )
    throw new EnquiryError("Send enquiry metadata as JSON.", 415);
  if (!(await consumeRequestRateLimit(request, "enquiry_ip", 60, 600)))
    throw new EnquiryError(
      "Too many attempts. Please wait or contact us on WhatsApp.",
      429,
    );

  const ip = process.env.VERCEL
    ? request.headers.get("x-real-ip") || "unknown"
    : "local";
  const key = digest(ip),
    now = Date.now();
  for (const [id, entry] of attempts)
    if (entry.until < now) attempts.delete(id);
  const previous = attempts.get(key);
  if (
    (previous && previous.count >= 40) ||
    (!previous && attempts.size >= 5000)
  )
    throw new EnquiryError(
      "Too many attempts. Please wait or contact us on WhatsApp.",
      429,
    );
  attempts.set(key, {
    count: (previous?.count || 0) + 1,
    until: previous?.until || now + 600000,
  });
  if (Number(request.headers.get("content-length")) > MAX_ENQUIRY_BYTES)
    throw new EnquiryError("Enquiry metadata is too large.", 413);
  const reader = request.body?.getReader();
  if (!reader) throw new EnquiryError("Missing enquiry.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > MAX_ENQUIRY_BYTES) {
        await reader.cancel();
        throw new EnquiryError("Enquiry metadata is too large.", 413);
      }
      chunks.push(next.value);
    }
  } finally {
    reader.releaseLock();
  }
  try {
    const data = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!data || typeof data !== "object" || Array.isArray(data))
      throw new Error();
    return data as Record<string, unknown>;
  } catch {
    throw new EnquiryError("Invalid enquiry JSON.");
  }
}
export function parseEnquiry(data: Record<string, unknown>) {
  const text = (key: string, max: number, required = false) => {
    const v = data[key] ?? "";
    if (typeof v !== "string" || v.length > max || (required && !v.trim()))
      throw new EnquiryError("Please check " + key);
    return v.trim();
  };
  if (text("website", 200) || data.consent !== true)
    throw new EnquiryError(
      "Please confirm artwork permission and contact consent.",
    );
  const requestId = text("requestId", 36, true);
  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      requestId,
    )
  )
    throw new EnquiryError("Invalid request reference.");
  const product = products.find((p) => p.id === text("productId", 60, true));
  if (!product) throw new EnquiryError("Product not found.");
  let design;
  try {
    design = requireReadyDocument(data.customization, product);
  } catch {
    throw new EnquiryError(
      "Please check your product options and customization.",
    );
  }
  const sourceInput = data.sourceArtwork;
  let sourceArtwork: null | {
    bytes: number;
    sha256: string;
    mimeType: (typeof CUSTOMIZATION_ARTWORK_POLICY.mimeTypes)[number];
    name: string;
  } = null;
  if (sourceInput !== null && sourceInput !== undefined) {
    if (
      typeof sourceInput !== "object" ||
      Array.isArray(sourceInput)
    )
      throw new EnquiryError("Invalid original artwork metadata.");
    const source = sourceInput as Record<string, unknown>;
    const bytes = Number(source.bytes);
    const sha256 =
      typeof source.sha256 === "string" ? source.sha256.toLowerCase() : "";
    const mimeType =
      typeof source.mimeType === "string" ? source.mimeType.toLowerCase() : "";
    const name = typeof source.name === "string" ? source.name.trim() : "";
    if (
      !Number.isInteger(bytes) ||
      bytes < 1 ||
      bytes > CUSTOMIZATION_ARTWORK_POLICY.maxBytes ||
      !/^[a-f0-9]{64}$/.test(sha256) ||
      !CUSTOMIZATION_ARTWORK_POLICY.mimeTypes.includes(
        mimeType as (typeof CUSTOMIZATION_ARTWORK_POLICY.mimeTypes)[number],
      ) ||
      !name ||
      name.length > 180
    )
      throw new EnquiryError("Invalid original artwork metadata.");
    sourceArtwork = {
      bytes,
      sha256,
      mimeType:
        mimeType as (typeof CUSTOMIZATION_ARTWORK_POLICY.mimeTypes)[number],
      name,
    };
  }
  if (
    Boolean(design.backgroundRemoval.adapter) !== Boolean(sourceArtwork)
  )
    throw new EnquiryError(
      "Original artwork is required for processed designs.",
    );

  const designId = digest(JSON.stringify(design)).slice(0, 16);
  if (
    text("designId", 16, true) !== designId ||
    data.variantId !== design.variantId ||
    data.quantity !== design.quantity
  )
    throw new EnquiryError(
      "Your design and selected options do not match. Review your design again.",
    );
  const customerName = text("customerName", 80, true),
    phone = text("phone", 20, true),
    email = text("email", 160),
    city = text("city", 100, true),
    notes = text("notes", 1000);
  if (
    customerName.length < 2 ||
    !/^\+?[0-9 ()-]{10,20}$/.test(phone) ||
    phone.replace(/\D/g, "").length < 10 ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
  )
    throw new EnquiryError("Please check your contact details.");
  const normalized = {
    requestId,
    productId: product.id,
    variantId: design.variantId,
    quantity: design.quantity,
    designId,
    customization: design,
    sourceArtwork,
    customerName,
    phone,
    email,
    city,
    notes,
    consent: true,
  };
  return {
    ...normalized,
    product,
    variant: product.variants.find((v) => v.id === design.variantId),
    phoneHash: digest(serverSecret() + phone.replace(/\D/g, "")),
    payloadHash: digest(JSON.stringify(normalized)),
  };
}
export async function checkQuota(input: ReturnType<typeof parseEnquiry>) {
  const db = getSupabase();
  const existing = await db
    .from("enquiries")
    .select("reference")
    .eq("request_id", input.requestId)
    .maybeSingle();
  if (existing.error) throw new Error("Database unavailable");
  if (existing.data) return existing.data.reference as string;
  const count = await db
    .from("enquiries")
    .select("id", { count: "exact", head: true })
    .eq("phone_hash", input.phoneHash)
    .gte("created_at", new Date(Date.now() - 600000).toISOString());
  if (count.error) throw new Error("Database unavailable");
  if ((count.count || 0) >= 5)
    throw new EnquiryError(
      "Please wait a few minutes or contact us on WhatsApp.",
      429,
    );
  return null;
}
export function enquiryError(error: unknown) {
  const status = error instanceof EnquiryError ? error.status : 503;
  return Response.json(
    {
      error:
        error instanceof EnquiryError
          ? error.message
          : "We could not complete your enquiry. Retry or contact us on WhatsApp.",
    },
    {
      status,
      headers: {
        "Cache-Control": "no-store",
        ...(status === 429 ? { "Retry-After": "600" } : {}),
      },
    },
  );
}
