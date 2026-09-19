import Link from "next/link";
import { categoryHref, type Category } from "@/data/catalog";
import { ProductVisual } from "./ProductVisual";
export function CategoryCard({
  category,
  index,
  prefix = "",
  displayName,
  description,
}: {
  category: Category;
  index: number;
  prefix?: string;
  displayName?: string;
  description?: string;
}) {
  return (
    <Link href={prefix + categoryHref(category.id)} className="category-card">
      <div className="category-image">
        <span className="category-number">0{index + 1}</span>
        <ProductVisual
          category={category.id === "other" ? "name-plates" : category.id}
        />
      </div>
      <div className="category-title">
        <h3>{displayName || category.shortName}</h3>
        <span aria-hidden="true">↗</span>
      </div>
      <p>{description || category.description}</p>
    </Link>
  );
}
