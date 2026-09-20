"use client";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";

export function AdminSupportActions({
  id,
  status,
  response,
}: {
  id: string;
  status: string;
  response: string | null;
}) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setMessage("");

    const fd = new FormData(e.currentTarget);
    const result = await fetch("/api/admin/support/" + encodeURIComponent(id), {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        status: String(fd.get("status") || ""),
        response: String(fd.get("response") || ""),
      }),
    });

    const data = await result.json();
    setMessage(result.ok ? "Support ticket updated." : data.error || "Update failed.");
    setBusy(false);
    if (result.ok) router.refresh();
  }

  return (
    <form className="admin-card" onSubmit={submit}>
      <label>
        Status
        <select name="status" defaultValue={status}>
          <option value="open">Open</option>
          <option value="in_progress">In progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
      </label>
      <label>
        Customer response
        <textarea
          name="response"
          rows={4}
          maxLength={3000}
          defaultValue={response || ""}
          placeholder="Write the response the customer should see."
        />
      </label>
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : "Save response & status"}
      </button>
      {message && <p role="status">{message}</p>}
    </form>
  );
}
