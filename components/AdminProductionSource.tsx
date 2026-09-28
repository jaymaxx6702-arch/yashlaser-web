"use client";

import { useState, type FormEvent } from "react";

export function AdminProductionSource() {
  const [orderId, setOrderId] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setStatus("Creating locked production source…");
    try {
      const response = await fetch("/api/admin/order-assets/production", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Unable to create production source.");

      setStatus(
        result.idempotent
          ? `Production source v${result.version} already exists from approved proof v${result.sourceProofVersion}.`
          : `Production source v${result.version} created from approved proof v${result.sourceProofVersion}. Order moved to production.`,
      );
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to create production source.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>Approved proof → production source</h2>
      <p className="muted">
        Only the latest customer-approved proof can become the locked production
        source. The approved proof is copied, never overwritten.
      </p>
      <label>
        Shop Order UUID
        <input
          value={orderId}
          onChange={(event) => setOrderId(event.target.value)}
          required
        />
      </label>
      <button disabled={busy}>
        {busy ? "Working…" : "Create production source"}
      </button>
      {status && <p role="status">{status}</p>}
    </form>
  );
}
