"use client";
import { useState, type FormEvent } from "react";
import { uploadPrivate } from "@/lib/direct-upload";

export function AdminProofUploader() {
  const [orderId, setOrderId] = useState("");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState("");
  const [customerPath, setCustomerPath] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!file) return;
    setBusy(true);
    setStatus("Preparing private upload…");
    setCustomerPath("");
    try {
      const sessionResponse = await fetch("/api/admin/proofs/upload-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId,
          fileName: file.name,
          mimeType: file.type,
          size: file.size,
        }),
      });
      const session = await sessionResponse.json();
      if (!sessionResponse.ok) throw new Error(session.error || "Unable to prepare upload.");
      await uploadPrivate({ path: session.path, url: session.url }, file);
      setStatus("Saving proof version…");
      const createResponse = await fetch("/api/admin/proofs", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          orderId,
          filePath: session.path,
          fileName: file.name,
          mimeType: file.type,
          note,
        }),
      });
      const result = await createResponse.json();
      if (!createResponse.ok) throw new Error(result.error || "Unable to create proof.");
      setCustomerPath(result.customerPath);
      setStatus(`Proof v${result.version} ready for ${result.orderNo}.`);
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Unable to create proof.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>Create customer proof</h2>
      <label>Shop Order UUID<input value={orderId} onChange={(e) => setOrderId(e.target.value)} required /></label>
      <label>Proof file<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} required /></label>
      <label>Customer note<textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} /></label>
      <button disabled={busy}>{busy ? "Working…" : "Upload & create proof"}</button>
      {status && <p role="status">{status}</p>}
      {customerPath && (
        <p>
          Customer link: <a href={customerPath} target="_blank" rel="noreferrer">{customerPath}</a>
        </p>
      )}
    </form>
  );
}
