"use client";
import { useState } from "react";

export function ProofActions({ token, actionable }: { token: string; actionable: boolean }) {
  const [comment, setComment] = useState("");
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function act(action: "approve" | "request-changes") {
    setBusy(true);
    setStatus("");
    try {
      const response = await fetch(`/api/proofs/${encodeURIComponent(token)}/${action}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ comment }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to update proof.");
      setStatus(action === "approve" ? "Proof approved. Thank you." : "Change request sent.");
    } catch (e) {
      setStatus(e instanceof Error ? e.message : "Unable to update proof.");
    } finally {
      setBusy(false);
    }
  }

  if (!actionable) return <p>This proof is no longer actionable. Please use the latest proof link.</p>;
  return (
    <div className="proof-actions">
      <label>
        Comment (required only for changes)
        <textarea rows={3} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={2000} />
      </label>
      <div className="hero-actions">
        <button className="button" type="button" disabled={busy} onClick={() => void act("approve")}>
          Approve proof
        </button>
        <button className="button button-secondary" type="button" disabled={busy || !comment.trim()} onClick={() => void act("request-changes")}>
          Request changes
        </button>
      </div>
      {status && <p role="status">{status}</p>}
    </div>
  );
}
