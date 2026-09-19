"use client";
import { useState } from "react";

export function ShipmentEditor({ orderId }: { orderId: string }) {
  const [open, setOpen] = useState(false);
  const [courier, setCourier] = useState("");
  const [awb, setAwb] = useState("");
  const [trackingUrl, setTrackingUrl] = useState("");
  const [status, setStatus] = useState("preparing");
  const [message, setMessage] = useState("");

  async function save() {
    const response = await fetch(
      "/api/admin/orders/" + orderId + "/shipment",
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ courier, awb, trackingUrl, status }),
      },
    );
    const result = await response.json();
    setMessage(
      response.ok
        ? "Shipment updated."
        : result.error || "Unable to update shipment.",
    );
  }

  if (!open)
    return (
      <button type="button" onClick={() => setOpen(true)}>
        Shipment
      </button>
    );

  return (
    <div className="admin-card">
      <label>
        Courier
        <input value={courier} onChange={(e) => setCourier(e.target.value)} />
      </label>
      <label>
        AWB
        <input value={awb} onChange={(e) => setAwb(e.target.value)} />
      </label>
      <label>
        Tracking URL
        <input
          value={trackingUrl}
          onChange={(e) => setTrackingUrl(e.target.value)}
        />
      </label>
      <label>
        Status
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="preparing">Preparing</option>
          <option value="awb_created">AWB Created</option>
          <option value="dispatched">Dispatched</option>
          <option value="in_transit">In Transit</option>
          <option value="out_for_delivery">Out for Delivery</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="rto">RTO</option>
        </select>
      </label>
      <button type="button" onClick={() => void save()}>
        Save shipment
      </button>{" "}
      <button type="button" onClick={() => setOpen(false)}>
        Close
      </button>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
