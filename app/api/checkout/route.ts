import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { findProduct } from "@/data/catalog";
import { getSupabase, submissionEnabled } from "@/lib/supabase";
import { commerceOrdersEnabled, createCommerceOrder } from "@/lib/commerce-server";
import { RequestBodyError, readJsonBody } from "@/lib/request-security";
import { consumeRequestRateLimit, consumeShopRateLimit, rateLimitResponse } from "@/lib/rate-limit";
import { customerUser } from "@/lib/customer-auth";

type CheckoutCustomer = {
  name?: unknown;
  phone?: unknown;
  email?: unknown;
  city?: unknown;
  address?: unknown;
  state?: unknown;
  pincode?: unknown;
  notes?: unknown;
  consent?: unknown;
};

type CheckoutBody = {
  requestId?: unknown;
  customer?: unknown;
  items?: unknown;
};

type CartInput = {
  productId?: string;
  slug?: string;
  variantId?: string;
  quantity?: number;
  designId?: string;
  notes?: string;
};

const text = (value: unknown, max: number) =>
  typeof value === "string" ? value.trim().slice(0, max) : "";

export async function POST(request: Request) {
  if (!(await consumeRequestRateLimit(request, "checkout_ip", 30, 600)))
    return rateLimitResponse(600);

  if (!submissionEnabled())
    return NextResponse.json({ error: "Online checkout requests are temporarily unavailable." }, { status: 503 });

  let body: CheckoutBody | null;
  try {
    body = await readJsonBody<CheckoutBody>(request, 64 * 1024);
  } catch (error) {
    const status = error instanceof RequestBodyError ? error.status : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid request." },
      { status },
    );
  }
  const requestId = text(body?.requestId, 36);
  const customer =
    body?.customer && typeof body.customer === "object"
      ? (body.customer as CheckoutCustomer)
      : null;
  const items = Array.isArray(body?.items) ? (body.items as CartInput[]) : [];

  if (
    !/^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/i.test(
      requestId,
    ) ||
    !customer ||
    !items.length ||
    items.length > 100
  )
    return NextResponse.json({ error: "Invalid checkout request." }, { status: 400 });

  const name = text(customer.name, 80);
  const phone = text(customer.phone, 20);
  const email = text(customer.email, 160);
  const city = text(customer.city, 100);
  const address = text(customer.address, 500);
  const state = text(customer.state, 100);
  const pincode = text(customer.pincode, 6);
  const notes = text(customer.notes, 1000);
  if (
    name.length < 2 ||
    !/^\+?[0-9 ()-]{10,20}$/.test(phone) ||
    phone.replace(/\D/g, "").length < 10 ||
    (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) ||
    !city ||
    !address ||
    !state ||
    !/^\d{6}$/.test(pincode) ||
    customer.consent !== true
  )
    return NextResponse.json({ error: "Please check your contact and delivery details." }, { status: 400 });

  const allowed = await consumeShopRateLimit(
    "checkout",
    phone.replace(/\D/g, ""),
    10,
    600,
  );
  if (!allowed)
    return NextResponse.json(
      { error: "Too many checkout attempts. Please try again later." },
      { status: 429 },
    );

  let canonical;
  try {
    canonical = items.map((raw) => {
    const p = typeof raw.slug === "string" ? findProduct(raw.slug) : undefined;
    const qty = Number(raw.quantity);
    if (!p || p.id !== raw.productId || !Number.isInteger(qty) || qty < 1 || qty > 10000)
      throw new Error("One cart item is no longer valid.");
    const variant = p.variants.find((v) => v.id === raw.variantId);
    if (p.variants.length && (!variant || !variant.available))
      throw new Error("One selected product option is no longer available.");
    const unit =
      p.pricingMode === "quote_required"
        ? null
        : (variant?.effectivePriceMinor ?? p.effectivePriceMinor) || null;
      return {
        product: p,
        variant,
        quantity: qty,
        unitPriceMinor: unit,
        designId: text(raw.designId, 100),
        notes: text(raw.notes, 500),
      };
    });
  } catch {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid cart." },
      { status: 400 },
    );
  }

  if (commerceOrdersEnabled()) {
    try {
      const accountUser = await customerUser();
      const created = await createCommerceOrder({
        requestId,
        customer: {
          name,
          phone,
          email,
          userId: accountUser?.id || null,
        },
        shipping: { address, city, state, pincode, notes },
        items: canonical.map((item) => ({
          productId: item.product.id,
          productSlug: item.product.slug,
          productName: item.product.name,
          variantId: item.variant?.id || null,
          variantName: item.variant?.name || null,
          quantity: item.quantity,
          unitPriceMinor: item.unitPriceMinor,
          pricingMode: item.product.pricingMode,
          designId: item.designId || null,
          configuration: { notes: item.notes || null },
        })),
      });
      const trackingPath = created.accessToken
        ? `/track-order?order=${encodeURIComponent(created.orderNo)}&token=${encodeURIComponent(created.accessToken)}`
        : null;
      return NextResponse.json({
        reference: created.orderNo,
        order: true,
        trackingPath,
        idempotent: created.idempotent,
      });
    } catch (error) {
      return NextResponse.json(
        { error: "Unable to create order." },
        { status: 500 },
      );
    }
  }

  const db = getSupabase();
  const { data: existing } = await db
    .from("enquiries")
    .select("id,reference")
    .eq("request_id", requestId)
    .maybeSingle();
  if (existing) return NextResponse.json({ reference: existing.reference, idempotent: true });

  const phoneHash = createHash("sha256")
    .update(
      (process.env.SUPABASE_SECRET_KEY ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "") + phone.replace(/\D/g, ""),
    )
    .digest("hex");
  const { data: enquiry, error: enquiryError } = await db
    .from("enquiries")
    .insert({
      request_id: requestId,
      customer_name: name,
      phone,
      email: email || null,
      city,
      phone_hash: phoneHash,
      status: "new",
    })
    .select("id,reference")
    .single();
  if (enquiryError || !enquiry)
    return NextResponse.json({ error: "Unable to create your request." }, { status: 500 });

  const shipping = { address, city, state, pincode, notes };
  const rows = canonical.map((item) => ({
    enquiry_id: enquiry.id,
    product_id: item.product.id,
    product_name: item.product.name,
    variant_id: item.variant?.id || null,
    variant_name: item.variant?.name || null,
    quantity: item.quantity,
    unit_price_minor: item.unitPriceMinor,
    line1: "",
    line2: "",
    notes: item.notes,
    preview_fit: "contain",
    artwork_path: null,
    customization: {
      source: "cart_checkout",
      designId: item.designId || null,
      shipping,
    },
    design_id: item.designId || null,
  }));
  const { error: itemError } = await db.from("enquiry_items").insert(rows);
  if (itemError) {
    await db.from("enquiries").delete().eq("id", enquiry.id);
    return NextResponse.json({ error: "Unable to save your cart items." }, { status: 500 });
  }

  return NextResponse.json({ reference: enquiry.reference });
}
