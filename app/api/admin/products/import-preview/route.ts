import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin";
import { parseCatalogueCsv } from "@/lib/catalogue-csv";

const MAX_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  await requireAdmin();

  const declared = Number(request.headers.get("content-length") || 0);
  if (declared > MAX_BYTES)
    return NextResponse.json(
      { error: "CSV file is too large." },
      { status: 413 },
    );

  const contentType = request.headers.get("content-type") || "";
  if (!contentType.includes("text/csv") && !contentType.includes("text/plain"))
    return NextResponse.json(
      { error: "Upload a CSV text file." },
      { status: 415 },
    );

  const csv = await request.text();
  if (new TextEncoder().encode(csv).byteLength > MAX_BYTES)
    return NextResponse.json(
      { error: "CSV file is too large." },
      { status: 413 },
    );

  try {
    const drafts = parseCatalogueCsv(csv);
    return NextResponse.json({
      ok: true,
      productCount: drafts.length,
      variantCount: drafts.reduce(
        (sum, draft) => sum + draft.variants.length,
        0,
      ),
      preview: drafts.slice(0, 25).map((draft) => ({
        productKey: draft.productKey,
        name: draft.name,
        slug: draft.slug,
        categoryId: draft.categoryId,
        pricingMode: draft.pricingMode,
        variants: draft.variants.length,
      })),
      truncated: drafts.length > 25,
      message:
        "Preview only. No catalogue or database records were changed.",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Invalid catalogue CSV.",
      },
      { status: 400 },
    );
  }
}
