"use client";
import { useState, type FormEvent } from "react";
import { uploadPrivate } from "@/lib/direct-upload";
import { business, whatsappUrl } from "@/data/business";

type Kind = "bulk" | "event" | "custom_acrylic";

export function ProjectRequestForm({ kind }: { kind: Kind }) {
  const [result, setResult] = useState<{ requestNo: string; token: string } | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");
    try {
      const fd = new FormData(e.currentTarget);
      const customer = {
        name: String(fd.get("name") || ""),
        mobile: String(fd.get("mobile") || ""),
        email: String(fd.get("email") || ""),
      };
      const payload = Object.fromEntries(
        Array.from(fd.entries())
          .filter(([key]) => !["name", "mobile", "email", "file"].includes(key))
          .map(([key, value]) => [key, String(value).slice(0, 3000)]),
      );

      const response = await fetch("/api/project-requests", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ requestType: kind, customer, payload }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Unable to save request.");
      setResult(data);
      setStatus("Request saved.");

      if (file) {
        const sessionResponse = await fetch(
          "/api/project-requests/" + encodeURIComponent(data.requestNo) + "/upload-session",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              token: data.token,
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
            }),
          },
        );
        const session = await sessionResponse.json();
        if (!sessionResponse.ok)
          throw new Error(session.error || "Unable to prepare file upload.");

        await uploadPrivate({ path: session.path, url: session.url }, file);

        const confirm = await fetch(
          "/api/project-requests/" + encodeURIComponent(data.requestNo) + "/files",
          {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              token: data.token,
              path: session.path,
              fileName: file.name,
              mimeType: file.type,
              size: file.size,
            }),
          },
        );
        const confirmed = await confirm.json();
        if (!confirm.ok)
          throw new Error(confirmed.error || "Unable to confirm file.");
        setStatus("Request and file saved.");
      }
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to save request.",
      );
    } finally {
      setBusy(false);
    }
  }

  const title =
    kind === "bulk"
      ? "Bulk order request"
      : kind === "event"
        ? "Plan my event"
        : "Custom acrylic request";

  return (
    <form className="project-form" onSubmit={submit}>
      <h2>{title}</h2>
      <div className="checkout-fields">
        <label>
          Your name
          <input name="name" required minLength={2} maxLength={80} />
        </label>
        <label>
          WhatsApp / phone
          <input name="mobile" required minLength={10} maxLength={20} />
        </label>
        <label>
          Email (optional)
          <input name="email" type="email" maxLength={160} />
        </label>

        {kind === "bulk" && (
          <>
            <label>
              Product / requirement
              <input name="product" required maxLength={160} />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min={1} max={100000} required />
            </label>
            <label>
              Required date
              <input name="requiredDate" type="date" />
            </label>
          </>
        )}

        {kind === "event" && (
          <>
            <label>
              Event type
              <input name="eventType" required maxLength={120} />
            </label>
            <label>
              Event date
              <input name="eventDate" type="date" required />
            </label>
            <label>
              Approx. participants / quantity
              <input name="quantity" type="number" min={1} max={100000} />
            </label>
            <label>
              Budget (optional)
              <input name="budget" inputMode="numeric" maxLength={20} />
            </label>
          </>
        )}

        {kind === "custom_acrylic" && (
          <>
            <label>
              Approx. size
              <input name="size" maxLength={120} />
            </label>
            <label>
              Quantity
              <input name="quantity" type="number" min={1} max={10000} required />
            </label>
            <label>
              Required date
              <input name="requiredDate" type="date" />
            </label>
            <label>
              Budget (optional)
              <input name="budget" inputMode="numeric" maxLength={20} />
            </label>
          </>
        )}

        <label className="full">
          Requirement / notes
          <textarea name="notes" rows={5} required maxLength={3000} />
        </label>

        <label className="full">
          File (optional)
          <input
            name="file"
            type="file"
            accept=".pdf,.csv,.xls,.xlsx,image/jpeg,image/png,image/webp"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <small>PDF, Excel/CSV or image · max 20 MB</small>
        </label>
      </div>

      <button className="button" disabled={busy}>
        {busy ? "Submitting…" : "Submit request →"}
      </button>

      {status && <p role="status">{status}</p>}

      {result && (
        <div className="request-success">
          <p>
            Reference: <strong>{result.requestNo}</strong>
          </p>
          <a
            className="text-link"
            href={whatsappUrl(
              "Hello Yash Laser, my " +
                title +
                " reference is " +
                result.requestNo +
                ". Please help me with the next step. " +
                business.url,
            )}
            target="_blank"
            rel="noreferrer"
          >
            Continue on WhatsApp ↗
          </a>
        </div>
      )}
    </form>
  );
}
