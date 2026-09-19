"use client";
import { useState } from "react";

export function ReviewModeration({
  reviewId,
  initialStatus,
}: {
  reviewId: string;
  initialStatus: string;
}) {
  const [status, setStatus] = useState(initialStatus);
  const [busy, setBusy] = useState(false);

  async function update(next: "published" | "rejected") {
    setBusy(true);
    const response = await fetch("/api/admin/reviews/" + reviewId, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ status: next }),
    });
    if (response.ok) setStatus(next);
    setBusy(false);
  }

  return (
    <div className="admin-top">
      <span>Status: {status}</span>
      <div>
        <button disabled={busy} onClick={() => void update("published")}>
          Publish
        </button>{" "}
        <button disabled={busy} onClick={() => void update("rejected")}>
          Reject
        </button>
      </div>
    </div>
  );
}
