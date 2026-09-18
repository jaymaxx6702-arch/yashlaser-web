import { createHash, randomUUID } from "node:crypto";
import sharp from "sharp";
import { products } from "@/data/catalog";
import { getSupabase, submissionEnabled } from "@/lib/supabase";
import {
  requireReadyDocument,
  type CustomizationDocument,
} from "@/lib/customization/model";
export const runtime = "nodejs";
const MAX_BODY = 14 * 1024 * 1024;
const recent = new Map<string, { count: number; until: number }>();
class InputError extends Error {}
async function limitedForm(request: Request) {
  if (Number(request.headers.get("content-length")) > MAX_BODY)
    throw new InputError("Your upload is too large.");
  const reader = request.body?.getReader();
  if (!reader) throw new InputError("Missing enquiry.");
  const chunks: Uint8Array[] = [];
  let bytes = 0;
  try {
    while (true) {
      const part = await reader.read();
      if (part.done) break;
      bytes += part.value.byteLength;
      if (bytes > MAX_BODY) {
        await reader.cancel();
        throw new InputError("Your upload is too large.");
      }
      chunks.push(part.value);
    }
  } finally {
    reader.releaseLock();
  }
  const body = Buffer.concat(chunks);
  try {
    return await new Request(request.url, {
      method: "POST",
      headers: { "content-type": request.headers.get("content-type") || "" },
      body,
    }).formData();
  } catch {
    throw new InputError("Invalid enquiry form.");
  }
}
export async function POST(request: Request) {
  if (!submissionEnabled())
    return Response.json(
      {
        error:
          "Online submission is not enabled. Please use the WhatsApp enquiry form.",
      },
      { status: 503 },
    );
  if (request.headers.get("origin") !== new URL(request.url).origin)
    return Response.json(
      { error: "Please submit from this website." },
      { status: 403 },
    );
  let uploadedPath: string | null = null;
  let previewPath: string | null = null;
  let currentRequestId: string | null = null;
  const db = getSupabase();
  try {
    const form = await limitedForm(request);
    const value = (key: string, max: number, required = false, trim = true) => {
      const raw = form.get(key);
      if (raw !== null && typeof raw !== "string")
        throw new InputError("Invalid " + key);
      const text = trim ? String(raw || "").trim() : String(raw || "");
      if (text.length > max || (required && !text))
        throw new InputError("Please check " + key);
      return text;
    };
    if (value("website", 200))
      throw new InputError("Unable to accept this enquiry.");
    if (value("consent", 10) !== "on")
      throw new InputError(
        "Please confirm artwork permission and contact consent.",
      );
    const requestId = value("requestId", 36, true);
    currentRequestId = requestId;
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        requestId,
      )
    )
      throw new InputError("Invalid request reference.");
    const product = products.find((p) => p.id === value("productId", 60, true));
    if (!product) throw new InputError("Product not found.");
    const variantId = value("variantId", 60),
      variant = product.variants.find((v) => v.id === variantId);
    if (product.variants.length && (!variant || !variant.available))
      throw new InputError("Please select an available variant.");
    if (!product.variants.length && variantId)
      throw new InputError("Invalid variant.");
    const quantity = Number(value("quantity", 6, true));
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 10000)
      throw new InputError("Quantity must be between 1 and 10000.");
    const name = value("customerName", 80, true),
      phone = value("phone", 20, true),
      email = value("email", 160),
      city = value("city", 100, true);
    if (
      name.length < 2 ||
      !/^\+?[0-9 ()-]{10,20}$/.test(phone) ||
      phone.replace(/\D/g, "").length < 10
    )
      throw new InputError("Please check your name and phone number.");
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
      throw new InputError("Please check your email address.");
    const line1 = value("line1", 120, false, false),
      line2 = value("line2", 180, false, false),
      notes = value("notes", 1000),
      fit = value("fit", 20);
    if (!["contain", "cover"].includes(fit))
      throw new InputError("Invalid preview choice.");
    let design: CustomizationDocument;
    try {
      design = requireReadyDocument(
        JSON.parse(value("customization", 12000, true)),
        product,
      );
    } catch (error) {
      throw new InputError(
        error instanceof Error ? error.message : "Invalid design settings.",
      );
    }
    if (
      design.variantId !== variantId ||
      design.quantity !== quantity ||
      design.text[0].text !== line1 ||
      design.text[1].text !== line2 ||
      design.image.fit !== fit
    )
      throw new InputError(
        "The design and enquiry options do not match. Please review the design again.",
      );
    const designId = createHash("sha256")
      .update(JSON.stringify(design))
      .digest("hex")
      .slice(0, 16);
    if (value("designId", 16, true) !== designId)
      throw new InputError(
        "The design has changed. Please regenerate the preview.",
      );
    const snapshot = form.get("snapshot");
    if (
      !(snapshot instanceof File) ||
      !snapshot.size ||
      snapshot.size > 4 * 1024 * 1024 ||
      snapshot.type !== "image/png"
    )
      throw new InputError("Please regenerate the design preview.");
    let previewBuffer: Buffer;
    try {
      const input = Buffer.from(await snapshot.arrayBuffer());
      const metadata = await sharp(input, {
        limitInputPixels: 1100000,
      }).metadata();
      if (
        metadata.format !== "png" ||
        metadata.width !== 1000 ||
        metadata.height !== 1000 ||
        (metadata.pages ?? 1) > 1
      )
        throw new Error("Invalid preview");
      previewBuffer = await sharp(input, { limitInputPixels: 1100000 })
        .webp({ lossless: true })
        .toBuffer();
    } catch {
      throw new InputError(
        "The preview image is invalid. Please generate it again.",
      );
    }
    const phoneHash = createHash("sha256")
      .update(
        (process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY!) +
          phone.replace(/\D/g, ""),
      )
      .digest("hex");
    const now = Date.now();
    for (const [key, bucket] of recent)
      if (bucket.until < now) recent.delete(key);
    const bucket = recent.get(phoneHash);
    if (bucket && bucket.count >= 5)
      return Response.json(
        { error: "Please wait a few minutes or contact us on WhatsApp." },
        { status: 429 },
      );
    recent.set(phoneHash, {
      count: (bucket?.count || 0) + 1,
      until: bucket?.until || now + 600000,
    });
    const existing = await db
      .from("enquiries")
      .select("reference")
      .eq("request_id", requestId)
      .maybeSingle();
    if (existing.error) throw new Error("Database unavailable");
    if (existing.data)
      return Response.json(
        { reference: existing.data.reference },
        { status: 200 },
      );
    const artwork = form.get("artwork");
    if (
      Boolean(design.artwork) !== (artwork instanceof File && artwork.size > 0)
    )
      throw new InputError(
        "The artwork does not match the design. Please upload it again.",
      );
    if (
      product.categoryId === "standees" &&
      (!(artwork instanceof File) || !artwork.size)
    )
      throw new InputError("Please choose your photograph.");
    if (artwork instanceof File && artwork.size) {
      if (
        artwork.size > 8 * 1024 * 1024 ||
        !["image/jpeg", "image/png", "image/webp"].includes(artwork.type)
      )
        throw new InputError("Choose a JPG, PNG or WebP image up to 8 MB.");
      let buffer: Buffer;
      try {
        const input = Buffer.from(await artwork.arrayBuffer());
        if (
          !design.artwork ||
          design.artwork.sha256 !==
            createHash("sha256").update(input).digest("hex") ||
          design.artwork.bytes !== input.length
        )
          throw new Error("Artwork mismatch");
        const metadata = await sharp(input, {
          limitInputPixels: 25000000,
        }).metadata();
        if (
          !["jpeg", "png", "webp"].includes(metadata.format || "") ||
          (metadata.pages ?? 1) > 1
        )
          throw new Error("Invalid artwork");
        const normalized = await sharp(input, { limitInputPixels: 25000000 })
          .rotate()
          .webp({ lossless: true })
          .toBuffer({ resolveWithObject: true });
        if (
          normalized.info.width !== design.artwork.width ||
          normalized.info.height !== design.artwork.height
        )
          throw new Error("Artwork dimensions mismatch");
        buffer = normalized.data;
        if (buffer.length > 20 * 1024 * 1024)
          throw new Error("Artwork too large");
      } catch {
        throw new InputError(
          "This image cannot be processed. Please use a smaller JPG, PNG or WebP photograph.",
        );
      }
      uploadedPath = randomUUID() + "/artwork.webp";
      const result = await db.storage
        .from("customer-artwork")
        .upload(uploadedPath, buffer, {
          contentType: "image/webp",
          upsert: false,
        });
      if (result.error) throw new Error("Private upload unavailable");
    }
    previewPath = randomUUID() + "/preview.webp";
    const previewUpload = await db.storage
      .from("customer-artwork")
      .upload(previewPath, previewBuffer, {
        contentType: "image/webp",
        upsert: false,
      });
    if (previewUpload.error)
      throw new Error("Private preview upload unavailable");
    const result = await db.rpc("submit_enquiry", {
      payload: {
        request_id: requestId,
        customer_name: name,
        phone,
        email: email || null,
        city,
        phone_hash: phoneHash,
        product_id: product.id,
        product_name: product.name,
        variant_id: variant?.id || null,
        variant_name: variant?.name || null,
        quantity,
        line1,
        line2,
        notes,
        fit,
        unit_price_minor:
          product.pricingMode === "quote_required"
            ? null
            : (variant?.effectivePriceMinor ?? product.effectivePriceMinor),
        artwork_path: uploadedPath,
        preview_path: previewPath,
        customization: design,
        design_id: designId,
      },
    });
    if (result.error) throw new Error("Enquiry save unavailable");
    const saved = result.data as {
      reference: string;
      artwork_path: string | null;
      preview_path: string | null;
    };
    if (uploadedPath && saved.artwork_path !== uploadedPath)
      await db.storage.from("customer-artwork").remove([uploadedPath]);
    if (previewPath && saved.preview_path !== previewPath)
      await db.storage.from("customer-artwork").remove([previewPath]);
    return Response.json({ reference: saved.reference }, { status: 201 });
  } catch (error) {
    // If the RPC response was lost after commit, keep the saved artwork intact.
    const paths = [uploadedPath, previewPath].filter((path): path is string =>
      Boolean(path),
    );
    if (paths.length && currentRequestId) {
      const persisted = await db
        .from("enquiries")
        .select("id")
        .eq("request_id", currentRequestId)
        .maybeSingle();
      if (!persisted.error && !persisted.data)
        await db.storage.from("customer-artwork").remove(paths);
    }
    return Response.json(
      {
        error:
          error instanceof InputError
            ? error.message
            : "We could not save your enquiry. Please try again or contact us on WhatsApp.",
      },
      { status: error instanceof InputError ? 400 : 503 },
    );
  }
}
