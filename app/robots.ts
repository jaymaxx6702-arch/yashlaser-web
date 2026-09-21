import type { MetadataRoute } from "next";
import { business } from "@/data/business";

const privatePaths = [
  "/api/",
  "/customize/",
  "/admin/",
  "/cart",
  "/checkout",
  "/account",
  "/track-order",
  "/support/ticket",
  "/project-request-status",
  "/proof/",
  "/quote/",
  "/order-summary/",
];

export default function robots(): MetadataRoute.Robots {
  const localizedPrivate = ["gu", "hi", "mr"].flatMap((lang) =>
    ["/cart", "/checkout", "/track-order", "/support/ticket", "/project-request-status", "/account", "/customize"].map(
      (path) => "/" + lang + path,
    ),
  );

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [...privatePaths, ...localizedPrivate],
    },
    sitemap: business.url + "/sitemap.xml",
    host: business.url,
  };
}
