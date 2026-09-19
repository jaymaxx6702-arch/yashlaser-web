"use client";
import { useState } from "react";

export function QuoteActions({
  token,
  canAccept,
}: {
  token: string;
  canAccept: boolean;
}) {
  const [status, setStatus] = useState("");

  async function accept() {
    const response = await fetch(
      "/api/quotes/" + encodeURIComponent(token) + "/accept",
      { method: "POST" },
    );
    const result = await response.json();
    setStatus(
      response.ok
        ? "Quote accepted."
        : result.error || "Unable to accept quote.",
    );
  }

  if (!canAccept)
    return <p>This quote is no longer awaiting acceptance.</p>;

  return (
    <div>
      <button className="button" onClick={() => void accept()}>
        Accept quote
      </button>
      {status && <p role="status">{status}</p>}
    </div>
  );
}
