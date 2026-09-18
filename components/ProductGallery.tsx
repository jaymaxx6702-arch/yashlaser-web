"use client";
import Image from "next/image";
import { useState } from "react";
import type { Product } from "@/data/catalog";
export function ProductGallery({
  images,
  name,
}: {
  images: Product["images"];
  name: string;
}) {
  const photos = images.filter((i) => i.src);
  const [selected, setSelected] = useState(0);
  const photo = photos[selected];
  return (
    <section className="product-gallery" aria-label={name + " photographs"}>
      <div className="gallery-main">
        {photo?.src ? (
          <Image
            src={photo.src}
            alt={photo.alt}
            width={photo.width ?? 800}
            height={photo.height ?? 800}
            sizes="(max-width: 760px) 90vw, 50vw"
            priority
          />
        ) : (
          <p>Photograph available on enquiry</p>
        )}
      </div>
      {photos.length > 1 && (
        <div className="gallery-thumbnails">
          {photos.map((p, i) => (
            <button
              type="button"
              key={p.id}
              aria-label={"View photograph " + (i + 1)}
              aria-pressed={selected === i}
              onClick={() => setSelected(i)}
            >
              <Image src={p.src!} alt="" width={80} height={80} />
            </button>
          ))}
        </div>
      )}
    </section>
  );
}
