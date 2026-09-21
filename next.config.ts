import type { NextConfig } from "next";
import redirects from "./data/generated/redirects.json";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-site" },
  { key: "X-DNS-Prefetch-Control", value: "on" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000",
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  {
    key: "Content-Security-Policy",
    value:
      "object-src 'none'; base-uri 'self'; frame-ancestors 'none'; upgrade-insecure-requests",
  },
];

const privateHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Cache-Control", value: "private, no-store, max-age=0" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  async redirects() {
    return redirects;
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: privateHeaders,
      },
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "no-store" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
      ...[
        "/cart",
        "/checkout",
        "/account",
        "/account/:path*",
        "/track-order",
        "/support/ticket",
        "/project-request-status",
        "/customize/:path*",
        "/gu/cart",
        "/gu/checkout",
        "/gu/account",
        "/gu/account/:path*",
        "/gu/track-order",
        "/gu/support/ticket",
        "/gu/project-request-status",
        "/gu/customize/:path*",
        "/hi/cart",
        "/hi/checkout",
        "/hi/account",
        "/hi/account/:path*",
        "/hi/track-order",
        "/hi/support/ticket",
        "/hi/project-request-status",
        "/hi/customize/:path*",
        "/mr/cart",
        "/mr/checkout",
        "/mr/account",
        "/mr/account/:path*",
        "/mr/track-order",
        "/mr/support/ticket",
        "/mr/project-request-status",
        "/mr/customize/:path*",
        "/proof/:path*",
        "/quote/:path*",
        "/order-summary/:path*",
      ].map((source) => ({ source, headers: privateHeaders })),
    ];
  },
};

export default nextConfig;
