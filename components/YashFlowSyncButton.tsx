"use client";
import { useState } from "react";

export function YashFlowSyncButton({ orderId }: { orderId: string }) {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  async function sync() {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/yashflow-sync`, { method: "POST" });
      const contentType = response.headers.get("content-type") || "";
      const raw = await response.text();
      let result: Record<string, unknown> = {};
      if (contentType.includes("application/json")) {
        try {
          result = JSON.parse(raw) as Record<string, unknown>;
        } catch {
          throw new Error(`Shop sync API returned invalid JSON (${response.status}).`);
        }
      } else {
        const preview = raw.replace(/\s+/g, " ").slice(0, 180);
        throw new Error(
          `Shop sync API returned non-JSON (${response.status}, ${contentType || "unknown content-type"}). ${preview}`,
        );
      }
      if (!response.ok)
        throw new Error(
          typeof result.error === "string" ? result.error : "Sync failed.",
        );
      setMessage("Synced to YashFlow.");
    } catch (e) {
      setMessage(e instanceof Error ? e.message : "Sync failed.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <span>
      <button type="button" disabled={busy} onClick={() => void sync()}>
        {busy ? "Syncing…" : "Sync / retry YashFlow"}
      </button>
      {message && <small style={{ display: "block", marginTop: 6 }}>{message}</small>}
    </span>
  );
}
