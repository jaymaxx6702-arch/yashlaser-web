import Link from "next/link";
import { notFound } from "next/navigation";
import { CategoryCard } from "@/components/CategoryCard";
import { ProductCard } from "@/components/ProductCard";
import { categories, products } from "@/data/catalog";
import { categoryCopy, homeCopy, isUiLanguage, uiCopy } from "@/lib/i18n";

const storyCopy = {
  en: {
    eyebrow: "Our story",
    title: "Personalisation, made with care since 1997.",
    text: "Yash Laser brings together design, acrylic craftsmanship and practical production workflows to create personalised products for people, schools, institutions and events.",
  },
  gu: {
    eyebrow: "અમારી કહાની",
    title: "1997થી કાળજીપૂર્વક વ્યક્તિગત પ્રોડક્ટ્સ.",
    text: "Yash Laser ડિઝાઇન, એક્રેલિક કારીગરી અને વ્યવસ્થિત પ્રોડક્શનને જોડીને લોકો, શાળાઓ, સંસ્થાઓ અને ઇવેન્ટ્સ માટે વ્યક્તિગત પ્રોડક્ટ્સ બનાવે છે.",
  },
  hi: {
    eyebrow: "हमारी कहानी",
    title: "1997 से ध्यानपूर्वक व्यक्तिगत प्रोडक्ट.",
    text: "Yash Laser डिज़ाइन, ऐक्रेलिक कारीगरी और व्यवस्थित प्रोडक्शन को जोड़कर लोगों, स्कूलों, संस्थाओं और इवेंट्स के लिए व्यक्तिगत प्रोडक्ट बनाता है.",
  },
  mr: {
    eyebrow: "आमची कथा",
    title: "1997 पासून काळजीपूर्वक वैयक्तिक प्रॉडक्ट.",
    text: "Yash Laser डिझाइन, अॅक्रिलिक कारागिरी आणि व्यवस्थित प्रॉडक्शन एकत्र करून व्यक्ती, शाळा, संस्था आणि इव्हेंटसाठी वैयक्तिक प्रॉडक्ट तयार करते.",
  },
} as const;

export default async function LocalizedHome({
  params,
}: {
  params: Promise<{ lang: string }>;
}) {
  const { lang } = await params;
  if (!isUiLanguage(lang)) notFound();
  const home = homeCopy[lang];
  const copy = uiCopy[lang];
  const story = storyCopy[lang];
  const prefix = "/" + lang;

  return (
    <main id="main-content" lang={lang}>
      <section className="container hero">
        <div className="hero-copy">
          <p className="eyebrow"><span className="gold-line" /> {home.eyebrow}</p>
          <h1>{home.title}</h1>
          <p className="hero-description">{home.description}</p>
          <div className="hero-actions">
            <Link className="button" href={prefix + "/products"}>
              {home.explore} <span aria-hidden="true">↗</span>
            </Link>
            <Link className="text-link" href="#collections">
              {home.inspiration} <span aria-hidden="true">↓</span>
            </Link>
          </div>
        </div>
      </section>

      <section className="container section" id="collections">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{home.sectionEyebrow}</p>
            <h2>{home.sectionTitle}</h2>
          </div>
          <p>{home.sectionDescription}</p>
        </div>
        <div className="category-grid">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              prefix={prefix}
              displayName={categoryCopy[lang][category.id].shortName}
              description={categoryCopy[lang][category.id].description}
            />
          ))}
        </div>
      </section>

      <section className="featured-section">
        <div className="container section">
          <div className="section-heading">
            <div>
              <p className="eyebrow">{home.featuredEyebrow}</p>
              <h2>{home.featuredTitle}</h2>
            </div>
            <Link href={prefix + "/products"} className="text-link">
              {home.allProducts} <span aria-hidden="true">↗</span>
            </Link>
          </div>
          <div className="product-grid">
            {products.filter((p) => p.featured).map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                prefix={prefix}
                actionLabel={copy.personalise}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="container section" id="our-story">
        <div className="section-heading">
          <div>
            <p className="eyebrow">{story.eyebrow}</p>
            <h2>{story.title}</h2>
          </div>
          <p>{story.text}</p>
        </div>
      </section>

      <section className="container closing">
        <span className="eyebrow">{home.bulkTitle}</span>
        <h2>{home.bulkDescription}</h2>
        <div className="hero-actions">
          <Link className="button" href={prefix + "/bulk-orders"}>
            {lang === "gu" ? "બલ્ક રિક્વેસ્ટ" : lang === "hi" ? "बल्क रिक्वेस्ट" : lang === "mr" ? "बल्क रिक्वेस्ट" : "Bulk request"} ↗
          </Link>
          <Link className="text-link" href={prefix + "/plan-my-event"}>
            {lang === "gu" ? "ઇવેન્ટ પ્લાન કરો" : lang === "hi" ? "इवेंट प्लान करें" : lang === "mr" ? "इव्हेंट प्लॅन करा" : "Plan my event"} ↗
          </Link>
        </div>
      </section>
    </main>
  );
}
