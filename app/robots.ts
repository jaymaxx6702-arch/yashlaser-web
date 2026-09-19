import type { MetadataRoute } from "next";
import { business } from "@/data/business";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/api/",
        "/customize/",
        "/admin/",
        "/cart",
        "/checkout",
        "/account",
        "/track-order",
        "/proof/",
        "/quote/",
        "/order-summary/",
      ],
    },
    sitemap: business.url + "/sitemap.xml",
    host: business.url,
  };
}
