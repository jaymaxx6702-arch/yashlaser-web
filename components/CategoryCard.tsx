import Link from "next/link";
import { categoryHref, type Category } from "@/data/catalog";
import { ProductVisual } from "./ProductVisual";
export function CategoryCard({
  category,
  index,
}: {
  category: Category;
  index: number;
}) {
  return (
    <Link href={categoryHref(category.id)} className="category-card">
      <div className="category-image">
        <span className="category-number">0{index + 1}</span>
        <ProductVisual
          category={category.id === "other" ? "name-plates" : category.id}
        />
      </div>
      <div className="category-title">
        <h3>{category.shortName}</h3>
        <span aria-hidden="true">↗</span>
      </div>
      <p>{category.description}</p>
    </Link>
  );
}
