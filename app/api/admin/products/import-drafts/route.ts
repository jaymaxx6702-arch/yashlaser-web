import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { inspectCatalogueCsv } from "@/lib/catalogue-csv";
import {
  findPublishedSlugConflicts,
  importProductAdminDrafts,
} from "@/lib/catalogue-import-server";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const admin = await requireAdmin();

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("text/csv") && !contentType.includes("text/plain"))
    return NextResponse.json(
      { error: "Upload a CSV text file." },
      { status: 415 },
    );

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BYTES)
    return NextResponse.json(
      { error: "CSV file is too large." },
      { status: 413 },
    );

  const csv = await request.text();
  if (new TextEncoder().encode(csv).byteLength > MAX_BYTES)
    return NextResponse.json(
      { error: "CSV file is too large." },
      { status: 413 },
    );

  const inspection = inspectCatalogueCsv(csv);
  if (inspection.issues.length)
    return NextResponse.json(
      {
        error: "CSV validation failed.",
        issues: inspection.issues.slice(0, 100),
      },
      { status: 400 },
    );

  const conflicts = await findPublishedSlugConflicts(inspection.drafts);
  if (conflicts.length)
    return NextResponse.json(
      {
        error: "Published slug conflicts must be resolved.",
        issues: conflicts.slice(0, 100),
      },
      { status: 409 },
    );

  try {
    const imported = await importProductAdminDrafts(
      inspection.drafts,
      admin.id,
    );
    return NextResponse.json({
      ok: true,
      importedProducts: imported.rows.length,
      skippedUnchanged: imported.skippedUnchanged,
      importedVariants: inspection.drafts.reduce(
        (sum, draft) => sum + draft.variants.length,
        0,
      ),
      message:
        imported.rows.length > 0
          ? `${imported.rows.length} product drafts imported. ${imported.skippedUnchanged} unchanged products were skipped. Nothing was published.`
          : "Nothing changed. All products already match the latest admin revisions.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Unable to import drafts.",
      },
      { status: 409 },
    );
  }
}
