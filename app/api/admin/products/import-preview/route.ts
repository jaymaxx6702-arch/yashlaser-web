import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { inspectCatalogueCsv } from "@/lib/catalogue-csv";
import { findPublishedSlugConflicts } from "@/lib/catalogue-import-server";

const MAX_BYTES = 2 * 1024 * 1024;

async function readCsv(request: Request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BYTES) throw Object.assign(new Error("CSV file is too large."), { status: 413 });

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("text/csv") && !contentType.includes("text/plain"))
    throw Object.assign(new Error("Upload a CSV text file."), { status: 415 });

  const csv = await request.text();
  if (new TextEncoder().encode(csv).byteLength > MAX_BYTES)
    throw Object.assign(new Error("CSV file is too large."), { status: 413 });
  return csv;
}

export async function POST(request: Request) {
  await requireAdmin();

  try {
    const csv = await readCsv(request);
    const inspection = inspectCatalogueCsv(csv);
    const conflicts = inspection.issues.length
      ? []
      : await findPublishedSlugConflicts(inspection.drafts);
    const issues = [...inspection.issues, ...conflicts];

    return NextResponse.json({
      ok: issues.length === 0,
      productCount: inspection.drafts.length,
      variantCount: inspection.drafts.reduce(
        (sum, draft) => sum + draft.variants.length,
        0,
      ),
      issues: issues.slice(0, 100),
      preview: inspection.drafts.slice(0, 25).map((draft) => ({
        productKey: draft.productKey,
        name: draft.name,
        slug: draft.slug,
        categoryId: draft.categoryId,
        pricingMode: draft.pricingMode,
        variants: draft.variants.length,
      })),
      truncated: inspection.drafts.length > 25,
      message:
        issues.length === 0
          ? "Preview passed. No catalogue or database records were changed."
          : "Fix the listed issues before importing drafts.",
    });
  } catch (error) {
    const status =
      typeof error === "object" &&
      error &&
      "status" in error &&
      typeof error.status === "number"
        ? error.status
        : 400;
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Invalid catalogue CSV." },
      { status },
    );
  }
}
