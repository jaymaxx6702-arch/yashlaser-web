import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import { AdminProofUploader } from "@/components/AdminProofUploader";

export default async function AdminProofsPage() {
  await requireAdmin();
  return (
    <>
      <div className="admin-top">
        <div>
          <p><Link href="/admin">← Enquiries</Link></p>
          <h1>Customer proofs</h1>
        </div>
      </div>
      <AdminProofUploader />
      <p>
        Proof records require the commerce migration and private <code>shop-proofs</code> bucket.
      </p>
    </>
  );
}
