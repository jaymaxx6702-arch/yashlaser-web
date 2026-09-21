"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminProjectActions({
  id,
  status,
  customerMessage,
}: {
  id: string;
  status: string;
  customerMessage: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const fd = new FormData(e.currentTarget);
    const response = await fetch(
      "/api/admin/projects/" + encodeURIComponent(id),
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          status: String(fd.get("status") || ""),
          customerMessage: String(fd.get("customerMessage") || ""),
        }),
      },
    );
    const data = await response.json();

    setMessage(
      response.ok
        ? "Project request updated."
        : data.error || "Update failed.",
    );
    setBusy(false);
    if (response.ok) router.refresh();
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <label>
        Status
        <select name="status" defaultValue={status}>
          <option value="new">New</option>
          <option value="reviewing">Reviewing</option>
          <option value="quoted">Quoted</option>
          <option value="accepted">Accepted</option>
          <option value="closed">Closed</option>
          <option value="cancelled">Cancelled</option>
        </select>
      </label>
      <label>
        Customer message
        <textarea
          name="customerMessage"
          rows={4}
          maxLength={3000}
          defaultValue={customerMessage || ""}
          placeholder="Visible to the customer on the secure request-status page."
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : "Save follow-up"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
