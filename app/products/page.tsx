import type { Metadata } from "next";
import { Catalogue, type CatalogueParams } from "@/components/Catalogue";
import { categories } from "@/data/catalog";
export const metadata: Metadata = {
  title: "Our Collection",
  description:
    "Explore personalised standees, trophies, keychains, I-cards, name plates and more from Yash Laser.",
  alternates: { canonical: "/products" },
};
export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<CatalogueParams>;
}) {
  const params = await searchParams;
  return (
    <Catalogue
      params={params}
      category={categories.find((c) => c.id === params.category)}
    />
  );
}
