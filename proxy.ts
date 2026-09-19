import { NextRequest, NextResponse } from "next/server";

const safeMethods = new Set(["GET", "HEAD", "OPTIONS"]);

export function proxy(request: NextRequest) {
  if (safeMethods.has(request.method))
    return NextResponse.next();

  const path = request.nextUrl.pathname;

  if (
    path.startsWith("/api/integrations/") ||
    path.startsWith("/api/payments/webhook")
  )
    return NextResponse.next();

  if (request.headers.get("sec-fetch-site") === "cross-site")
    return NextResponse.json(
      { error: "Cross-site request blocked." },
      { status: 403 },
    );

  const origin = request.headers.get("origin");
  if (origin) {
    try {
      const originUrl = new URL(origin);
      if (
        originUrl.host !== request.nextUrl.host ||
        originUrl.protocol !== request.nextUrl.protocol
      )
        return NextResponse.json(
          { error: "Origin mismatch." },
          { status: 403 },
        );
    } catch {
      return NextResponse.json(
        { error: "Invalid request origin." },
        { status: 403 },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/:path*"],
};
