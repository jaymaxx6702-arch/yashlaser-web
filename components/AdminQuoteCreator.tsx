"use client";
import { useState, type FormEvent } from "react";

export function AdminQuoteCreator() {
  const [message, setMessage] = useState("");
  const [customerPath, setCustomerPath] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    setCustomerPath("");

    const fd = new FormData(e.currentTarget);
    let items: unknown[] = [];

    try {
      const parsed = JSON.parse(String(fd.get("items") || "[]"));
      if (!Array.isArray(parsed)) throw new Error();
      items = parsed;
    } catch {
      setMessage("Items JSON must be an array.");
      setBusy(false);
      return;
    }

    const response = await fetch("/api/admin/quotes", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        name: fd.get("name"),
        mobile: fd.get("mobile"),
        email: fd.get("email"),
        totalMinor: Number(fd.get("totalMinor")),
        validUntil: fd.get("validUntil"),
        notes: fd.get("notes"),
        sourceType: fd.get("sourceType"),
        items,
      }),
    });

    const result = await response.json();
    if (!response.ok) {
      setMessage(result.error || "Unable to create quote.");
    } else {
      setMessage("Quote " + result.quoteNo + " created.");
      setCustomerPath(result.customerPath);
    }
    setBusy(false);
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>Create quote</h2>
      <label>Name<input name="name" required /></label>
      <label>Phone<input name="mobile" required /></label>
      <label>Email<input name="email" type="email" /></label>
      <label>
        Source
        <select name="sourceType">
          <option value="custom">Custom</option>
          <option value="bulk">Bulk</option>
          <option value="event">Event</option>
        </select>
      </label>
      <label>
        Items JSON
        <textarea
          name="items"
          rows={8}
          defaultValue={'[{"name":"Sample item","qty":1,"amountMinor":0}]'}
          required
        />
      </label>
      <label>Total in paise<input name="totalMinor" type="number" min={0} /></label>
      <label>Valid until<input name="validUntil" type="date" /></label>
      <label>Notes<textarea name="notes" rows={3} /></label>
      <button disabled={busy}>{busy ? "Creating…" : "Create quote"}</button>
      {message && <p role="status">{message}</p>}
      {customerPath && (
        <p>
          Customer link:{" "}
          <a href={customerPath} target="_blank" rel="noreferrer">
            {customerPath}
          </a>
        </p>
      )}
    </form>
  );
}
