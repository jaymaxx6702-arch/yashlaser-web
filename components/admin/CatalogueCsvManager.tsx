"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ReportRow = {
  productKey: string;
  name: string;
  slug: string;
  categoryId: string;
  pricingMode: string;
  variants: number;
  latestRevision: number | null;
  latestState: string | null;
  status: "ready" | "unchanged" | "blocked";
  issues: string[];
};

type Preview = {
  ok: boolean;
  productCount: number;
  variantCount: number;
  readyCount: number;
  unchangedCount: number;
  blockedCount: number;
  issues: { productKey: string | null; message: string }[];
  report: ReportRow[];
  preview: ReportRow[];
  truncated: boolean;
  message: string;
};

const MAX_BYTES = 2 * 1024 * 1024;

function reportCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[=+@\-]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

function validationReportCsv(preview: Preview) {
  const header = [
    "product_key",
    "name",
    "slug",
    "category_id",
    "pricing_mode",
    "variant_count",
    "latest_revision",
    "latest_state",
    "validation_status",
    "issues",
  ];
  const rows = preview.report.map((row) => [
    row.productKey,
    row.name,
    row.slug,
    row.categoryId,
    row.pricingMode,
    row.variants,
    row.latestRevision ?? "",
    row.latestState ?? "",
    row.status,
    row.issues.join(" | "),
  ]);
  return [header, ...rows]
    .map((row) => row.map(reportCell).join(","))
    .join("\r\n") + "\r\n";
}

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
      if (!response.ok)
        throw new Error(result.error || "Unable to preview CSV.");
      setPreview(result);
      setStatus(result.message);
    } catch (error) {
      setPreview(null);
      setStatus(
        error instanceof Error ? error.message : "Unable to preview CSV.",
      );
    } finally {
      setBusy(false);
    }
  }

  function downloadValidationReport() {
    if (!preview) return;
    const blob = new Blob([validationReportCsv(preview)], {
      type: "text/csv;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yashlaser-catalogue-validation-report.csv";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 30_000);
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
      setStatus(result.message);
      setPreview(null);
      setCsv("");
      setFileName("");
      router.refresh();
    } catch (error) {
      setStatus(
        error instanceof Error ? error.message : "Unable to import drafts.",
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-card">
      <div className="admin-top">
        <div>
          <h2>Catalogue CSV / Excel workflow</h2>
          <p className="muted">
            Download the current catalogue as an Excel/Google Sheets-compatible
            CSV, edit it, validate every row, then import only changed products
            as private draft revisions.
          </p>
        </div>
        <Link href="/api/admin/products/export" prefetch={false}>
          Download current CSV
        </Link>
      </div>

      <p className="muted">
        Safe fallback: this export reads the current generated catalogue only.
        Uploading or validating a file never overwrites the live storefront.
      </p>

      <label>
        Upload edited CSV
        <input
          type="file"
          accept=".csv,text/csv,text/plain"
          disabled={busy}
          onChange={(event) => choose(event.target.files?.[0])}
        />
      </label>

      {fileName && (
        <p>
          Selected: <strong>{fileName}</strong>
        </p>
      )}

      <div className="editor-toolbar">
        <button type="button" disabled={busy || !csv} onClick={previewCsv}>
          {busy ? "Working…" : "Preview & validate"}
        </button>
        <button
          type="button"
          disabled={busy || !preview}
          onClick={downloadValidationReport}
        >
          Download validation report
        </button>
        <button
          type="button"
          disabled={busy || !preview?.ok || preview.readyCount === 0}
          onClick={importDrafts}
        >
          Import changed products as drafts
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
              <small>Ready to import</small>
              <strong>{preview.readyCount}</strong>
            </article>
            <article className="admin-card">
              <small>Unchanged</small>
              <strong>{preview.unchangedCount}</strong>
            </article>
            <article className="admin-card">
              <small>Blocked</small>
              <strong>{preview.blockedCount}</strong>
            </article>
          </div>

          {preview.issues.length > 0 && (
            <div className="admin-card" role="alert">
              <h3>Fix before import</h3>
              <ul>
                {preview.issues.map((issue, index) => (
                  <li key={index}>
                    {issue.productKey && (
                      <strong>{issue.productKey}: </strong>
                    )}
                    {issue.message}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="admin-card">
            <h3>Validation preview</h3>
            <div className="admin-list">
              {preview.preview.map((item, index) => (
                <article
                  className="admin-card"
                  key={item.productKey || "issue-" + index}
                >
                  <strong>{item.name || item.productKey || "CSV issue"}</strong>
                  {item.slug && (
                    <span>
                      {item.productKey} · /products/{item.slug}
                    </span>
                  )}
                  <span>
                    Status: {item.status}
                    {item.latestRevision
                      ? ` · latest revision ${item.latestRevision}`
                      : ""}
                  </span>
                  {item.categoryId && (
                    <span>
                      {item.categoryId} · {item.pricingMode} · {item.variants}{" "}
                      variants
                    </span>
                  )}
                  {item.issues.length > 0 && (
                    <span>{item.issues.join(" · ")}</span>
                  )}
                </article>
              ))}
            </div>
            {preview.truncated && (
              <p className="muted">
                Showing the first 25 report rows. Download the validation report
                for the complete result.
              </p>
            )}
          </div>
        </>
      )}
    </section>
  );
}
