import type { MetadataRoute } from "next";
import {
  products,
  categories,
  productHref,
  categoryHref,
} from "@/data/catalog";
import { business } from "@/data/business";
import { languageAlternates } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPublic = [
    "",
    "/products",
    "/contact",
    "/privacy",
    "/bulk-orders",
    "/plan-my-event",
    "/custom-acrylic",
    "/support",
    "/reviews",
  ];

  const localized = [
    "",
    "/products",
    "/contact",
    "/privacy",
    "/bulk-orders",
    "/plan-my-event",
    "/custom-acrylic",
    "/support",
    ...categories.map((c) => categoryHref(c.id)),
    ...products.map(productHref),
  ];

  const rows: MetadataRoute.Sitemap = staticPublic.map((path) => ({
    url: business.url + path,
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
    ...(localized.includes(path)
      ? { alternates: { languages: languageAlternates(path || "/") } }
      : {}),
  }));

  for (const lang of ["gu", "hi", "mr"]) {
    for (const path of localized) {
      rows.push({
        url: business.url + "/" + lang + (path === "" ? "" : path),
        changeFrequency:
          path === "" || path === "/products" || path.startsWith("/products/")
            ? "weekly"
            : "monthly",
        priority:
          path === ""
            ? 0.9
            : path.startsWith("/products/")
              ? 0.75
              : 0.65,
      });
    }
  }

  return rows;
}
