"use client";
import { useState, type FormEvent } from "react";

export function SupportForm() {
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setStatus("");

    const fd = new FormData(e.currentTarget);
    const body = Object.fromEntries(
      ["name", "mobile", "email", "category", "subject", "message"].map(
        (key) => [key, String(fd.get(key) || "")],
      ),
    );

    const response = await fetch("/api/support", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const result = await response.json();

    setStatus(
      response.ok
        ? "Ticket " + result.ticketNo + " created."
        : result.error || "Unable to create support ticket.",
    );
    setBusy(false);
  }

  return (
    <form className="project-form" onSubmit={submit}>
      <div className="checkout-fields">
        <label>
          Name
          <input name="name" required />
        </label>
        <label>
          Phone
          <input name="mobile" required />
        </label>
        <label>
          Email
          <input name="email" type="email" />
        </label>
        <label>
          Category
          <select name="category">
            <option value="order">Order</option>
            <option value="proof">Proof</option>
            <option value="delivery">Delivery</option>
            <option value="replacement">Replacement</option>
            <option value="general">General</option>
          </select>
        </label>
        <label className="full">
          Subject
          <input name="subject" required />
        </label>
        <label className="full">
          Message
          <textarea name="message" rows={5} required />
        </label>
      </div>

      <button className="button" disabled={busy}>
        {busy ? "Submitting…" : "Create support ticket →"}
      </button>
      {status && <p role="status">{status}</p>}
    </form>
  );
}
