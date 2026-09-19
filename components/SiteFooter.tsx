import Link from "next/link";
import { categories, categoryHref } from "@/data/catalog";
import { business, whatsappUrl } from "@/data/business";
import { Brand } from "./Brand";
export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        <div>
          <Brand />
          <p>
            For the moments, milestones and names
            <br />
            that deserve something personal.
          </p>
          <span className="eyebrow">Established 1997</span>
        </div>
        <div>
          <h2>Explore the collection</h2>
          <ul>
            {categories.map((c) => (
              <li key={c.id}>
                <Link href={categoryHref(c.id)}>{c.shortName}</Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2>Let’s make it personal</h2>
          <p>{business.address}</p>
          <p>
            <a
              href={whatsappUrl(
                "Hello Yash Laser, I would like to discuss a customised product.",
              )}
            >
              WhatsApp: {business.phone}
            </a>
            <br />
            <a href="tel:+919427494264">{business.alternate}</a>
            <br />
            <a href={"mailto:" + business.email}>{business.email}</a>
          </p>
          <Link className="text-link" href="/contact">
            Contact & enquiries ↗
          </Link>
          <br />
          <Link className="text-link" href="/bulk-orders">
            Bulk orders ↗
          </Link>
          <br />
          <Link className="text-link" href="/plan-my-event">
            Plan my event ↗
          </Link>
          <br />
          <Link className="text-link" href="/custom-acrylic">
            Custom acrylic ↗
          </Link>
          <br />
          <Link className="text-link" href="/support">
            Support ↗
          </Link>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© {new Date().getFullYear()} Yash Laser</span>
        <Link href="/privacy">Privacy & customer artwork</Link>
      </div>
    </footer>
  );
}
