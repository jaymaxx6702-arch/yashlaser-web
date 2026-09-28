"use client";
import { useState } from "react";

export function ReviewModeration({
  reviewId,
  initialStatus,
  initialVerified,
}: {
  reviewId: string;
  initialStatus: string;
  initialVerified: boolean;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [verified, setVerified] = useState(initialVerified);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function update(
    nextStatus: "published" | "rejected" = status === "rejected"
      ? "rejected"
      : "published",
    nextVerified = verified,
  ) {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/reviews/" + reviewId, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: nextStatus,
          verifiedPurchase: nextVerified,
        }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Review update failed.");
      setStatus(nextStatus);
      setVerified(nextVerified);
      setMessage("Review updated.");
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Review update failed.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="admin-card">
      <div className="admin-top">
        <span>
          Status: {status} · {verified ? "Verified purchase" : "Not verified"}
        </span>
        <div>
          <button
            type="button"
            disabled={busy}
            onClick={() => void update("published", verified)}
          >
            Publish
          </button>{" "}
          <button
            type="button"
            disabled={busy}
            onClick={() => void update("rejected", verified)}
          >
            Reject
          </button>
        </div>
      </div>
      <label>
        <input
          type="checkbox"
          checked={verified}
          disabled={busy}
          onChange={(event) => {
            const next = event.target.checked;
            setVerified(next);
            void update(status === "rejected" ? "rejected" : "published", next);
          }}
        />
        Verified purchase badge
      </label>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
