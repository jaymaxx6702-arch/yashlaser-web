import type { NextConfig } from "next";
import redirects from "./data/generated/redirects.json";
const nextConfig: NextConfig = {
  async redirects() {
    return redirects;
  },
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Cache-Control", value: "no-store" },
        ],
      },
    ];
  },
};
export default nextConfig;
