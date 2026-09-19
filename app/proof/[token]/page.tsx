import { notFound } from "next/navigation";
import { getProofByToken } from "@/lib/proof-server";
import { ProofActions } from "@/components/ProofActions";

export const metadata = { title: "Review proof", robots: { index: false, follow: false } };

export default async function ProofPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const result = await getProofByToken(token);
  if (!result) notFound();
  const { proof, order, signedUrl, isLatest } = result;
  const actionable = isLatest && proof.status === "ready";
  return (
    <main id="main-content" className="container section proof-page">
      <p className="eyebrow">Order {order.order_no}</p>
      <h1>Review proof v{proof.version_no}.</h1>
      <p>
        Please check spelling, names, layout and the overall design carefully before approval.
      </p>
      {proof.note && <p className="muted">{proof.note}</p>}
      {signedUrl ? (
        proof.mime_type === "application/pdf" ? (
          <a className="button" href={signedUrl} target="_blank" rel="noreferrer">Open proof PDF ↗</a>
        ) : (
          <a href={signedUrl} target="_blank" rel="noreferrer">
            <img className="proof-image" src={signedUrl} alt={proof.file_name || "Customer proof"} />
          </a>
        )
      ) : (
        <p role="alert">Proof file is temporarily unavailable. Please contact Yash Laser.</p>
      )}
      <ProofActions token={token} actionable={actionable} />
      <p className="muted">
        Approval applies only to this exact proof version. A newer version automatically makes an older link non-actionable.
      </p>
    </main>
  );
}
