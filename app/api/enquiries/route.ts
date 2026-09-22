import sharp from "sharp";
import { getSupabase } from "@/lib/supabase";
import {
  checkQuota,
  digest,
  enquiryJson,
  parseEnquiry,
  enquiryError,
  EnquiryError,
  serverSecret,
} from "@/lib/enquiry-server";
import { verifyTicket } from "@/lib/upload-ticket";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: Request) {
  try {
    const data = await enquiryJson(request),
      input = parseEnquiry(data);
    const reference = await checkQuota(input);
    if (reference) return Response.json({ reference });
    let ticket;
    try {
      ticket = verifyTicket(
        typeof data.uploadReceipt === "string" ? data.uploadReceipt : "",
        serverSecret(),
      );
    } catch (error) {
      throw new EnquiryError(
        error instanceof Error ? error.message : "Invalid upload receipt.",
      );
    }
    if (
      ticket.requestId !== input.requestId ||
      ticket.payloadHash !== input.payloadHash ||
      Boolean(ticket.artworkPath) !== Boolean(input.customization.artwork) ||
      Boolean(ticket.sourceArtworkPath) !==
        Boolean(
          input.customization.sourceArtwork &&
            input.customization.artwork &&
            input.customization.sourceArtwork.sha256 !==
              input.customization.artwork.sha256,
        )
    )
      throw new EnquiryError(
        "Uploads do not match this enquiry. Please retry.",
      );
    const db = getSupabase();
    // Only server-signed, immutable paths are accepted. No client URL/path fetching.
    const download = async (path: string, bytes: number, hash: string) => {
      const r = await db.storage.from("customer-artwork").download(path);
      if (r.error || !r.data)
        throw new EnquiryError(
          "Upload is incomplete. Please retry the upload.",
        );
      if (r.data.size !== bytes)
        throw new EnquiryError("Uploaded file size does not match the design.");
      const buffer = Buffer.from(await r.data.arrayBuffer());
      if (digest(buffer) !== hash)
        throw new EnquiryError("Uploaded file does not match the design.");
      return buffer;
    };
    const validateArtwork = async (
      path: string,
      artwork: NonNullable<typeof input.customization.artwork>,
    ) => {
      const buffer = await download(path, artwork.bytes, artwork.sha256);
      try {
        const meta = await sharp(buffer, {
          limitInputPixels: 25000000,
        }).metadata();
        const mime =
          meta.format === "jpeg" ? "image/jpeg" : `image/${meta.format}`;
        const rotated = Boolean(meta.orientation && meta.orientation >= 5);
        if (
          !["jpeg", "png", "webp"].includes(meta.format || "") ||
          mime !== artwork.mimeType ||
          (meta.pages || 1) !== 1 ||
          (rotated ? meta.height : meta.width) !== artwork.width ||
          (rotated ? meta.width : meta.height) !== artwork.height
        )
          throw new Error();
        await sharp(buffer, { limitInputPixels: 25000000 })
          .rotate()
          .resize(1, 1)
          .png()
          .toBuffer();
      } catch {
        throw new EnquiryError(
          "The uploaded photograph is invalid. Choose a valid JPG, PNG or WebP image.",
        );
      }
    };
    const artwork = input.customization.artwork;
    const sourceArtwork = input.customization.sourceArtwork;
    if (artwork && ticket.artworkPath)
      await validateArtwork(ticket.artworkPath, artwork);
    if (sourceArtwork && ticket.sourceArtworkPath)
      await validateArtwork(ticket.sourceArtworkPath, sourceArtwork);
    const preview = await download(
      ticket.previewPath,
      ticket.previewBytes,
      ticket.previewHash,
    );
    try {
      const meta = await sharp(preview, {
        limitInputPixels: 1100000,
      }).metadata();
      if (
        meta.format !== "png" ||
        meta.width !== 1000 ||
        meta.height !== 1000 ||
        (meta.pages || 1) !== 1
      )
        throw new Error();
      await sharp(preview, { limitInputPixels: 1100000 })
        .resize(1, 1)
        .png()
        .toBuffer();
    } catch {
      throw new EnquiryError("The preview is invalid. Generate it again.");
    }
    const { product, variant, customization: design } = input;
    const result = await db.rpc("submit_enquiry", {
      payload: {
        request_id: input.requestId,
        customer_name: input.customerName,
        phone: input.phone,
        email: input.email || null,
        city: input.city,
        phone_hash: input.phoneHash,
        product_id: product.id,
        product_name: product.name,
        variant_id: variant?.id || null,
        variant_name: variant?.name || null,
        quantity: design.quantity,
        line1: design.text[0].text,
        line2: design.text[1].text,
        notes: input.notes,
        fit: design.image.fit,
        unit_price_minor:
          product.pricingMode === "quote_required"
            ? null
            : (variant?.effectivePriceMinor ?? product.effectivePriceMinor),
        artwork_path: ticket.artworkPath,
        source_artwork_path:
          ticket.sourceArtworkPath || ticket.artworkPath,
        preview_path: ticket.previewPath,
        customization: design,
        design_id: input.designId,
      },
    });
    if (result.error) throw new Error("Save failed");
    const saved = result.data as {
      reference: string;
      enquiry_id?: string;
    };
    if (saved.enquiry_id) {
      let sourceAssetId: string | null = null;
      const originalPath = ticket.sourceArtworkPath || ticket.artworkPath;
      if (sourceArtwork && originalPath) {
        const sourceInsert = await db
          .from("shop_design_assets")
          .insert({
            design_id: input.designId,
            owner_type: "enquiry",
            owner_id: saved.enquiry_id,
            stage: "original",
            source_asset_id: null,
            storage_bucket: "customer-artwork",
            file_path: originalPath,
            file_name: sourceArtwork.name,
            mime_type: sourceArtwork.mimeType,
            file_size: sourceArtwork.bytes,
            sha256: sourceArtwork.sha256,
            width: sourceArtwork.width,
            height: sourceArtwork.height,
          })
          .select("id")
          .maybeSingle();
        sourceAssetId = sourceInsert.data?.id || null;
      }
      let currentAssetId = sourceAssetId;
      if (
        artwork &&
        ticket.artworkPath &&
        (!sourceArtwork || artwork.sha256 !== sourceArtwork.sha256)
      ) {
        const processedInsert = await db
          .from("shop_design_assets")
          .insert({
            design_id: input.designId,
            owner_type: "enquiry",
            owner_id: saved.enquiry_id,
            stage: "processed",
            source_asset_id: sourceAssetId,
            storage_bucket: "customer-artwork",
            file_path: ticket.artworkPath,
            file_name: artwork.name,
            mime_type: artwork.mimeType,
            file_size: artwork.bytes,
            sha256: artwork.sha256,
            width: artwork.width,
            height: artwork.height,
            processor: design.backgroundRemoval.adapter,
          })
          .select("id")
          .maybeSingle();
        currentAssetId = processedInsert.data?.id || null;
      }
      await db.from("shop_design_assets").insert({
        design_id: input.designId,
        owner_type: "enquiry",
        owner_id: saved.enquiry_id,
        stage: "preview",
        source_asset_id: currentAssetId,
        storage_bucket: "customer-artwork",
        file_path: ticket.previewPath,
        file_name: "preview.png",
        mime_type: "image/png",
        file_size: ticket.previewBytes,
        sha256: ticket.previewHash,
        width: 1000,
        height: 1000,
      });
    }
    // Keep immutable files on ambiguous/retried commits. Orphan cleanup is separate.
    return Response.json({ reference: result.data.reference }, { status: 201 });
  } catch (error) {
    return enquiryError(error);
  }
}
