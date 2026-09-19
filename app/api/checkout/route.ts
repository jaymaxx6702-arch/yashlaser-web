import { createHash } from "node:crypto";
import { NextResponse } from "next/server";
import { findProduct } from "@/data/catalog";
import { getSupabase, submissionEnabled } from "@/lib/supabase";
import { commerceOrdersEnabled, createCommerceOrder } from "@/lib/commerce-server";

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
  if (!submissionEnabled())
    return NextResponse.json({ error: "Online checkout requests are temporarily unavailable." }, { status: 503 });

  const body = await request.json().catch(() => null);
  const requestId = text(body?.requestId, 36);
  const customer = body?.customer;
  const items = Array.isArray(body?.items) ? (body.items as CartInput[]) : [];

  if (!/^[0-9a-f-]{36}$/i.test(requestId) || !customer || !items.length || items.length > 100)
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
    phone.replace(/\D/g, "").length < 10 ||
    !city ||
    !address ||
    !state ||
    !/^\d{6}$/.test(pincode) ||
    customer.consent !== true
  )
    return NextResponse.json({ error: "Please check your contact and delivery details." }, { status: 400 });

  const canonical = items.map((raw) => {
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

  if (commerceOrdersEnabled()) {
    try {
      const created = await createCommerceOrder({
        requestId,
        customer: { name, phone, email },
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
        { error: error instanceof Error ? error.message : "Unable to create order." },
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
    .update(phone.replace(/\D/g, ""))
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
