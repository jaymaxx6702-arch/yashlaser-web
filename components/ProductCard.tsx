import Image from "next/image";
import Link from "next/link";
import { priceLabel, productHref, type Product } from "@/data/catalog";
export function ProductCard({ product, prefix = "", actionLabel = "View & personalise" }: { product: Product; prefix?: string; actionLabel?: string }) {
  const image = product.images.find((i) => i.src);
  return (
    <article className="product-card">
      <Link
        href={prefix + productHref(product)}
        className="product-image"
        aria-label={product.name}
      >
        {image?.src ? (
          <Image
            src={image.src}
            alt={image.alt}
            width={image.width ?? 600}
            height={image.height ?? 600}
            sizes="(max-width: 760px) 90vw, (max-width: 1100px) 45vw, 30vw"
          />
        ) : (
          <span>Photo coming soon</span>
        )}
      </Link>
      <div className="product-copy">
        <p className="eyebrow">{product.label}</p>
        <h3>
          <Link href={prefix + productHref(product)}>{product.name}</Link>
        </h3>
        <p className="card-description">{product.description}</p>
        <p className="product-price">{priceLabel(product)}</p>
        <Link className="text-link" href={prefix + productHref(product)}>
          {actionLabel} ↗
        </Link>
      </div>
    </article>
  );
}
