import type { MetadataRoute } from "next";
import {
  products,
  categories,
  productHref,
  categoryHref,
} from "@/data/catalog";
import { business } from "@/data/business";
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    "",
    "/products",
    "/contact",
    "/privacy",
    ...categories.map((c) => categoryHref(c.id)),
    ...products.map(productHref),
  ].map((path) => ({ url: business.url + path }));
}
