"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type Preview = {
  ok: boolean;
  productCount: number;
  variantCount: number;
  issues: { productKey: string | null; message: string }[];
  preview: {
    productKey: string;
    name: string;
    slug: string;
    categoryId: string;
    pricingMode: string;
    variants: number;
  }[];
  truncated: boolean;
  message: string;
};

const MAX_BYTES = 2 * 1024 * 1024;

export function CatalogueCsvManager() {
  const router = useRouter();
  const [fileName, setFileName] = useState("");
  const [csv, setCsv] = useState("");
  const [preview, setPreview] = useState<Preview | null>(null);
  const [status, setStatus] = useState("");
  const [busy, setBusy] = useState(false);

  async function choose(file: File | undefined) {
    setPreview(null);
    setStatus("");
    setCsv("");
    setFileName(file?.name ?? "");
    if (!file) return;
    if (file.size > MAX_BYTES) {
      setStatus("CSV file is too large. Maximum size is 2 MB.");
      return;
    }
    setCsv(await file.text());
  }

  async function previewCsv() {
    if (!csv) return;
    setBusy(true);
    setStatus("Validating catalogue CSV…");
    try {
      const response = await fetch("/api/admin/products/import-preview", {
        method: "POST",
        headers: { "content-type": "text/csv; charset=utf-8" },
        body: csv,
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Unable to preview CSV.");
      setPreview(result);
      setStatus(result.message);
    } catch (error) {
      setPreview(null);
      setStatus(error instanceof Error ? error.message : "Unable to preview CSV.");
    } finally {
      setBusy(false);
    }
  }

  async function importDrafts() {
    if (!csv || !preview?.ok) return;
    setBusy(true);
    setStatus("Importing validated rows as private drafts…");
    try {
      const response = await fetch("/api/admin/products/import-drafts", {
        method: "POST",
        headers: { "content-type": "text/csv; charset=utf-8" },
        body: csv,
      });
      const result = await response.json();
      if (!response.ok) {
        const issueText = Array.isArray(result.issues)
          ? result.issues
              .slice(0, 5)
              .map((issue: { productKey?: string | null; message?: string }) =>
                (issue.productKey ? issue.productKey + ": " : "") +
                (issue.message || "Import issue"),
              )
              .join(" ")
          : "";
        throw new Error(
          [result.error || "Unable to import drafts.", issueText]
            .filter(Boolean)
            .join(" "),
        );
      }
      setStatus(
        `${result.importedProducts} products and ${result.importedVariants} variants imported as drafts. Nothing was published.`,
      );
      setPreview(null);
      setCsv("");
      setFileName("");
      router.refresh();
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to import drafts.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-top">
        <div>
          <h2>Catalogue CSV</h2>
          <p className="muted">
            Download the current catalogue, edit it in Excel or Sheets, preview
            every change, then import only as private draft revisions.
          </p>
        </div>
        <Link href="/api/admin/products/export" prefetch={false}>
          Download current CSV
        </Link>
      </div>

      <label>
        Upload edited CSV
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          disabled={busy}
          onChange={(event) => choose(event.target.files?.[0])}
        />
      </label>

      {fileName && <p>Selected: <strong>{fileName}</strong></p>}

      <div className="editor-toolbar">
        <button type="button" disabled={busy || !csv} onClick={previewCsv}>
          {busy ? "Working…" : "Preview & validate"}
        </button>
        <button
          type="button"
          disabled={busy || !preview?.ok}
          onClick={importDrafts}
        >
          Import as drafts
        </button>
      </div>

      {status && (
        <p role={preview && !preview.ok ? "alert" : "status"}>{status}</p>
      )}

      {preview && (
        <>
          <div className="admin-metrics">
            <article className="admin-card">
              <small>Products</small>
              <strong>{preview.productCount}</strong>
            </article>
            <article className="admin-card">
              <small>Variants</small>
              <strong>{preview.variantCount}</strong>
            </article>
            <article className="admin-card">
              <small>Issues</small>
              <strong>{preview.issues.length}</strong>
            </article>
          </div>

          {preview.issues.length > 0 && (
            <div className="admin-card" role="alert">
              <h3>Fix before import</h3>
              <ul>
                {preview.issues.map((issue, index) => (
                  <li key={index}>
                    {issue.productKey && <strong>{issue.productKey}: </strong>}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="admin-card">
            <h3>Preview</h3>
            <div className="admin-list">
              {preview.preview.map((item) => (
                <article className="admin-card" key={item.productKey}>
                  <strong>{item.name}</strong>
                  <span>{item.productKey} · /products/{item.slug}</span>
                  <span>
                    {item.categoryId} · {item.pricingMode} · {item.variants} variants
                  </span>
                </article>
              ))}
            </div>
            {preview.truncated && (
              <p className="muted">Showing the first 25 products only.</p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
