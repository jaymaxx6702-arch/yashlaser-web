import catalogue from "./generated/products.json";
export type CategoryId =
  "standees" | "awards" | "keychains" | "id-cards" | "name-plates" | "other";
export interface Category {
  id: CategoryId;
  name: string;
  shortName: string;
  description: string;
}
export type Product = Omit<(typeof catalogue)[number], "categoryId"> & {
  categoryId: CategoryId;
};
export const products = catalogue as Product[];
export const categories: Category[] = [
  {
    id: "standees",
    name: "Acrylic Photo Standee / 3D Cutout",
    shortName: "Photo Standees",
    description: "A favourite moment, given a place of its own.",
  },
  {
    id: "awards",
    name: "Trophies & Medals",
    shortName: "Trophies & Medals",
    description: "A meaningful way to recognise every achievement.",
  },
  {
    id: "keychains",
    name: "Keychains",
    shortName: "Keychains",
    description: "Little keepsakes with a personal connection.",
  },
  {
    id: "id-cards",
    name: "I-Cards",
    shortName: "I-Cards",
    description: "A considered identity for your organisation.",
  },
  {
    id: "name-plates",
    name: "Name Plates",
    shortName: "Name Plates",
    description: "Make your space unmistakably yours.",
  },
  {
    id: "other",
    name: "Other Customized Products",
    shortName: "More Personal Creations",
    description: "Pen holders, clocks, home temples and decorative keepsakes.",
  },
];
export const categoryHref = (id: CategoryId) => "/categories/" + id;
export const productHref = (p: Product) => "/products/" + p.slug;
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});
export const money = (minor: number) => currencyFormatter.format(minor / 100);
export function priceLabel(p: Product) {
  if (p.pricingMode === "quote_required") return "Price on enquiry";
  const prices = p.variants
    .filter((v) => v.available)
    .map((v) => v.effectivePriceMinor)
    .filter((n) => n > 0);
  return (
    (prices.length > 1 ? "From " : "") +
    money(prices.length ? Math.min(...prices) : p.effectivePriceMinor)
  );
}
export const findProduct = (slug: string) =>
  products.find((p) => p.slug === slug);
