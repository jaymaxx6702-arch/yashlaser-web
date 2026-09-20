"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import {
  resolveSelection,
  type CustomizationProduct,
} from "@/lib/customization";
import { business, whatsappUrl } from "@/data/business";
import {
  blobHash,
  postEnquiryJson,
  uploadPrivate,
  type UploadSession,
} from "@/lib/direct-upload";
import { CustomizationEditor } from "@/components/customization/CustomizationEditor";
import { CanvasPreview } from "@/components/customization/CanvasPreview";
import { useCustomization } from "@/components/customization/useCustomization";
import {
  createSnapshot,
  downloadBlob,
  type CustomizationSnapshot,
} from "@/lib/customization/snapshot";
import type { BackgroundRemovalAdapter } from "@/lib/customization/background-removal";
import { addCartItem } from "@/lib/cart";
import type { UiLanguage } from "@/lib/i18n";
const emptyCustomer = {
  customerName: "",
  phone: "",
  email: "",
  city: "",
  notes: "",
  consent: false,
};
export function CustomizationForm({
  product: p,
  onlineSubmission,
  initialSelection,
  selectionOverrides = {},
  backgroundRemovalAdapter,
  lang = "en",
}: {
  product: CustomizationProduct;
  onlineSubmission: boolean;
  initialSelection?: { variantId: string; quantity: number };
  selectionOverrides?: { variantId?: string; quantity?: number };
  backgroundRemovalAdapter?: BackgroundRemovalAdapter;
  lang?: UiLanguage;
}) {
  const prefix = lang === "en" ? "" : "/" + lang;
  const productPath = prefix + "/products/" + p.slug;
  const editor = useCustomization(
    p,
    initialSelection ?? resolveSelection(p),
    selectionOverrides,
  );
  const router = useRouter();
  const [step, setStep] = useState<"design" | "enquiry" | "success">("design");
  const [snapshot, setSnapshot] = useState<CustomizationSnapshot | null>(null),
    [customer, setCustomer] = useState(emptyCustomer);
  const [busy, setBusy] = useState(false),
    [overflow, setOverflow] = useState(false);
  const [success, setSuccess] = useState<{
    reference: string;
    message: string;
    saved: boolean;
  } | null>(null);
  const requestKey = useRef({ fingerprint: "", id: "" });
  const uploadSession = useRef<{
    requestId: string;
    session: UploadSession;
  } | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  async function prepare(review = false) {
    editor.setError("");
    setBusy(true);
    try {
      const next = await createSnapshot(editor.document, editor.bitmap, p);
      setSnapshot(next);
      await editor.flush();
      if (review) setStep("enquiry");
      else downloadBlob(next.png, "YL-design-" + next.designId + ".png");
    } catch (e) {
      editor.setError(
        e instanceof Error ? e.message : "Unable to generate your preview.",
      );
    } finally {
      setBusy(false);
    }
  }
  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!snapshot) return;
    setBusy(true);
    editor.setError("");
    try {
      if (
        !customer.consent ||
        customer.customerName.trim().length < 2 ||
        customer.phone.replace(/\D/g, "").length < 10
      )
        throw new Error("Please check your name, phone number and consent.");
      const doc = snapshot.document,
        variant = p.variants.find((v) => v.id === doc.variantId);
      const fingerprint = JSON.stringify([snapshot.designId, customer]);
      if (requestKey.current.fingerprint !== fingerprint)
        requestKey.current = { fingerprint, id: crypto.randomUUID() };
      const requestId = requestKey.current.id;
      const payload = {
        ...customer,
        requestId,
        productId: p.id,
        variantId: doc.variantId,
        quantity: doc.quantity,
        customization: doc,
        designId: snapshot.designId,
        website: String(new FormData(e.currentTarget).get("website") || ""),
      };
      let reference = "YL-DRAFT-" + requestId.slice(0, 8).toUpperCase(),
        saved = false;
      if (onlineSubmission) {
        setUploadStatus("Preparing private upload…");
        let session =
          uploadSession.current?.requestId === requestId &&
          uploadSession.current.session.expiresAt > Date.now() + 10000
            ? uploadSession.current.session
            : null;
        if (!session) {
          const signed = await postEnquiryJson("/api/enquiries/uploads", {
            ...payload,
            preview: {
              bytes: snapshot.png.size,
              sha256: await blobHash(snapshot.png),
            },
          });
          if (signed.reference) {
            reference = signed.reference;
            saved = true;
          } else {
            session = signed as UploadSession;
            uploadSession.current = { requestId, session };
          }
        }
        if (!saved && session) {
          if (session.artwork && !session.artworkDone) {
            if (!editor.artwork)
              throw new Error("Please select your artwork again.");
            setUploadStatus("Uploading original artwork privately…");
            await uploadPrivate(session.artwork, editor.artwork);
            session.artworkDone = true;
          }
          if (!session.previewDone) {
            setUploadStatus("Uploading preview privately…");
            await uploadPrivate(session.preview, snapshot.png);
            session.previewDone = true;
          }
          setUploadStatus("Verifying artwork and saving enquiry…");
          const result = await postEnquiryJson("/api/enquiries", {
            ...payload,
            uploadReceipt: session.receipt,
          });
          reference = result.reference;
        }
        saved = true;
      }
      const message = [
        "Hello Yash Laser, " +
          (saved
            ? "my enquiry reference is "
            : "my enquiry draft reference is ") +
          reference +
          ".",
        "Design: " + snapshot.designId,
        "Product: " + p.name,
        "Size / option: " + (variant?.name || "Please confirm"),
        "Quantity: " + doc.quantity,
        "Text: " +
          doc.text
            .map((t) => t.text)
            .filter(Boolean)
            .join(" / "),
        "Name: " + customer.customerName,
        "Phone: " + customer.phone,
        "Email: " + (customer.email || "Not provided"),
        "Location: " + customer.city,
        "Notes: " + (customer.notes || "None"),
        business.url + productPath,
        saved
          ? "My artwork, design settings and indicative preview are saved with this enquiry."
          : "I will attach the downloaded design preview and original artwork in this conversation.",
        "Please confirm the quotation and final digital mockup before production.",
      ].join("\n");
      setSuccess({ reference, message, saved });
      setUploadStatus("");
      setStep("success");
    } catch (e) {
      editor.setError(
        e instanceof Error ? e.message : "Unable to prepare your enquiry.",
      );
    } finally {
      setBusy(false);
    }
  }
  function addSavedDesignToCart() {
    if (!snapshot || !success?.saved) return;
    const variant = p.variants.find((v) => v.id === snapshot.document.variantId);
    const unitPriceMinor =
      p.pricingMode === "quote_required"
        ? null
        : (variant?.effectivePriceMinor ?? p.effectivePriceMinor) || null;
    addCartItem({
      productId: p.id,
      slug: p.slug,
      name: p.name,
      variantId: variant?.id || "",
      variantName: variant?.name || "To confirm",
      quantity: snapshot.document.quantity,
      unitPriceMinor,
      pricingMode: p.pricingMode,
      designId: snapshot.designId,
      notes: "Saved enquiry " + success.reference,
    });
    router.push(prefix + "/cart");
  }

  async function share() {
    if (!snapshot) return;
    const file = new File(
      [snapshot.png],
      "YL-design-" + snapshot.designId + ".png",
      { type: "image/png" },
    );
    try {
      if (navigator.canShare?.({ files: [file] }) && navigator.share)
        await navigator.share({
          files: [file],
          title: "Yash Laser design " + snapshot.designId,
          text:
            success?.message ||
            "Indicative preview. Final digital mockup approval required.",
        });
      else downloadBlob(snapshot.png, file.name);
    } catch (e) {
      if (!(e instanceof DOMException && e.name === "AbortError"))
        editor.setError(
          "Sharing is unavailable. Use Download preview and attach it in WhatsApp.",
        );
    }
  }
  if (!editor.ready)
    return (
      <p className="editor-status" role="status">
        Preparing your customization editor…
      </p>
    );
  const locked = busy || editor.processing;
  return (
    <div className="customization-workspace" aria-busy={locked}>
      <nav className="editor-steps" aria-label="Customization steps">
        <button
          type="button"
          aria-current={step === "design" ? "step" : undefined}
          disabled={locked}
          onClick={() => setStep("design")}
        >
          1. Design
        </button>
        <span>→</span>
        <button
          type="button"
          aria-current={step !== "design" ? "step" : undefined}
          disabled={locked}
          onClick={() => void prepare(true)}
        >
          2. Review & enquire
        </button>
      </nav>
      <p className="muted" role="status">
        {editor.storageMessage} Customer contact details are not stored in this
        draft.
      </p>
      {editor.error && (
        <p className="form-error" role="alert">
          {editor.error}{" "}
          {step === "enquiry" && (
            <a
              href={whatsappUrl(
                `Hello Yash Laser, please help with my enquiry for ${p.name}. Design: ${snapshot?.designId || "not generated"}. Size: ${p.variants.find((v) => v.id === editor.document.variantId)?.name || "To confirm"}. Quantity: ${editor.document.quantity}. I will attach my preview and artwork. ${business.url}${productPath}`,
              )}
              target="_blank"
              rel="noreferrer"
            >
              Continue enquiry on WhatsApp ↗
            </a>
          )}
        </p>
      )}
      {editor.processing && <p role="status">Preparing your photograph…</p>}
      {busy && uploadStatus && <p role="status">{uploadStatus}</p>}
      {overflow && step === "design" && (
        <p className="form-error" role="alert">
          Some text does not fit. Shorten it or reduce its font size before
          continuing.
        </p>
      )}
      {step === "design" ? (
        <>
          <CustomizationEditor
            document={editor.document}
            bitmap={editor.bitmap}
            product={p}
            onChange={editor.setDocument}
            onUpload={(f) => void editor.upload(f, f.name)}
            onReset={() => {
              editor.reset();
              setSnapshot(null);
              setSuccess(null);
              requestKey.current = { fingerprint: "", id: "" };
            }}
            onOverflow={setOverflow}
            processing={locked}
            adapter={backgroundRemovalAdapter}
            onRemoveBackground={() => {
              if (backgroundRemovalAdapter)
                void editor.applyBackgroundRemoval(backgroundRemovalAdapter);
            }}
            onDownload={() => void prepare()}
          />
          <div className="editor-bottom-actions">
            <a
              className="text-link"
              href={productPath}
              onClick={async (e) => {
                e.preventDefault();
                if (await editor.flush()) router.push(productPath);
                else
                  editor.setError(
                    "Download a preview before leaving: this browser could not save the draft.",
                  );
              }}
            >
              ← Back to product
            </a>
            <button
              type="button"
              className="button"
              disabled={locked || overflow}
              onClick={() => void prepare(true)}
            >
              Review & enquire →
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="review-grid">
            <section className="review-preview">
              {snapshot && (
                <>
                  <CanvasPreview
                    document={snapshot.document}
                    bitmap={editor.bitmap}
                    product={p}
                  />
                  <p className="muted">
                    Design {snapshot.designId} · indicative preview
                  </p>
                  <div className="editor-toolbar">
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(
                          snapshot.png,
                          "YL-design-" + snapshot.designId + ".png",
                        )
                      }
                    >
                      Download preview
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadBlob(
                          snapshot.json,
                          "YL-design-" + snapshot.designId + ".json",
                        )
                      }
                    >
                      Download design settings
                    </button>
                    <button type="button" onClick={() => void share()}>
                      Share preview…
                    </button>
                  </div>
                </>
              )}
            </section>
            {step === "success" && success ? (
              <section className="enquiry-success" role="status">
                <p className="eyebrow">
                  {success.saved ? "Enquiry saved" : "WhatsApp enquiry ready"}
                </p>
                <h2>
                  {success.saved
                    ? "Thank you. Let’s discuss your idea."
                    : "Send your enquiry with the preview."}
                </h2>
                <p>
                  Reference: <strong>{success.reference}</strong>
                </p>
                <p>
                  {success.saved
                    ? "Your design settings, preview and any uploaded artwork are saved privately. Continue on WhatsApp to discuss the quotation."
                    : "This is a draft, not a submitted order. Open WhatsApp, send the message, then attach your downloaded preview and original artwork."}
                </p>
                <div className="editor-toolbar">
                  <a
                    className="button"
                    href={whatsappUrl(success.message)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Continue on WhatsApp ↗
                  </a>
                  {success.saved && (
                    <button
                      className="button button-secondary"
                      type="button"
                      onClick={addSavedDesignToCart}
                    >
                      Add saved design to cart →
                    </button>
                  )}
                </div>
                <p>
                  No payment or production begins until your quotation and
                  digital mockup are approved.
                </p>
                <button
                  type="button"
                  className="text-link"
                  onClick={() => setStep("design")}
                >
                  Edit this design
                </button>
              </section>
            ) : (
              <form className="enquiry-form" onSubmit={submit}>
                <h2>Your enquiry</h2>
                <p>
                  {p.name}
                  <br />
                  {p.variants.find((v) => v.id === editor.document.variantId)
                    ?.name || "Size to confirm"}{" "}
                  · Quantity {editor.document.quantity}
                </p>
                <p className="muted">
                  The snapshot includes your crop, position and text choices.
                  Final dimensions and print colours require approval.
                </p>
                <fieldset disabled={locked}>
                  <legend>Your contact details</legend>
                  <label>
                    Your name
                    <input
                      name="customerName"
                      autoComplete="name"
                      minLength={2}
                      maxLength={80}
                      required
                      value={customer.customerName}
                      onChange={(e) =>
                        setCustomer({
                          ...customer,
                          customerName: e.target.value,
                        })
                      }
                    />
                  </label>
                  <label>
                    WhatsApp / phone
                    <input
                      name="phone"
                      type="tel"
                      autoComplete="tel"
                      pattern={"[+]?[0-9\\s\\(\\)\\-]{10,20}"}
                      maxLength={20}
                      required
                      value={customer.phone}
                      onChange={(e) =>
                        setCustomer({ ...customer, phone: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    City / delivery location
                    <input
                      name="city"
                      autoComplete="address-level2"
                      maxLength={100}
                      required
                      value={customer.city}
                      onChange={(e) =>
                        setCustomer({ ...customer, city: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Email (optional)
                    <input
                      name="email"
                      type="email"
                      autoComplete="email"
                      maxLength={160}
                      value={customer.email}
                      onChange={(e) =>
                        setCustomer({ ...customer, email: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Special instructions
                    <textarea
                      name="notes"
                      rows={3}
                      maxLength={1000}
                      value={customer.notes}
                      onChange={(e) =>
                        setCustomer({ ...customer, notes: e.target.value })
                      }
                    />
                  </label>
                  <div className="honeypot" aria-hidden="true">
                    <label>
                      Leave blank
                      <input name="website" tabIndex={-1} autoComplete="off" />
                    </label>
                  </div>
                  <label className="consent">
                    <input
                      type="checkbox"
                      name="consent"
                      required
                      checked={customer.consent}
                      onChange={(e) =>
                        setCustomer({ ...customer, consent: e.target.checked })
                      }
                    />
                    <span>
                      I have permission to use this artwork and agree to be
                      contacted about this enquiry.{" "}
                      <Link href={prefix + "/privacy"}>Artwork & privacy</Link>
                    </span>
                  </label>
                </fieldset>
                <button type="submit" className="button" disabled={locked}>
                  {busy
                    ? "Preparing…"
                    : onlineSubmission
                      ? "Submit enquiry"
                      : "Prepare WhatsApp enquiry"}{" "}
                  ↗
                </button>
                <p className="muted">
                  Enquiry only.{" "}
                  {onlineSubmission
                    ? "Artwork and preview are uploaded privately on submission."
                    : "Attach the preview and artwork in WhatsApp; files are not sent automatically."}
                </p>
                <button
                  type="button"
                  className="text-link"
                  disabled={locked}
                  onClick={() => setStep("design")}
                >
                  ← Back to design
                </button>
              </form>
            )}
          </div>
        </>
      )}
    </div>
  );
}
