import Link from "next/link";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { ProductVisual } from "@/components/ProductVisual";
import { categories, products } from "@/data/catalog";
export default function Home() {
  return (
    <main id="main-content">
      <section className="container hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="gold-line" /> Thoughtfully personal. Since 1997.
          </p>
          <h1>
            Ordinary things.
            <br />
            <em>Extraordinary</em>
            <br />
            meaning.
          </h1>
          <p className="hero-description">
            Your memories, your milestones, your identity.
            <br className="desktop-break" /> Discover products made more
            meaningful
            <br className="desktop-break" /> with a personal touch.
          </p>
          <div className="hero-actions">
            <Link className="button" href="/products">
              Explore the collection <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="#collections">
              Find your inspiration <span aria-hidden="true">↓</span>
            </Link>
          </div>
          <div className="hero-note">
            <span className="small-spark" aria-hidden="true">
              ✧
            </span>{" "}
            Made for a moment. Kept for a lifetime.
          </div>
        </div>
        <div className="hero-art">
          <div className="hero-art-top">
            <span>THE PERSONAL COLLECTION</span>
            <span>01 / 06</span>
          </div>
          <div className="hero-disc" />
          <ProductVisual category="standees" className="hero-standee" />
          <div className="hero-inset">
            <ProductVisual category="keychains" />
            <span>
              Small details.
              <br />
              Personal stories.
            </span>
          </div>
          <div className="hero-art-caption">
            <div>
              <span className="eyebrow">Memories, on display</span>
              <p>Acrylic photo standees</p>
            </div>
            <Link
              href="/products?category=standees"
              aria-label="Explore acrylic photo standees"
            >
              ↗
            </Link>
          </div>
          <span className="art-disclaimer">Illustrative product artwork</span>
        </div>
      </section>
      <div className="values-strip">
        <div className="container">
          <span>
            ESTABLISHED <strong>1997</strong>
          </span>
          <span>Gifts with meaning</span>
          <span>Recognition with character</span>
          <span>Identity with distinction</span>
        </div>
      </div>
      <section className="container section" id="collections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">A little inspiration</p>
            <h2>
              Something personal.
              <br />
              For every part of life.
            </h2>
          </div>
          <p>
            From thoughtful keepsakes to proud achievements,
            <br className="desktop-break" /> explore a collection of
            possibilities.
          </p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} />
          ))}
        </div>
      </section>
      <section className="featured-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">The showroom edit</p>
              <h2>Ideas worth making yours.</h2>
            </div>
            <Link href="/products" className="text-link">
              View all products <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="product-grid">
            {products
              .filter((p) => p.featured)
              .map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
          </div>
          <p className="catalogue-note">
            Choose your product, share your idea and approve a digital mockup
            before production.
          </p>
        </div>
      </section>
      <section id="our-story" className="container story section">
        <div className="story-year">
          <span className="eyebrow">Our beginning</span>
          <span className="year">
            1997<span>.</span>
          </span>
          <span className="story-signature">Yash Laser</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">A name behind the personal touch</p>
          <h2>
            Some things deserve
            <br />
            to be more personal.
          </h2>
          <p>
            Established in 1997, Yash Laser brings together customised gifts,
            recognition products and everyday identity essentials.
          </p>
          <p>
            A photograph. A name. A few meaningful words. Our collection starts
            with the details that make something yours.
          </p>
          <Link href="/products" className="text-link">
            Discover the collection <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </section>
      <section className="container closing">
        <span className="eyebrow">For someone. For a milestone. For you.</span>
        <h2>
          Every idea starts with
          <br />
          <em>a personal connection.</em>
        </h2>
        <Link href="/products" className="button">
          Find your starting point <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}
