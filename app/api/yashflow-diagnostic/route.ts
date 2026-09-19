import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  const base = (process.env.YASHFLOW_API_URL || "").replace(/\/$/, "");
  const secret = process.env.YASHFLOW_API_SECRET || "";

  if (!base || !secret) {
    return NextResponse.json({
      ok: false,
      configured: false,
      baseUrlSet: Boolean(base),
      secretSet: Boolean(secret),
    });
  }

  try {
    const response = await fetch(`${base}/api/integrations/shop/orders`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${secret}`,
      },
      body: JSON.stringify({}),
      redirect: "manual",
      cache: "no-store",
      signal: AbortSignal.timeout(15000),
    });

    const contentType = response.headers.get("content-type") || "";
    const location = response.headers.get("location");
    const raw = await response.text();
    const preview = raw.replace(/\s+/g, " ").slice(0, 300);

    return NextResponse.json({
      ok: response.status === 400 && contentType.includes("application/json"),
      configured: true,
      status: response.status,
      contentType,
      redirectedTo: location,
      preview,
    });
  } catch (error) {
    return NextResponse.json({
      ok: false,
      configured: true,
      error: error instanceof Error ? error.message : "Diagnostic request failed.",
    });
  }
}
