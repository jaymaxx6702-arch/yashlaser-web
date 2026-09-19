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
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Sync failed.");
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
