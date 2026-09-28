import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { inspectCatalogueCsv } from "@/lib/catalogue-csv";
import {
  findPublishedSlugConflicts,
  inspectCatalogueImportState,
} from "@/lib/catalogue-import-server";

const MAX_BYTES = 2 * 1024 * 1024;

async function readCsv(request: Request) {
  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BYTES)
    throw Object.assign(new Error("CSV file is too large."), { status: 413 });

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
    const [conflicts, importState] = inspection.issues.length
      ? [[], []]
      : await Promise.all([
          findPublishedSlugConflicts(inspection.drafts),
          inspectCatalogueImportState(inspection.drafts),
        ]);
    const issues = [...inspection.issues, ...conflicts];
    const stateByKey = new Map(
      importState.map((item) => [item.productKey, item]),
    );

    const report: Array<{
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
    }> = inspection.drafts.map((draft) => {
      const state = stateByKey.get(draft.productKey);
      const productIssues = issues
        .filter((issue) => issue.productKey === draft.productKey)
        .map((issue) => issue.message);
      return {
        productKey: draft.productKey,
        name: draft.name,
        slug: draft.slug,
        categoryId: draft.categoryId,
        pricingMode: draft.pricingMode,
        variants: draft.variants.length,
        latestRevision: state?.latestRevision ?? null,
        latestState: state?.latestState ?? null,
        status: productIssues.length
          ? "blocked"
          : state?.unchanged
            ? "unchanged"
            : "ready",
        issues: productIssues,
      };
    });

    for (const issue of issues.filter((item) => !item.productKey)) {
      report.push({
        productKey: "",
        name: "",
        slug: "",
        categoryId: "",
        pricingMode: "",
        variants: 0,
        latestRevision: null,
        latestState: null,
        status: "blocked",
        issues: [issue.message],
      });
    }

    const readyCount = report.filter((row) => row.status === "ready").length;
    const unchangedCount = report.filter(
      (row) => row.status === "unchanged",
    ).length;

    return NextResponse.json({
      ok: issues.length === 0,
      productCount: inspection.drafts.length,
      variantCount: inspection.drafts.reduce(
        (sum, draft) => sum + draft.variants.length,
        0,
      ),
      readyCount,
      unchangedCount,
      blockedCount: report.filter((row) => row.status === "blocked").length,
      issues: issues.slice(0, 100),
      report,
      preview: report.slice(0, 25),
      truncated: report.length > 25,
      message:
        issues.length === 0
          ? unchangedCount
            ? `Validation passed. ${readyCount} products are ready and ${unchangedCount} are unchanged. Nothing was written.`
            : "Validation passed. Nothing was written to the database."
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
      {
        error:
          error instanceof Error ? error.message : "Invalid catalogue CSV.",
      },
      { status },
    );
  }
}
