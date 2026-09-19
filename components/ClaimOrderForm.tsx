"use client";
import { useState, type FormEvent } from "react";

export function ClaimOrderForm() {
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");
    const fd = new FormData(e.currentTarget);

    const response = await fetch("/api/account/claim-order", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        orderNo: String(fd.get("orderNo") || ""),
        token: String(fd.get("token") || ""),
      }),
    });
    const result = await response.json();
    setMessage(
      response.ok
        ? "Order added to your account. Refresh to see it."
        : result.error || "Unable to add order.",
    );
    setBusy(false);
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <h2>Add an existing guest order</h2>
      <p>
        Use the order number and secure token from the original tracking link.
      </p>
      <label>
        Order number
        <input name="orderNo" required maxLength={40} />
      </label>
      <label>
        Secure token
        <input name="token" required minLength={20} maxLength={100} />
      </label>
      <button className="button" disabled={busy}>
        {busy ? "Adding…" : "Add order to account"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
