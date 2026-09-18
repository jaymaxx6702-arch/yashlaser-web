import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Catalogue, type CatalogueParams } from "@/components/Catalogue";
import { categories, categoryHref } from "@/data/catalog";
export function generateStaticParams() {
  return categories.map((c) => ({ slug: c.id }));
}
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const c = categories.find((c) => c.id === slug);
  return c
    ? {
        title: c.name,
        description: c.description,
        alternates: { canonical: categoryHref(c.id) },
      }
    : { title: "Category not found" };
}
export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<CatalogueParams>;
}) {
  const { slug } = await params;
  const category = categories.find((c) => c.id === slug);
  if (!category) notFound();
  return <Catalogue category={category} params={await searchParams} />;
}
